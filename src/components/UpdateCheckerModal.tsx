import React, { useState, useEffect } from 'react';
import { RefreshCw, Download, Sparkles, CheckCircle2, ShieldAlert, ArrowUpCircle, X } from 'lucide-react';

interface AppConfig {
  version: string;
  build_number: number;
  release_date: string;
  force_update: boolean;
  update_message: string;
  maintenance?: boolean;
  maintenance_message?: string;
}

interface UpdateCheckerModalProps {
  manualCheckTrigger?: number;
  onUpdateDismiss?: () => void;
}

export const CURRENT_CLIENT_VERSION = '1.2.0'; // Base installed version in cached bundle

export const UpdateCheckerModal: React.FC<UpdateCheckerModalProps> = ({
  manualCheckTrigger = 0,
  onUpdateDismiss,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [updateConfig, setUpdateConfig] = useState<AppConfig | null>(null);
  const [installedVersion, setInstalledVersion] = useState<string>('1.2.0');
  const [isUpToDateNotice, setIsUpToDateNotice] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const lastCheckedRef = React.useRef<number>(0);

  const checkVersion = async (isManual = false) => {
    const now = Date.now();
    // Prevent double/spam checking if checked within the last 15 seconds (unless it's a manual check)
    if (!isManual && now - lastCheckedRef.current < 15000) {
      return;
    }
    lastCheckedRef.current = now;

    setIsChecking(true);
    setIsUpToDateNotice(false);

    try {
      const storedVersion = localStorage.getItem('app_installed_version') || CURRENT_CLIENT_VERSION;
      setInstalledVersion(storedVersion);

      const response = await fetch(`/app_config.json?t=${Date.now()}`).catch((fetchErr) => {
        console.warn('[UpdateChecker] Network or offline issue checking app_config.json:', fetchErr);
        return null;
      });

      if (!response || !response.ok) {
        if (isManual) {
          alert('Gagal memeriksa pembaruan. Pastikan koneksi internet Anda terhubung.');
        }
        return;
      }

      const responseText = await response.text();
      if (!responseText || responseText.trim().startsWith('<') || responseText.includes('Offline')) {
        // Not valid JSON (e.g. SPA fallback index.html or offline message)
        return;
      }

      let config: AppConfig;
      try {
        config = JSON.parse(responseText);
      } catch (parseErr) {
        console.warn('[UpdateChecker] Invalid JSON in app_config.json:', parseErr);
        return;
      }

      setUpdateConfig(config);

      // Compare versions
      const serverVer = config.version;
      const isOutdated = compareVersions(storedVersion, serverVer) < 0;

      if (isOutdated) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
        if (isManual) {
          setIsUpToDateNotice(true);
          setTimeout(() => setIsUpToDateNotice(false), 4000);
        }
      }
    } catch (err) {
      console.warn('[UpdateChecker] Unable to complete version check:', err);
      if (isManual) {
        alert('Gagal memeriksa pembaruan. Pastikan koneksi internet Anda terhubung.');
      }
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Run on initial app load / open link
    checkVersion(false);

    // Listen for when the app is opened, focused, or brought back from background (PWA or web)
    const handleFocusOrVisible = () => {
      if (document.visibilityState === 'visible') {
        checkVersion(false);
      }
    };

    window.addEventListener('focus', handleFocusOrVisible);
    document.addEventListener('visibilitychange', handleFocusOrVisible);

    return () => {
      window.removeEventListener('focus', handleFocusOrVisible);
      document.removeEventListener('visibilitychange', handleFocusOrVisible);
    };
  }, []);

  useEffect(() => {
    if (manualCheckTrigger > 0) {
      checkVersion(true);
    }
  }, [manualCheckTrigger]);

  const compareVersions = (v1: string, v2: string): number => {
    const p1 = v1.split('.').map(Number);
    const p2 = v2.split('.').map(Number);
    const maxLen = Math.max(p1.length, p2.length);

    for (let i = 0; i < maxLen; i++) {
      const num1 = p1[i] || 0;
      const num2 = p2[i] || 0;
      if (num1 < num2) return -1;
      if (num1 > num2) return 1;
    }
    return 0;
  };

  const handleApplyUpdate = async () => {
    setIsUpdating(true);
    try {
      if (updateConfig?.version) {
        localStorage.setItem('app_installed_version', updateConfig.version);
      }

      // Unregister any service workers to get fresh bundle
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      }

      // Clear caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((c) => caches.delete(c)));
      }

      // Short delay so user sees feedback spinner before reload
      await new Promise((resolve) => setTimeout(resolve, 800));
    } catch (e) {
      console.warn('Error clearing caches during update:', e);
    } finally {
      // Reload page cleanly with timestamp query parameter
      window.location.href = window.location.pathname + '?v=' + Date.now();
    }
  };

  return (
    <>
      {/* Toast Notice when App is already Up to Date */}
      {isUpToDateNotice && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <div>
            <div className="text-xs font-bold">Aplikasi Versi Terbaru</div>
            <div className="text-[11px] text-slate-300">Anda sudah menggunakan versi v{installedVersion}</div>
          </div>
          <button
            onClick={() => setIsUpToDateNotice(false)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Mandatory / Recommended Update Modal */}
      {isOpen && updateConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden relative">
            {/* Modal Header */}
            <div className="bg-gradient-to-br from-indigo-600 via-sky-600 to-blue-700 p-6 text-white text-center relative">
              <div className="w-16 h-16 bg-white/15 rounded-2xl backdrop-blur-md flex items-center justify-center mx-auto mb-3 border border-white/20 shadow-inner">
                <ArrowUpCircle className="h-10 w-10 text-white animate-bounce" />
              </div>
              <span className="bg-white/20 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full border border-white/30 tracking-widest">
                Update Aplikasi Tersedia
              </span>
              <h3 className="text-xl font-black mt-2">Pembaruan Versi {updateConfig.version}</h3>
              <p className="text-xs text-sky-100 mt-1 font-medium">
                Sistem telah diperbarui untuk performa & fitur terbaik.
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs space-y-2">
                <div className="flex justify-between items-center text-slate-600 font-bold border-b border-slate-200 pb-2">
                  <span>Versi Terpasang Saat Ini:</span>
                  <span className="text-rose-600 font-extrabold bg-rose-50 px-2 py-0.5 rounded-md">v{installedVersion}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 font-bold pt-1">
                  <span>Versi Terbaru Rilis:</span>
                  <span className="text-emerald-600 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-md">v{updateConfig.version}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-sky-600" />
                  Catatan Pembaruan:
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed bg-sky-50/60 p-3 rounded-xl border border-sky-100/80">
                  {updateConfig.update_message}
                </p>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  onClick={handleApplyUpdate}
                  disabled={isUpdating}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                >
                  {isUpdating ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Memperbarui Aplikasi...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      <span>Update Aplikasi Sekarang</span>
                    </>
                  )}
                </button>
                {!updateConfig.force_update && (
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      if (onUpdateDismiss) onUpdateDismiss();
                    }}
                    className="w-full mt-2 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition"
                  >
                    Nanti Saja
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
