import React, { useState, useEffect } from 'react';
const appLogo = '/logo.png';
import { 
  GraduationCap, 
  KeyRound, 
  Calendar, 
  ArrowRight, 
  AlertCircle, 
  Database, 
  Info,
  CheckCircle2,
  Lock,
  Loader2,
  BookOpen,
  UserCheck,
  Sparkles,
  Search,
  X,
  Trash2
} from 'lucide-react';
import { d1 } from '../lib/d1';
import { DataSiswa } from '../types';

interface LoginProps {
  onLoginSuccess: (student: DataSiswa, fromD1: boolean) => void;
  useD1: boolean;
  dbStatus: 'disconnected' | 'testing' | 'connected' | 'error';
  onToggleDemoMode: () => void;
}

// Helper to normalize any date string to YYYY-MM-DD format
const normalizeDate = (dateStr: string | undefined | null): string => {
  if (!dateStr) return '';
  
  // Extract just the date part if it's an ISO timestamp (e.g. 2010-04-15T00:00:00Z)
  let cleaned = dateStr.trim();
  if (cleaned.includes('T')) {
    cleaned = cleaned.split('T')[0];
  }
  
  // 1. If already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return cleaned;
  }
  
  // 2. If DD-MM-YYYY, DD/MM/YYYY or DD.MM.YYYY
  const parts = cleaned.split(/[-/.]/);
  if (parts.length === 3) {
    const [first, second, third] = parts;
    if (first.length === 4) {
      // YYYY-MM-DD or YYYY/MM/DD
      return `${first}-${second.padStart(2, '0')}-${third.padStart(2, '0')}`;
    } else if (third.length === 4) {
      // DD-MM-YYYY or DD/MM/YYYY
      return `${third}-${second.padStart(2, '0')}-${first.padStart(2, '0')}`;
    }
  }
  
  return cleaned;
};

