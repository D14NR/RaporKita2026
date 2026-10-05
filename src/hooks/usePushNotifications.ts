import { useState, useEffect, useCallback } from 'react';
import { baseApiUrl } from '../lib/d1';
import { DataSiswa } from '../types';

// VAPID Public Key for Web Push (Should match the one in Cloudflare Worker)
const VAPID_PUBLIC_KEY = 'BPP_X09rW_Z0v2H6U_pZ9y4Vp9uXpXpXpXpXpXpXpXpXpXpXpXpXpXpXpXpXpXpXpXpXpXpXpXpXpXpX'; 

export function usePushNotifications(student: DataSiswa | null) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, [student?.nis]);

  const checkSubscription = async () => {
    if (!('serviceWorker' in navigator)) return;
    
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      setIsSubscribed(!!sub);
      setSubscription(sub);
      
      // If we have a subscription but it's not registered for this NIS in backend, we should re-sync
      // This is handled in the syncSubscription function
    } catch (err) {
      console.warn('[Push] Error checking subscription:', err);
    }
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribe = async () => {
    if (!student?.nis) return false;
    if (!('serviceWorker' in navigator)) return false;

    setLoading(true);
    try {
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        throw new Error('Izin notifikasi ditolak.');
      }

      const registration = await navigator.serviceWorker.ready;
      
      // Get existing or create new subscription
      let sub = await registration.pushManager.getSubscription();
      
      if (!sub) {
        // Use a generic public key if not provided or valid
        // In real app, this comes from server / VAPID generation
        const publicKey = VAPID_PUBLIC_KEY.length > 20 ? VAPID_PUBLIC_KEY : 'BGmZ9v-yX_f...'; 
        
        try {
          sub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey)
          });
        } catch (subErr) {
          console.error('[Push] Subscription failed:', subErr);
          // Fallback: request without key if allowed or show error
          throw subErr;
        }
      }

      // Send to backend
      const response = await fetch(`${baseApiUrl}/db/push_subscriptions_siswa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nis: student.nis,
          nama_siswa: student.nama || student.nama_lengkap || 'Siswa',
          endpoint: sub.endpoint,
          p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(sub.getKey('p256dh')!) as any)),
          auth: btoa(String.fromCharCode.apply(null, new Uint8Array(sub.getKey('auth')!) as any)),
          cabang: student.cabang || 'Pusat'
        })
      });

      if (!response.ok) throw new Error('Gagal mendaftarkan perangkat ke server.');

      setIsSubscribed(true);
      setSubscription(sub);
      return true;
    } catch (err) {
      console.error('[Push] Error subscribing:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    if (!subscription) return true;
    
    setLoading(true);
    try {
      // 1. Unsubscribe from browser
      await subscription.unsubscribe();
      
      // 2. Remove from backend
      await fetch(`${baseApiUrl}/push/unsubscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint, nis: student?.nis })
      });

      setIsSubscribed(false);
      setSubscription(null);
      return true;
    } catch (err) {
      console.error('[Push] Error unsubscribing:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    permission,
    isSubscribed,
    loading,
    subscribe,
    unsubscribe,
    checkSubscription
  };
}
