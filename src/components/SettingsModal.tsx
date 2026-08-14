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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl max-w-md w-full my-8 relative overflow-hidden transition-colors">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-900 dark:to-slate-950 p-4 sm:p-5 text-white relative flex items-center justify-between border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-white/10 rounded-xl backdrop-blur-md shrink-0">
              <Settings className="h-5 w-5 text-sky-400" />
            </span>
            <div>
              <h3 className="text-base font-black leading-tight text-white">Pengaturan Aplikasi</h3>
              <p className="text-[11px] text-slate-300">
                Kelola preferensi, notifikasi, dan profil
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4">

          {/* 1. PERIZINAN NOTIFIKASI */}
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 rounded-xl shrink-0">
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Perizinan Notifikasi</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Pengingat presensi & jadwal KBM</p>
                </div>
              </div>

              {notificationPermission === 'granted' ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle className="h-3 w-3" />
                  Aktif
                </span>
              ) : notificationPermission === 'denied' ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-black bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-400 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-800">
                  <AlertCircle className="h-3 w-3" />
                  Ditolak
                </span>
              ) : (
                <button
                  onClick={handleRequestNotification}
                  className="text-xs font-black bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 rounded-xl shadow-xs transition cursor-pointer"
                >
                  Izinkan
                </button>
              )}
            </div>
            {notificationPermission === 'denied' && (
              <p className="text-[10px] text-rose-500 font-medium italic">
                Izin notifikasi diblokir di browser. Harap izinkan melalui pengaturan browser Anda.
              </p>
            )}
          </div>

          {/* 2. INSTAL APLIKASI */}
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
                  <Smartphone className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Instal Aplikasi (PWA)</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Pasang aplikasi di HP/Desktop</p>
                </div>
              </div>

              {isStandalone || installSuccess ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <Check className="h-3 w-3" />
                  Terinstal
                </span>
              ) : (
                <button
                  onClick={handleInstallApp}
                  className="text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1 transition cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  Instal
                </button>
              )}
            </div>
          </div>

          {/* 3. EDIT PROFIL */}
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 rounded-xl shrink-0">
                <User className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Edit Profil Siswa</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {student?.nama ? student.nama : 'Data & Kontak Siswa'}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onOpenEditProfile();
              }}
              className="text-xs font-black bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-xl shadow-xs transition cursor-pointer"
            >
              Lihat Profil
            </button>
          </div>

          {/* 4. MODE GELAP */}
          <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-3xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 dark:bg-indigo-950 text-amber-600 dark:text-amber-300 rounded-xl shrink-0 border border-amber-200/80 dark:border-indigo-800">
                {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">Mode Gelap (Dark Mode)</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {isDarkMode ? 'Tema Gelap Sedang Aktif' : 'Tema Terang Sedang Aktif'}
                </p>
              </div>
            </div>

            {/* High Visibility Toggle Switch Button */}
            <button
              type="button"
              onClick={onToggleDarkMode}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all duration-200 flex items-center gap-1.5 cursor-pointer border shadow-2xs ${
                isDarkMode 
                  ? 'bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-700' 
                  : 'bg-slate-200 text-slate-700 border-slate-300 hover:bg-slate-300'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`}></span>
              <span>{isDarkMode ? 'Gelap' : 'Terang'}</span>
            </button>
          </div>

          {/* 5. INFORMASI APLIKASI & PEMBARUAN */}
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 rounded-xl shrink-0">
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
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-extrabold transition cursor-pointer shadow-2xs flex items-center gap-1"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Cek Update</span>
                </button>
              )}
            </div>

            {activeSubView === 'info' && (
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1.5 text-xs text-slate-600 dark:text-slate-300 animate-fade-in">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Nama App</span>
                  <span className="font-bold">Rapor Kita</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Versi</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">v2.4.0 (Build 2026)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Database</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Supabase Cloud Sync</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Pengembang</span>
                  <span className="font-bold">D14nr © Copyright 2024</span>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100/70 dark:bg-slate-950/80 border-t border-slate-200/60 dark:border-slate-800 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-extrabold transition cursor-pointer"
          >
            Selesai
          </button>
        </div>

      </div>
    </div>
  );
};
