import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Registrasi Service Worker & Periodic Background Sync (15 Menit) untuk PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/OneSignalSDKWorker.js')
      .then(async (registration) => {
        console.log('ServiceWorker berhasil diregistrasi dengan scope:', registration.scope);

        // Registrasi Periodic Background Sync (otomatis setiap 15 menit)
        if ('periodicSync' in registration) {
          try {
            const status = await (navigator as any).permissions?.query({
              name: 'periodic-background-sync',
            });
            if (!status || status.state === 'granted') {
              await (registration as any).periodicSync.register('sync-rapor-cache', {
                minInterval: 15 * 60 * 1000, // 15 menit
              });
              console.log('Periodic Background Sync 15 menit berhasil didaftarkan.');
            }
          } catch (syncErr) {
            console.log('Periodic sync notice:', syncErr);
          }
        }
      })
      .catch((error) => {
        console.error('Pendaftaran ServiceWorker gagal:', error);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
