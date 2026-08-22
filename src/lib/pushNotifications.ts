// Web Push Notification Utilities
import { baseApiUrl, d1 } from './d1';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const swReg = await navigator.serviceWorker.register('/sw.js');
      return swReg;
    } catch (swErr) {
      console.warn('Service Worker registration notice:', swErr);
      return null;
    }
  }
  return null;
}

export async function requestNotificationPermission(
  nis?: string | null,
  studentInput?: any
): Promise<{
  permission: NotificationPermission;
}> {
  if (!('Notification' in window)) {
    console.warn('Browser ini tidak mendukung Notifikasi Web');
    return { permission: 'denied' };
  }

  const resolvedNis = (nis || localStorage.getItem('active_nis') || sessionStorage.getItem('active_nis') || '').trim();

  console.log('[Push] Requesting notification permission...');
  const permission = await Notification.requestPermission();
  console.log('[Push] Permission result:', permission, 'Resolved NIS:', resolvedNis || '(missing)');

  if (permission === 'granted' && resolvedNis) {
    console.log('[Push] Permission granted, subscribing for NIS:', resolvedNis);
    try {
      const subscribed = await subscribePushNotifications(resolvedNis, studentInput);
      console.log('[Push] Subscription result:', subscribed);
    } catch (err) {
      console.error('[Push] Failed to subscribe push notifications:', err);
    }
  } else {
    console.warn('[Push] Permission not granted or NIS missing. Permission:', permission, 'NIS:', resolvedNis || 'empty');
  }

  return { permission };
}

export async function subscribePushNotifications(nis: string, studentInput?: any): Promise<boolean> {
  console.log('[Push] subscribePushNotifications called for NIS:', nis);
  
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.error('[Push] Push notifications tidak didukung browser ini');
    return false;
  }

  try {
    console.log('[Push] Getting service worker registration...');
    const swReg = await navigator.serviceWorker.ready;
    console.log('[Push] Service worker ready:', swReg);
    
    // Check if already subscribed
    console.log('[Push] Checking for existing subscription...');
    let subscription = await swReg.pushManager.getSubscription();
    console.log('[Push] Existing subscription:', subscription ? 'found' : 'none');
    
    if (!subscription) {
      // Subscribe to push notifications
      console.log('[Push] Creating new push subscription...');
      const vapidPublicKey = VAPID_PUBLIC_KEY;
      console.log('[Push] VAPID_PUBLIC_KEY available:', !!vapidPublicKey);
      
      if (!vapidPublicKey) {
        console.error('[Push] VAPID_PUBLIC_KEY tidak dikonfigurasi!');
        return false;
      }

      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
      console.log('[Push] VAPID key converted, subscribing...');
      
      subscription = await swReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });
      console.log('[Push] New subscription created:', subscription.endpoint.substring(0, 50) + '...');
    }

    if (subscription) {
      // Simpan subscription ke D1
      console.log('[Push] Saving subscription to D1...');
      const saved = await savePushSubscriptionToDB(nis, subscription, studentInput);
      console.log('[Push] Subscription saved to D1:', saved);
      return saved;
    }

    console.warn('[Push] No subscription obtained');
    return false;
  } catch (err) {
    console.error('[Push] Error subscribing to push notifications:', err);
    return false;
  }
}

