import React, { useState } from 'react';
import { Download, X, Smartphone, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallBannerProps {
  onOpenGuide: () => void;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({ onOpenGuide }) => {
  const { isInstalled, isInstallable, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  // If already installed or user dismissed the banner, don't show
  if (isInstalled || dismissed) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setDismissed(true);
        return;
      }
    }
    // Fallback: open guide modal
    onOpenGuide();
  };

  return (
    <div className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 text-white shadow-md transition-all duration-300 relative z-30">
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:px-6 lg:px-8 flex items-center justify-between gap-3 text-xs">
        
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md p-1 shrink-0 border border-white/20 flex items-center justify-center">
            <img src="/pwa-192x192.png" alt="Icon" className="w-full h-full object-contain rounded-lg" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-white truncate flex items-center gap-1.5">
              <span>Pasang Aplikasi Rapor Siswa</span>
              <span className="hidden sm:inline-block bg-amber-400 text-amber-950 text-[9px] font-black px-1.5 py-0.2 rounded-sm uppercase tracking-wider">
                PWA
              </span>
            </p>
            <p className="text-[11px] text-sky-100 hidden sm:block truncate">
              Akses cepat jadwal, nilai & notifikasi tanpa buka browser terus-menerus.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInstallClick}
            className="px-3.5 py-1.5 bg-white hover:bg-sky-50 text-sky-700 font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 text-xs active:scale-95 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-sky-600" />
            <span>{isInstallable ? 'Instal Sekarang' : 'Pasang di HP'}</span>
          </button>

          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sky-100 hover:text-white transition cursor-pointer"
            title="Tutup banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
