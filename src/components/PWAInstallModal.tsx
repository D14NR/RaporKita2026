import React from 'react';
import { 
  X, 
  Download, 
  Share2, 
  PlusSquare, 
  MoreVertical, 
  Smartphone, 
  CheckCircle2, 
  ExternalLink,
  Zap,
  BellRing,
  Sparkles
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, isInIframe, install } = usePWAInstall();

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        onClose();
      }
    }
  };

  const handleOpenNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl max-w-md w-full max-h-[92vh] flex flex-col overflow-hidden transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 p-5 text-white relative shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md p-1.5 shrink-0 border border-white/20 shadow-inner flex items-center justify-center">
              <img src="/pwa-192x192.png" alt="Logo Rapor Siswa" className="w-full h-full object-contain rounded-xl" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-black text-white leading-tight">Instal Rapor Siswa</h3>
                <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                  PWA
                </span>
              </div>
              <p className="text-xs text-sky-100 font-medium mt-0.5">
                Pasang langsung di HP atau Komputer Anda
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-slate-700 dark:text-slate-200 text-xs">
          
          {/* Status if already installed */}
          {isInstalled ? (
            <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 flex items-center gap-3 text-emerald-800 dark:text-emerald-200">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="font-bold text-sm">Aplikasi Sudah Terpasang!</p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-300 mt-0.5">
                  Anda sedang menjalankan versi terinstalasi (Standalone PWA).
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* If one-click install is supported (Chrome/Edge/Android) */}
              {isInstallable && (
                <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sky-900 dark:text-sky-200 font-bold text-sm">
                    <Sparkles className="h-4 w-4 text-sky-600" />
                    <span>Perangkat Mendukung Instal Cepat</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    Klik tombol di bawah untuk memasang ikon aplikasi Rapor Siswa di beranda perangkat Anda tanpa melalui Play Store / App Store.
                  </p>
                  <button
                    onClick={handleInstallClick}
                    className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-500 active:scale-98 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-sky-600/20 transition cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    <span>Pasang Aplikasi Sekarang</span>
                  </button>
                </div>
              )}

              {/* Notice if in Iframe Preview */}
              {isInIframe && (
                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl p-3.5 space-y-2 text-amber-900 dark:text-amber-200">
                  <p className="font-bold text-xs flex items-center gap-1.5">
                    <Smartphone className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>Membuka di Pratinjau / Tab Iframe?</span>
                  </p>
                  <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                    Fitur pemasangan PWA browser membutuhkan jendela tab browser penuh. Buka aplikasi di tab baru agar tombol install browser muncul.
                  </p>
                  <button
                    onClick={handleOpenNewTab}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Buka di Tab Baru / Browser</span>
                  </button>
                </div>
              )}

              {/* Step by Step Manual Guide */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider">
                  {isIOS ? '📱 Panduan Instal di iPhone / iPad (Safari)' : '📱 Panduan Instal di Android / Chrome'}
                </h4>

                {isIOS ? (
                  <div className="space-y-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100">Buka di Browser Safari</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Pastikan tautan aplikasi dibuka di Safari (bukan di dalam browser in-app WhatsApp/Instagram).</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                          Ketuk Tombol Bagikan <Share2 className="h-3.5 w-3.5 text-blue-600 inline" />
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Ikon kotak panah ke atas di bagian bawah layar Safari.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                          Pilih "Tambah ke Layar Utama" <PlusSquare className="h-3.5 w-3.5 text-blue-600 inline" />
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Gulir ke bawah pada menu bagikan, lalu ketuk "Tambahkan".</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                          Ketuk Menu Browser <MoreVertical className="h-3.5 w-3.5 text-sky-600 inline" />
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Ketuk ikon titik tiga di pojok kanan atas Google Chrome / Edge.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                          Pilih "Instal Aplikasi" atau "Tambahkan ke Layar Utama"
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Pilih opsi instal untuk menaruh ikon di layar depan HP.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Keunggulan PWA */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <h5 className="font-bold text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
              Keuntungan Memasang Aplikasi:
            </h5>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/50 flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500 shrink-0" />
                <span className="font-medium text-slate-700 dark:text-slate-300">Akses Cepat & Ringan</span>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/50 flex items-center gap-2">
                <BellRing className="h-4 w-4 text-sky-500 shrink-0" />
                <span className="font-medium text-slate-700 dark:text-slate-300">Notifikasi Jadwal</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 shrink-0 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold transition cursor-pointer shadow-sm active:scale-98"
          >
            Mengerti & Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