async function savePushSubscriptionToDB(
  nis: string,
  subscription: PushSubscription,
  studentInput?: any
): Promise<boolean> {
  try {
    console.log('[Push] Extracting subscription data...');
    const subscriptionJson = subscription.toJSON();
    const endpoint = subscription.endpoint;
    const p256dh = subscriptionJson.keys?.p256dh || '';
    const auth = subscriptionJson.keys?.auth || '';

    console.log('[Push] Subscription data extracted:');
    console.log('  - endpoint:', endpoint.substring(0, 50) + '...');
    console.log('  - p256dh:', p256dh ? 'present' : 'MISSING');
    console.log('  - auth:', auth ? 'present' : 'MISSING');

    if (!endpoint || !p256dh || !auth) {
      console.error('[Push] Invalid subscription keys!', { endpoint: !!endpoint, p256dh: !!p256dh, auth: !!auth });
      return false;
    }

    // Get student details from D1 or input
    console.log('[Push] Fetching student data for NIS:', nis);
    const { data: dbStudent, error: fetchError } = await d1
      .from('data_siswa')
      .select('nama, nama_lengkap, kelompok_kelas, jenjang_studi, cabang')
      .eq('nis', nis)
      .maybeSingle();

    if (fetchError) {
      console.error('[Push] Error fetching student data:', fetchError);
    }

    const namaSiswa = dbStudent?.nama || dbStudent?.nama_lengkap || studentInput?.nama || studentInput?.nama_lengkap || 'Unknown';
    const kelas = dbStudent?.kelompok_kelas || dbStudent?.jenjang_studi || studentInput?.kelompok_kelas || studentInput?.jenjang_studi || '-';
    const cabang = dbStudent?.cabang || studentInput?.cabang || '-';

    const now = new Date().toISOString();
    const payload = {
      nis,
      nama_siswa: namaSiswa,
      kelas,
      cabang,
      endpoint,
      p256dh,
      auth,
      updated_at: now,
    };

    const existingResponse = await fetch(`${baseApiUrl}/db/push_subscriptions_siswa`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    const existingRows = await existingResponse.json().catch(() => []);
    const rows = Array.isArray(existingRows)
      ? existingRows
      : Array.isArray(existingRows?.data)
        ? existingRows.data
        : [];

    const sameNisRows = rows.filter((row: any) => String(row.nis || '') === String(nis));
    const sameEndpointRow = sameNisRows.find((row: any) => String(row.endpoint || '') === String(endpoint));

    if (sameEndpointRow?.id) {
      console.log('[Push] Subscription already exists for this student and endpoint. Updating existing record:', sameEndpointRow.id);
      const updateRes = await fetch(`${baseApiUrl}/db/push_subscriptions_siswa/${sameEndpointRow.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          ...sameEndpointRow,
          ...payload,
          id: sameEndpointRow.id,
          created_at: sameEndpointRow.created_at || now,
          updated_at: now,
        }),
      });

      const updateResult = await updateRes.json().catch(() => ({}));
      console.log('[Push] Existing record updated:', updateResult);
      return updateRes.ok || updateResult?.success !== false;
    }

    if (sameNisRows.length > 0) {
      const targetRow = sameNisRows[0];
      console.log('[Push] Same NIS already exists. Updating existing student subscription instead of inserting a new one. Target ID:', targetRow.id);

      const updateRes = await fetch(`${baseApiUrl}/db/push_subscriptions_siswa/${targetRow.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          ...targetRow,
          ...payload,
          id: targetRow.id,
          created_at: targetRow.created_at || now,
          updated_at: now,
        }),
      });

      const updateResult = await updateRes.json().catch(() => ({}));
      console.log('[Push] Updated by NIS:', updateResult);

      for (const duplicate of sameNisRows.slice(1)) {
        if (duplicate?.id) {
          await fetch(`${baseApiUrl}/db/push_subscriptions_siswa/${duplicate.id}`, {
            method: 'DELETE',
            headers: { Accept: 'application/json' },
          });
        }
      }

      return updateRes.ok || updateResult?.success !== false;
    }

    const id = `${nis}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const insertPayload = {
      ...payload,
      id,
      created_at: now,
    };

    console.log('[Push] Saving subscription directly to D1 via REST...');
    console.log('[Push] Data to save:', insertPayload);

    const response = await fetch(`${baseApiUrl}/db/push_subscriptions_siswa`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(insertPayload),
    });

    const result = await response.json().catch(() => ({}));
    console.log('[Push] D1 save response:', result);

    if (!response.ok || result?.success === false) {
      console.error('[Push] Error saving subscription to D1:', result);
      return false;
    }

    console.log('[Push] ✅ Subscription successfully saved to D1!');
    return true;
  } catch (err) {
    console.error('[Push] Failed to save push subscription to D1:', err);
    return false;
  }
}

export function getNotificationPermissionState(): NotificationPermission {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}



