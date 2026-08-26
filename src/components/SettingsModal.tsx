import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings, 
  Bell, 
  Download, 
  User, 
  Moon, 
  Sun, 
  Info, 
  Check, 
  Smartphone, 
  ShieldCheck, 
  CheckCircle, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { DataSiswa } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenEditProfile: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  student: DataSiswa | null;
  onCheckUpdate?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenEditProfile,
  isDarkMode,
  onToggleDarkMode,
  student,
  onCheckUpdate,
}) => {
  const [notificationPermission, setNotificationPermission] = useState<string>('default');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [installSuccess, setInstallSuccess] = useState<boolean>(false);
  const [activeSubView, setActiveSubView] = useState<'main' | 'info'>('main');

  useEffect(() => {
    // Check notification permission status
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    } else {
      setNotificationPermission('unsupported');
    }

    // Check if app is installed as PWA standalone
    if (typeof window !== 'undefined') {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);
    }

    // Capture beforeinstallprompt event for PWA
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  if (!isOpen) return null;

  const handleRequestNotification = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
      } catch (err) {
        console.warn('Error requesting notification permission:', err);
      }
    }
  };

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstallSuccess(true);
        setDeferredPrompt(null);
      }
    } else {
      alert('Untuk menginstal aplikasi di HP/Browser:\n1. Buka menu browser (titik tiga di kanan atas)\n2. Pilih "Instal Aplikasi" atau "Tambahkan ke Layar Utama"');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-3 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 text-white relative shrink-0 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md shrink-0 border border-white/10 text-sky-400">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight text-white leading-tight">Pengaturan Aplikasi</h3>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Kelola preferensi, notifikasi, dan profil
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
            title="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1 text-slate-800 dark:text-slate-100">

          {/* 1. PERIZINAN NOTIFIKASI */}
          <div className="bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-4 space-y-2 transition hover:border-slate-300 dark:hover:border-slate-600">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 rounded-xl shrink-0">
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Perizinan Notifikasi</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Pengingat presensi & jadwal KBM</p>
                </div>
              </div>

              {notificationPermission === 'granted' ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 px-3 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800 shrink-0">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                  Aktif
                </span>
              ) : notificationPermission === 'denied' ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 px-3 py-1 rounded-xl border border-rose-200 dark:border-rose-800 shrink-0">
                  <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
                  Ditolak
                </span>
              ) : (
                <button
                  onClick={handleRequestNotification}
                  className="text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white px-3.5 py-1.5 rounded-xl shadow-xs transition cursor-pointer shrink-0"
                >
                  Izinkan
                </button>
              )}
            </div>
            {notificationPermission === 'denied' && (
              <p className="text-[10px] text-rose-600 dark:text-rose-400 font-medium italic pt-1 border-t border-rose-100 dark:border-rose-900/40">
                Izin notifikasi diblokir di browser. Harap izinkan melalui pengaturan browser Anda.
              </p>
            )}
          </div>

          {/* 2. INSTAL APLIKASI */}
          <div className="bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-4 flex items-center justify-between gap-3 transition hover:border-slate-300 dark:hover:border-slate-600">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
                <Smartphone className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Instal Aplikasi (PWA)</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Pasang aplikasi di HP / Desktop</p>
              </div>
            </div>

            {isStandalone || installSuccess ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 px-3 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800 shrink-0">
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                Terinstal
              </span>
            ) : (
              <button
                onClick={handleInstallApp}
                className="text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer shrink-0"
              >
                <Download className="h-3.5 w-3.5" />
                Instal
              </button>
            )}
          </div>

          {/* 3. EDIT PROFIL */}
          <div className="bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-4 flex items-center justify-between gap-3 transition hover:border-slate-300 dark:hover:border-slate-600">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 rounded-xl shrink-0">
                <User className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">Edit Profil Siswa</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {student?.nama ? student.nama : 'Data & Kontak Siswa'}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onOpenEditProfile();
              }}
              className="text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white px-3.5 py-1.5 rounded-xl shadow-xs transition cursor-pointer shrink-0"
            >
              Lihat Profil
            </button>
          </div>

          {/* 4. MODE GELAP */}
          <div className="bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-4 flex items-center justify-between gap-3 transition hover:border-slate-300 dark:hover:border-slate-600">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 dark:bg-indigo-950/80 text-amber-600 dark:text-indigo-400 rounded-xl shrink-0">
                {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Mode Gelap (Dark Mode)</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {isDarkMode ? 'Tema Gelap Aktif' : 'Tema Terang Aktif'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleDarkMode}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer border shadow-2xs shrink-0 ${
                isDarkMode 
                  ? 'bg-slate-800 text-slate-100 border-slate-700 hover:bg-slate-700' 
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-indigo-400' : 'bg-amber-400'}`} />
              <span>{isDarkMode ? 'Gelap' : 'Terang'}</span>
            </button>
          </div>

          {/* 5. INFORMASI APLIKASI & PEMBARUAN */}
          <div className="bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-4 space-y-3 transition hover:border-slate-300 dark:hover:border-slate-600">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 rounded-xl shrink-0">
                  <Info className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Versi & Pembaruan Aplikasi</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Pemeriksaan Versi Otomatis</p>
                </div>
              </div>

              {onCheckUpdate && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onCheckUpdate();
                  }}
                  className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs flex items-center gap-1.5 shrink-0"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Cek Update</span>
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Sticky Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 shrink-0 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold transition cursor-pointer shadow-sm active:scale-98"
          >
            Selesai
          </button>
        </div>

      </div>
    </div>
  );
};
