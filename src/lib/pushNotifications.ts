import { setOneSignalUserNis, initOneSignal, getOneSignalSubscriptionId } from './oneSignal';
import { supabase } from './supabase';

export async function syncOneSignalUser(nis?: string | null): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    await initOneSignal("f7a12012-b192-4c27-a7bb-d6ffeb570fb4");
    if (nis) {
      await setOneSignalUserNis(nis);
      console.log('OneSignal User linked to NIS:', nis);
      
      const subId = await getOneSignalSubscriptionId();
      if (subId) {
        await upsertOneSignalSubscriptionToSupabase(subId, nis);
      }
    }
  } catch (err) {
    console.warn('OneSignal sync notice:', err);
  }
}

export async function upsertOneSignalSubscriptionToSupabase(subscriptionId: string, nis: string): Promise<boolean> {
  try {
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'web';
    const payload = {
      subscription_id: subscriptionId,
      nis: nis,
      platform: 'web',
      user_agent: userAgent,
      updated_at: new Date().toISOString()
    };

    // We check if a record with this subscription_id exists, otherwise we insert
    const { data: existing } = await supabase
      .from('onesignal_subscriptions')
      .select('id')
      .eq('subscription_id', subscriptionId)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('onesignal_subscriptions')
        .update(payload)
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('onesignal_subscriptions')
        .insert([payload]);
      if (error) throw error;
    }

    console.log('OneSignal Subscription synced to Supabase onesignal_subscriptions');
    return true;
  } catch (err) {
    console.warn('Failed to sync OneSignal subscription to Supabase:', err);
    return false;
  }
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const swReg = await navigator.serviceWorker.register('/OneSignalSDKWorker.js');
      return swReg;
    } catch (swErr) {
      console.warn('Service Worker registration notice:', swErr);
      return null;
    }
  }
  return null;
}

export async function requestNotificationPermission(nis?: string | null): Promise<{
  permission: NotificationPermission;
}> {
  if (!('Notification' in window)) {
    console.warn('Browser ini tidak mendukung Notifikasi Web');
    return { permission: 'denied' };
  }

  const permission = await Notification.requestPermission();

  if (permission === 'granted' && nis) {
    await syncOneSignalUser(nis);
  }

  return { permission };
}

export function getNotificationPermissionState(): NotificationPermission {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
}

export async function sendWebPushNotification(title: string, options?: NotificationOptions) {
  if (!('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    const swReg = await navigator.serviceWorker.getRegistration();
    const defaultOptions: NotificationOptions & { vibrate?: number[] } = {
      icon: '/logo.png',
      badge: '/logo.png',
      vibrate: [100, 50, 100],
      ...options
    };

    if (swReg && 'showNotification' in swReg) {
      await swReg.showNotification(title, defaultOptions as any);
    } else {
      new Notification(title, defaultOptions);
    }
  }
}