export default function Login({ onLoginSuccess, useD1, dbStatus, onToggleDemoMode }: LoginProps) {
  const [nis, setNis] = useState('');
  const [dob, setDob] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<number>(1);
  const [progress, setProgress] = useState<number>(0);
  const [matchedStudentName, setMatchedStudentName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Search NIS States
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [searchCabang, setSearchCabang] = useState('');
  const [searchResult, setSearchResult] = useState<any[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Clear Cache & History States
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [clearCacheProgress, setClearCacheProgress] = useState(0);
  const [clearCacheStatus, setClearCacheStatus] = useState('');

  const handleClearCacheAndHistory = async () => {
    if (isClearingCache) return;
    if (!window.confirm('Apakah Anda yakin ingin membersihkan seluruh cache, history, dan sesi aplikasi? Tindakan ini akan memuat ulang halaman.')) {
      return;
    }

    setIsClearingCache(true);
    setClearCacheProgress(15);
    setClearCacheStatus('Memeriksa penyimpanan lokal...');
    await delay(300);

    try {
      setClearCacheProgress(35);
      setClearCacheStatus('Menghapus data sesi dan cache lokal...');
      localStorage.clear();
      sessionStorage.clear();
      await delay(400);

      setClearCacheProgress(70);
      setClearCacheStatus('Membersihkan cache browser & PWA...');
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      await delay(400);

      setClearCacheProgress(90);
      setClearCacheStatus('Memperbarui Service Worker...');
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      }
      await delay(500);

      setClearCacheProgress(100);
      setClearCacheStatus('Pembersihan berhasil! Memuat ulang aplikasi...');
      await delay(700);

      window.location.reload();
    } catch (err) {
      console.error('Error clearing cache:', err);
      setClearCacheStatus('Terjadi kesalahan saat membersihkan cache.');
      setIsClearingCache(false);
    }
  };

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const handleSearchNis = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = searchName.trim();
    if (!trimmedName) return;

    setIsSearching(true);
    setSearchError(null);
    setSearchResult(null);

    try {
      const { data, error: err } = await d1.from('data_siswa').select('*');

      if (err) throw err;

      const normalizedInput = trimmedName.toLowerCase();
      const normalizedCabang = searchCabang.trim().toLowerCase();

      const filtered = (data || []).filter((row: any) => {
        const namaLengkap = String(row?.nama_lengkap || row?.nama || '').trim();
        const nama = String(row?.nama || '').trim();
        const cabang = String(row?.cabang || '').trim();

        const matchesName =
          namaLengkap.toLowerCase().includes(normalizedInput) ||
          nama.toLowerCase().includes(normalizedInput) ||
          `${namaLengkap} ${nama}`.toLowerCase().includes(normalizedInput);

        const matchesCabang = !normalizedCabang || cabang.toLowerCase().includes(normalizedCabang);

        return matchesName && matchesCabang;
      }).slice(0, 10);

      if (filtered.length > 0) {
        setSearchResult(filtered);
      } else {
        setSearchError('Siswa tidak ditemukan. Pastikan nama sudah benar, atau cek apakah data tersimpan di kolom nama/nama_lengkap di D1.');
      }
    } catch (err: any) {
      setSearchError(err.message || 'Terjadi kesalahan saat mencari data.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setMatchedStudentName(null);
    
    const trimmedNis = nis.trim();
    const trimmedDob = dob.trim();

    if (!trimmedNis || !trimmedDob) {
      setError('Mohon masukkan nomor NIS dan Tanggal Lahir Anda.');
      return;
    }

    setIsLoading(true);
    setLoadingStep(1);
    setProgress(15);

    try {
      // Step 1: Verification of format
      await delay(300);
      setLoadingStep(2);
      setProgress(35);

      let studentData: DataSiswa | null = null;
      let loggedInViaD1 = false;
      let nisExists = false;

      // Prepare multiple possible formats of NIS to query in parallel
      const cleanInputNis = trimmedNis.replace(/[^a-zA-Z0-9]/g, '');
      const possibleNisList = [trimmedNis];
      if (cleanInputNis && cleanInputNis !== trimmedNis) {
        possibleNisList.push(cleanInputNis);
      }
      if (cleanInputNis.length === 9) {
        const patterned = `${cleanInputNis.slice(0, 2)}-${cleanInputNis.slice(2, 5)}-${cleanInputNis.slice(5, 8)}-${cleanInputNis.slice(8)}`;
        if (!possibleNisList.includes(patterned)) {
          possibleNisList.push(patterned);
        }
      }

      console.log('Attempting login with NIS candidates:', possibleNisList, 'and birthday input:', trimmedDob);

      // Query database directly using schema: data_siswa(nis, tanggal_lahir, nama_lengkap)
      const { data, error: sbError } = await d1
        .from('data_siswa')
        .select('*')
        .in('nis', possibleNisList);

      if (sbError) {
        throw new Error(`Gagal membaca database: ${sbError.message}`);
      }

      if (data && data.length > 0) {
        nisExists = true;
        const matched = data.find((item: any) => {
          if (!item.tanggal_lahir) return false;

          const itemDob = normalizeDate(item.tanggal_lahir);
          const inputDob = normalizeDate(trimmedDob);

          if (itemDob === inputDob) return true;

          const numDb = String(item.tanggal_lahir).replace(/\D/g, '');
          const numInput = trimmedDob.replace(/\D/g, '');
          if (numDb && numInput && numDb === numInput) return true;

          try {
            const dateDb = new Date(item.tanggal_lahir);
            const dateInput = new Date(trimmedDob);
            if (
              dateDb.getUTCFullYear() === dateInput.getUTCFullYear() &&
              dateDb.getUTCMonth() === dateInput.getUTCMonth() &&
              dateDb.getUTCDate() === dateInput.getUTCDate()
            ) {
              return true;
            }
            if (
              dateDb.getFullYear() === dateInput.getFullYear() &&
              dateDb.getMonth() === dateInput.getMonth() &&
              dateDb.getDate() === dateInput.getDate()
            ) {
              return true;
            }
          } catch (e) {
            console.error('Error in fallback date parsing:', e);
          }

          return false;
        });

        if (matched) {
          studentData = {
            ...(matched as DataSiswa),
            nama: matched.nama || matched.nama_lengkap || 'Siswa',
            nama_lengkap: matched.nama_lengkap || matched.nama || 'Siswa'
          };
          loggedInViaD1 = true;
        }
      }

      if (studentData) {
        setMatchedStudentName(studentData.nama);
        
        // Step 3: Fetching KBM schedule & records
        setLoadingStep(3);
        setProgress(65);
        await delay(450);

        // Step 4: Syncing grades & report card
        setLoadingStep(4);
        setProgress(88);
        await delay(450);

        // Step 5: Readying dashboard
        setLoadingStep(5);
        setProgress(100);
        setSuccess(`Data Rapor ${studentData.nama} berhasil dimuat!`);
        await delay(400);

        onLoginSuccess(studentData, loggedInViaD1);
        setIsLoading(false);
      } else {
        setIsLoading(false);
        if (nisExists) {
          setError('Tanggal Lahir yang Anda masukkan tidak cocok dengan data NIS tersebut. Silakan periksa kembali.');
        } else {
          setError('Nomor NIS tidak terdaftar di sistem kami. Silakan periksa kembali nomor NIS Anda.');
        }
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'Terjadi kesalahan sistem saat masuk.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4 font-sans antialiased relative">
      
      {/* FULL-SCREEN DATA FETCHING LOADING MODAL */}
      {isLoading && (
        <div id="login-loading-overlay" className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 max-w-md w-full p-6 sm:p-8 text-center relative overflow-hidden">
            {/* Top Accent Gradient Bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-500 animate-pulse"></div>

            {/* Glowing Logo & Pulsing Spinner */}
            <div className="relative mx-auto w-20 h-20 mb-6 flex items-center justify-center">
              <div className="w-16 h-16 flex items-center justify-center overflow-hidden z-10">
                <img 
                  src={appLogo} 
                  alt="Logo Rapor Siswa" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            </div>

            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {matchedStudentName ? `Memuat Rapor: ${matchedStudentName}` : 'Mengambil Data Rapor Siswa'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Sedang menghubungkan ke Database Cloudflare D1 & menyingkronkan data...
            </p>

            {/* Progress Bar */}
            <div className="mt-6 mb-6">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">
                <span>Progress Pengambilan Data</span>
                <span className="text-sky-600 dark:text-sky-400 font-extrabold">{progress}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-600">
                <div 
                  className="bg-gradient-to-r from-sky-500 to-indigo-600 h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            {/* Interactive Step-by-Step Checklist */}
            <div className="space-y-3 text-left bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 text-xs">
              <div className="flex items-center gap-2.5">
                {loadingStep > 1 ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                ) : (
                  <Loader2 className="h-4 w-4 text-sky-500 animate-spin shrink-0" />
                )}
                <span className={loadingStep >= 1 ? 'font-bold text-slate-800 dark:text-slate-200' : 'text-slate-400'}>
                  1. Verifikasi Format NIS ({nis}) & Tanggal Lahir
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                {loadingStep > 2 ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                ) : loadingStep === 2 ? (
                  <Loader2 className="h-4 w-4 text-sky-500 animate-spin shrink-0" />
                ) : (
                  <div className="h-4 w-4 rounded-full border border-slate-300 shrink-0"></div>
                )}
                <span className={loadingStep >= 2 ? 'font-bold text-slate-800 dark:text-slate-200' : 'text-slate-400'}>
                  2. Mengakses Tabel Database Cloudflare D1 (`data_siswa`)
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                {loadingStep > 3 ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                ) : loadingStep === 3 ? (
                  <Loader2 className="h-4 w-4 text-sky-500 animate-spin shrink-0" />
                ) : (
                  <div className="h-4 w-4 rounded-full border border-slate-300 shrink-0"></div>
                )}
                <span className={loadingStep >= 3 ? 'font-bold text-slate-800 dark:text-slate-200' : 'text-slate-400'}>
                  3. Mengambil Jadwal KBM & Data Presensi Kehadiran
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                {loadingStep > 4 ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                ) : loadingStep === 4 ? (
                  <Loader2 className="h-4 w-4 text-sky-500 animate-spin shrink-0" />
                ) : (
                  <div className="h-4 w-4 rounded-full border border-slate-300 shrink-0"></div>
                )}
                <span className={loadingStep >= 4 ? 'font-bold text-slate-800 dark:text-slate-200' : 'text-slate-400'}>
                  4. Sinkronisasi Nilai Evaluasi & Standar Rapor
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                {loadingStep === 5 ? (
                  <Sparkles className="h-4 w-4 text-amber-500 animate-bounce shrink-0" />
                ) : (
                  <div className="h-4 w-4 rounded-full border border-slate-300 shrink-0"></div>
                )}
                <span className={loadingStep >= 5 ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>
                  5. Menyiapkan Tampilan Dasbor Rapor
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-4 italic">
              Mohon tunggu sebentar, data sedang dimuat...
            </p>
          </div>
        </div>
      )}

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Logo & Icon */}
        <div className="inline-flex mb-4 overflow-hidden w-14 h-14 shrink-0">
          <img 
            src={appLogo} 
            alt="Logo Rapor Siswa" 
            className="w-full h-full object-contain" 
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              if (e.currentTarget.parentElement) {
                e.currentTarget.parentElement.innerHTML = '<svg class="h-8 w-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>';
              }
            }}
          />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Laporan Perkembangan Siswa
        </h2>
        <p className="mt-2 text-sm text-slate-500 font-medium">
          Laporan Perkembangan Belajar & Jadwal secara Real-Time
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl border border-slate-100 rounded-3xl sm:px-10 relative overflow-hidden">
          {/* Subtle Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sky-500 to-indigo-500"></div>

          <form className="space-y-6" onSubmit={handleLogin}>
            {/* Status alerts */}
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-rose-800 text-xs animate-fade-in">
                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Gagal Masuk</p>
                  <p className="leading-relaxed opacity-90">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3 text-emerald-800 text-xs animate-fade-in">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Berhasil Masuk</p>
                  <p className="leading-relaxed opacity-90">{success}</p>
                </div>
              </div>
            )}

            {/* NIS Input */}
            <div>
              <label htmlFor="nis-input" className="block text-xs font-bold text-slate-700 tracking-wider uppercase mb-2">
                Nomor Induk Siswa (NIS)
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="h-4 w-4" />
                </div>
                <input
                  id="nis-input"
                  type="text"
                  required
                  placeholder="Masukkan nomor NIS (31-444-001-6)"
                  value={nis}
                  onChange={(e) => setNis(e.target.value)}
                  disabled={isLoading}
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm font-medium"
                />
              </div>
            </div>

            {/* Tanggal Lahir Input */}
            <div>
              <label htmlFor="dob-input" className="block text-xs font-bold text-slate-700 tracking-wider uppercase mb-2">
                Tanggal Lahir Siswa
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="h-4 w-4" />
                </div>
                <input
                  id="dob-input"
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  disabled={isLoading}
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm font-medium"
                />
              </div>
              <p className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
                <Info className="h-3 w-3 shrink-0" />
                Gunakan format tanggal lahir yang valid (HH/BB/TTTT).
              </p>
            </div>

            <div className="flex justify-end mt-[-10px] mb-2">
              <button 
                type="button" 
                onClick={() => setShowSearchModal(true)}
                className="text-[11px] font-bold text-sky-600 hover:text-sky-700 hover:underline transition-colors focus:outline-none"
              >
                Lupa / Cari NIS Siswa?
              </button>
            </div>
            {/* Submit Button */}
            <div>
              <button
                id="btn-submit-login"
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-2xl shadow-lg shadow-sky-100 text-sm font-bold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-75 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="animate-spin h-4 w-4 text-white" />
                    <span>Mengambil Data Rapor...</span>
                  </div>
                ) : (
                  <>
                    <span>Masuk ke Rapor Siswa</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>

            {/* Clear Cache & History Button with Progress */}
            <div className="mt-3 pt-3 border-t border-slate-100">
              <button
                id="btn-clear-cache"
                type="button"
                onClick={handleClearCacheAndHistory}
                disabled={isLoading || isClearingCache}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-slate-200 rounded-2xl shadow-sm text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 disabled:opacity-75 transition-all cursor-pointer"
              >
                {isClearingCache ? (
                  <div className="flex items-center gap-2 w-full">
                    <Loader2 className="animate-spin h-4 w-4 text-sky-600 shrink-0" />
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex justify-between items-center text-[10px] mb-1">
                        <span className="font-semibold text-slate-600 truncate">{clearCacheStatus}</span>
                        <span className="font-black text-sky-600">{clearCacheProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-sky-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${clearCacheProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 text-slate-500" />
                    <span>Bersihkan Cache & History</span>
                  </>
                )}
              </button>
            </div>
          </form>


        </div>
      </div>

      {/* Search NIS Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowSearchModal(false)}></div>
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center shrink-0">
                  <Search className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800">Cari NIS Siswa</h3>
                  <p className="text-xs font-semibold text-slate-500">Temukan nomor induk siswa Anda</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSearchModal(false)}
                className="h-8 w-8 bg-white border border-slate-200 text-slate-500 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form onSubmit={handleSearchNis} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 tracking-wider uppercase mb-1.5">
                    Nama Siswa
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Masukkan nama lengkap / panggilan..."
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 tracking-wider uppercase mb-1.5">
                    Cabang (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Cth: Semarang 2"
                    value={searchCabang}
                    onChange={(e) => setSearchCabang(e.target.value)}
                    className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm font-medium"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isSearching || !searchName.trim()}
                  className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-md shadow-sky-100 text-sm font-bold text-white bg-sky-600 hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-75 transition-all cursor-pointer"
                >
                  {isSearching ? <Loader2 className="animate-spin h-4 w-4" /> : <Search className="h-4 w-4" />}
                  <span>Cari NIS</span>
                </button>
              </form>

              {searchError && (
                <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <p className="font-semibold leading-relaxed">{searchError}</p>
                </div>
              )}

              {searchResult && searchResult.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 tracking-wider uppercase border-b border-slate-100 pb-2">Hasil Pencarian</h4>
                  <div className="space-y-2">
                    {searchResult.map((siswa, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between gap-3 hover:border-sky-300 transition-colors cursor-pointer" onClick={() => {
                        setNis(siswa.nis);
                        setShowSearchModal(false);
                      }}>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-800 truncate">{siswa.nama}</p>
                          <p className="text-[10px] font-bold text-slate-500 mt-0.5 truncate">
                            {siswa.cabang} {siswa.asal_sekolah ? `• ${siswa.asal_sekolah}` : ''}
                          </p>
                        </div>
                        <div className="bg-sky-100 text-sky-700 px-2.5 py-1 rounded-lg text-xs font-black shrink-0">
                          {siswa.nis}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 text-center pt-2">Klik hasil pencarian untuk mengisi NIS otomatis.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

