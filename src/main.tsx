import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Registrasi Service Worker & Periodic Background Sync (15 Menit) untuk PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Jalankan cek versi segera saat aplikasi dimuat
    checkAppVersion();
    
    // Gunakan query param statis untuk cache busting manual jika diperlukan, 
    // jangan gunakan Date.now() karena akan menyebabkan infinite reload loop.
    const swUrl = '/sw.js?v=1.2.4'; 
    navigator.serviceWorker.register(swUrl, { updateViaCache: 'none' })
      .then(async (registration) => {
        console.log('ServiceWorker berhasil diregistrasi dengan scope:', registration.scope);

        // Paksa cek pembaruan file & fitur di server setiap kali link/aplikasi dibuka
        registration.update();

        // Interval untuk cek pembaruan setiap 5 menit (dikurangi agresivitasnya agar stabil)
        setInterval(() => {
          registration.update();
          checkAppVersion();
        }, 5 * 60 * 1000);

        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('Fitur/Versi baru ditemukan. Memperbarui halaman secara otomatis...');
                // Gunakan timeout sebentar agar service worker baru aktif sepenuhnya
                setTimeout(() => {
                  window.location.reload();
                }, 1000);
              }
            });
          }
        });

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

    // Otomatis reload jika controller service worker diperbarui
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
}

// Fungsi pembantu untuk cek versi aplikasi dari server
async function checkAppVersion() {
  try {
    const res = await fetch('/version.json?t=' + Date.now());
    const data = await res.json();
    const localVersion = localStorage.getItem('app_version_cache');
    
    if (localVersion && data.version !== localVersion) {
      console.log('Versi baru terdeteksi via version.json:', data.version);
      localStorage.setItem('app_version_cache', data.version);
      
      // Hapus cache service worker secara eksplisit jika memungkinkan
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
      }
      
      // Berikan jeda untuk pembersihan cache lalu reload
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      localStorage.setItem('app_version_cache', data.version);
    }
  } catch (e) {
    // Ignore version check errors
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
