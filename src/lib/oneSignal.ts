// OneSignal Web Push Integration Helper
// File: src/lib/oneSignal.ts

declare global {
  interface Window {
    OneSignalDeferred?: any[];
    OneSignal?: any;
    isOneSignalInitialized?: boolean;
  }
}

export function loadOneSignalSDK(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve();
    if (window.OneSignal) return resolve();

    const existingScript = document.getElementById('onesignal-sdk');
    if (existingScript) return resolve();

    const script = document.createElement('script');
    script.id = 'onesignal-sdk';
    script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });
}

export async function initOneSignal(appId: string = "f7a12012-b192-4c27-a7bb-d6ffeb570fb4"): Promise<boolean> {
  if (typeof window === 'undefined' || !appId) return false;

  try {
    await loadOneSignalSDK();

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal: any) => {
      if (window.isOneSignalInitialized) return;
      
      try {
        await OneSignal.init({
          appId: appId,
          safari_web_id: "web.onesignal.auto.14e17240-829a-4079-8f1d-24e0d0f74783",
          notifyButton: {
            enable: false,
          },
          allowLocalhostAsSecureOrigin: true,
        });
        window.isOneSignalInitialized = true;
        console.log('OneSignal initialized successfully with App ID:', appId);
      } catch (initErr: any) {
        if (initErr?.message?.includes('already initialized') || initErr?.toString().includes('already initialized')) {
          window.isOneSignalInitialized = true;
        } else {
          console.warn('OneSignal initialization domain check notice:', initErr);
        }
      }
    });

    return true;
  } catch (err) {
    console.warn('OneSignal SDK load warning:', err);
    return false;
  }
}

export async function setOneSignalUserNis(nis: string): Promise<void> {
  if (typeof window === 'undefined' || !nis) return;

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal: any) => {
    try {
      // Sets External User ID for OneSignal v16+
      if (typeof OneSignal.login === 'function') {
        await OneSignal.login(nis);
      } else if (OneSignal.User && typeof OneSignal.User.addTag === 'function') {
        await OneSignal.User.addTag('nis', nis);
      }
      console.log('OneSignal external user ID set to NIS:', nis);
    } catch (err) {
      console.warn('OneSignal set external user ID error:', err);
    }
  });
}

export async function logoutOneSignalUser(): Promise<void> {
  if (typeof window === 'undefined') return;

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal: any) => {
    try {
      if (typeof OneSignal.logout === 'function') {
        await OneSignal.logout();
      }
    } catch (err) {
      console.warn('OneSignal logout error:', err);
    }
  });
}

export async function getOneSignalSubscriptionId(): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(null);
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal: any) => {
      try {
        if (OneSignal.User && OneSignal.User.PushSubscription) {
          const id = OneSignal.User.PushSubscription.id;
          resolve(id || null);
        } else {
          resolve(null);
        }
      } catch (err) {
        resolve(null);
      }
    });
  });
}

export async function sendOneSignalRestPush(options: {
  appId: string;
  restApiKey: string;
  targetNis?: string;
  title: string;
  body: string;
}): Promise<any> {
  const { appId, restApiKey, targetNis, title, body } = options;
  
  if (!appId || !restApiKey) {
    throw new Error('OneSignal App ID & REST API Key required');
  }

  const payload: any = {
    app_id: appId,
    headings: { en: title, id: title },
    contents: { en: body, id: body },
    url: typeof window !== 'undefined' ? window.location.origin : 'https://rapor-kita.web.app'
  };

  if (targetNis) {
    payload.include_external_user_ids = [targetNis];
    payload.channel_for_external_user_ids = "push";
  } else {
    payload.included_segments = ["Subscribed Users"];
  }

  const response = await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Authorization": `Basic ${restApiKey}`
    },
    body: JSON.stringify(payload)
  });

  return await response.json();
}
