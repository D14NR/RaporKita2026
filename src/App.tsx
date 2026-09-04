import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  GraduationCap, 
  CheckCircle, 
  AlertCircle, 
  User, 
  Database, 
  Download, 
  Menu, 
  X, 
  ClipboardList, 
  Search, 
  Sliders, 
  BookMarked, 
  Award, 
  HeartHandshake, 
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
  Smartphone,
  ChevronRight,
  ChevronLeft,
  LogOut,
  Mail,
  MapPin,
  Moon,
  Sun,
  FileText,
  CalendarDays,
  Settings,
  Bell,
  Sparkles,
  Wifi,
  WifiOff
} from 'lucide-react';
import { d1, d1Kbm, DB_SETUP_SQL } from './lib/d1';
import { 
  Student, 
  DataSiswa,
  RegularSchedule, 
  AdditionalSchedule, 
  Attendance, 
  LearningProgress, 
  Grade, 
  NilaiEvaluasi,
  NilaiSnbtUtbk,
  NilaiStandar,
  OutsideService,
  PermintaanPelayanan
} from './types';
import Login from './components/Login';
import { WeeklySummaryCard } from './components/WeeklySummaryCard';
import { AttendancePieChart } from './components/AttendancePieChart';
import { PerkembanganProgress } from './components/PerkembanganProgress';
import { SubjectBarChart } from './components/SubjectBarChart';
import { ServicePieChart } from './components/ServicePieChart';
import { AnalisaView } from './components/AnalisaView';
import { LeaveFormModal } from './components/LeaveFormModal';
import { OutsideServiceFormModal } from './components/OutsideServiceFormModal';
import { BookingServiceFormModal } from './components/BookingServiceFormModal';
import { formatTanggalIndo, isThisOrNextMonth, isScheduleForToday, isScheduleFinished, parseDateSafe, getTodayIndoString, getScheduleTimeStatus, MONTHS_INDO, compareDates, compareScheduleDates } from './lib/dateUtils';
import { SettingsModal } from './components/SettingsModal';
import { NotificationModal } from './components/NotificationModal';
import { UjiMateriView } from './components/UjiMateriView';
import { NilaiView } from './components/NilaiView';
import { PerkembanganView } from './components/PerkembanganView';
import { KbmRegulerView } from './components/KbmRegulerView';
import { KbmKhususView } from './components/KbmKhususView';
import { LuarKbmView } from './components/LuarKbmView';
import { UpdateCheckerModal } from './components/UpdateCheckerModal';
import { ActiveScheduleAlert } from './components/ActiveScheduleAlert';
import { PresensiView } from './components/PresensiView';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { PWAInstallModal } from './components/PWAInstallModal';
import { requestNotificationPermission } from './lib/pushNotifications';
import { formatScore, roundScore } from './lib/formatUtils';

const APP_VERSION = '1.0.0';

export default function App() {
  // Manual Version Check Trigger
  const [manualCheckTrigger, setManualCheckTrigger] = useState(0);

  // Login Session State
  const [currentStudent, setCurrentStudent] = useState<DataSiswa | null>(() => {
    try {
      const saved = localStorage.getItem('rapor_siswa_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Request Push Notification permission if logged in
  useEffect(() => {
    if (currentStudent?.nis) {
      // Small delay to prevent blocking the initial render
      const timer = setTimeout(() => {
        requestNotificationPermission(currentStudent.nis, currentStudent).catch(err => {
          console.warn('Failed to check/request push notification permission:', err);
        });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentStudent]);

  // Navigation & UI State
  const [activeTab, setActiveTab] = useState<'overview' | 'kbm-reguler' | 'kbm-tambahan' | 'presensi' | 'perkembangan' | 'uji-materi' | 'nilai' | 'luar-kbm' | 'analisa' | 'd1-config'>('overview');
  const [showChartNilai, setShowChartNilai] = useState(false);
  const [showChartPresensi, setShowChartPresensi] = useState(false);
  const [showChartPerkembangan, setShowChartPerkembangan] = useState(false);
  const [showChartLuarKbm, setShowChartLuarKbm] = useState(false);
  const [gradeSubTab, setGradeSubTab] = useState<'evaluasi' | 'standar' | 'snbt'>('evaluasi');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('rapor_siswa_session');
      if (saved) {
        const student = JSON.parse(saved) as DataSiswa;
        return student.nis;
      }
    } catch {}
    return '60-444-001-6'; // Default
  });
  const [studentInputId, setStudentInputId] = useState<string>('');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isMobileGridMenuOpen, setIsMobileGridMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };
  const [copiedSql, setCopiedSql] = useState(false);
  const [customToast, setCustomToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isProfileEditMode, setIsProfileEditMode] = useState(false);
  const [profileFormData, setProfileFormData] = useState<any>(null);
  const [profileSelectedSubjects, setProfileSelectedSubjects] = useState<string[]>([]);
  const [profileSubjectSearch, setProfileSubjectSearch] = useState('');
  const [isProfileSubjectPickerOpen, setIsProfileSubjectPickerOpen] = useState(false);
  const [mataPelajaranOptions, setMataPelajaranOptions] = useState<string[]>([]);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isPWAInstallModalOpen, setIsPWAInstallModalOpen] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(0);

  const [dataRefreshCounter, setDataRefreshCounter] = useState(0);
  const [isOutsideServiceModalOpen, setIsOutsideServiceModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Leave / Sakit Modal State
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [selectedScheduleForLeave, setSelectedScheduleForLeave] = useState<{
    subject: string;
    date?: string;
    time?: string;
    teacher?: string;
    kelas?: string;
  } | null>(null);

  const handleOpenLeaveModal = (sched?: {
    subject: string;
    date?: string;
    time?: string;
    teacher?: string;
    kelas?: string;
  }) => {
    setSelectedScheduleForLeave(sched || null);
    setIsLeaveModalOpen(true);
  };

  const parseSubjectList = (value?: string) => {
    if (!value) return [];
    return value
      .split(/[;,]/)
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const handleEditProfile = () => {
    if (currentStudent) {
      const selectedSubjects = parseSubjectList(currentStudent.mata_pelajaran || '');
      setProfileSelectedSubjects(selectedSubjects);
      setProfileFormData({
        id: currentStudent.id,
        nama_lengkap: currentStudent.nama_lengkap || currentStudent.nama || '',
        tanggal_lahir: currentStudent.tanggal_lahir || '',
        asal_sekolah: currentStudent.asal_sekolah || '',
        no_whatsapp_siswa: currentStudent.no_whatsapp_siswa || '',
        no_whatsapp_orang_tua: currentStudent.no_whatsapp_orang_tua || '',
        email: currentStudent.email || '',
        mata_pelajaran: currentStudent.mata_pelajaran || '',
      });
      setProfileSubjectSearch('');
      setIsProfileSubjectPickerOpen(false);
      setIsProfileEditMode(true);
    }
  };

  const handleSaveProfile = async () => {
    if (!profileFormData) return;

    const profileId = profileFormData.id || currentStudent?.id;
    const profileNis = currentStudent?.nis;
    if (!profileId && !profileNis) {
      setCustomToast({
        message: 'Identitas siswa tidak ditemukan. Silakan masuk kembali.',
        type: 'error'
      });
      return;
    }
    
    setIsProfileSaving(true);
    try {
      const updatePayload = {
        nama_lengkap: profileFormData.nama_lengkap,
        tanggal_lahir: profileFormData.tanggal_lahir,
        asal_sekolah: profileFormData.asal_sekolah,
        no_whatsapp_siswa: profileFormData.no_whatsapp_siswa,
        no_whatsapp_orang_tua: profileFormData.no_whatsapp_orang_tua,
        email: profileFormData.email,
        mata_pelajaran: profileFormData.mata_pelajaran,
      };

      let updateQuery = d1
        .from('data_siswa')
        .update(updatePayload);

      if (profileId) {
        updateQuery = updateQuery.eq('id', profileId);
      } else {
        updateQuery = updateQuery.eq('nis', profileNis);
      }

      const { data, error } = await updateQuery.select();

      if (error) {
        console.error('Error updating profile:', error);
        setCustomToast({
          message: `Gagal menyimpan perubahan profil: ${error.message}`,
          type: 'error'
        });
      } else {
        // Update currentStudent state
        if (currentStudent) {
          const updatedStudent = { ...currentStudent, ...updatePayload };
          setCurrentStudent(updatedStudent);
          setSelectedStudentData(updatedStudent);
        }
        
        setCustomToast({
          message: 'Profil siswa berhasil diperbarui',
          type: 'success'
        });
        setIsProfileEditMode(false);
        setProfileFormData(null);
        setTimeout(() => setCustomToast(null), 3000);
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      setCustomToast({
        message: `Terjadi kesalahan saat menyimpan profil: ${err instanceof Error ? err.message : String(err)}`,
        type: 'error'
      });
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handleCancelEditProfile = () => {
    setIsProfileEditMode(false);
    setProfileFormData(null);
    setProfileSelectedSubjects([]);
    setProfileSubjectSearch('');
    setIsProfileSubjectPickerOpen(false);
  };

  useEffect(() => {
    const loadMataPelajaranOptions = async () => {
      try {
        const { data, error } = await d1
          .from('mata_pelajaran')
          .select('*')
          .order('mata_pelajaran', { ascending: true });

        if (error) {
          throw error;
        }

        const options = (data || [])
          .map((row: any) => (row.mata_pelajaran || row.nama_mata_pelajaran || row.mapel || row.subject || '').trim())
          .filter(Boolean);

        const uniqueOptions: string[] = [...new Set(options)] as string[];
        setMataPelajaranOptions(uniqueOptions);
      } catch (err) {
        console.error('Error loading mata_pelajaran options:', err);
        setMataPelajaranOptions([]);
      }
    };

    loadMataPelajaranOptions();
  }, []);

  const toggleProfileSubject = (subject: string) => {
    const nextSubjects = profileSelectedSubjects.includes(subject)
      ? profileSelectedSubjects.filter((item) => item !== subject)
      : [...profileSelectedSubjects, subject];

    setProfileSelectedSubjects(nextSubjects);
    setProfileFormData((prev: any) => ({
      ...(prev || {}),
      mata_pelajaran: nextSubjects.join(', '),
    }));
  };

  const filteredMataPelajaranOptions = mataPelajaranOptions.filter((subject) =>
    subject.toLowerCase().includes(profileSubjectSearch.toLowerCase())
  );

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Connection State
  const [useD1, setUseD1] = useState<boolean>(true);
  const [dbStatus, setDbStatus] = useState<'disconnected' | 'testing' | 'connected' | 'error'>('disconnected');
  const [dbErrorMessage, setDbErrorMessage] = useState<string | null>(null);

  // Real-time Database state
  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [selectedStudentData, setSelectedStudentData] = useState<DataSiswa | null>(() => {
    try {
      const saved = localStorage.getItem('rapor_siswa_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [activeStudent, setActiveStudent] = useState<Student | null>(() => {
    try {
      const saved = localStorage.getItem('rapor_siswa_session');
      if (saved) {
        const student = JSON.parse(saved) as DataSiswa;
        return {
          id: student.nis,
          name: student.nama,
          class: student.kelompok_kelas || 'Umum',
          parent_name: student.no_whatsapp_orang_tua ? 'Orang Tua' : 'Wali Siswa',
          academic_year: '2025/2026',
          semester: 'Ganjil'
        };
      }
    } catch {}
    return null;
  });
  const [regularSchedules, setRegularSchedules] = useState<RegularSchedule[]>([]);
  const [additionalSchedules, setAdditionalSchedules] = useState<AdditionalSchedule[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [attendanceMonthFilter, setAttendanceMonthFilter] = useState<string>('all');
  const [learningProgress, setLearningProgress] = useState<LearningProgress[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [nilaiEvaluasi, setNilaiEvaluasi] = useState<NilaiEvaluasi[]>([]);
  const [nilaiStandar, setNilaiStandar] = useState<NilaiStandar[]>([]);
  const [nilaiSnbtUtbk, setNilaiSnbtUtbk] = useState<NilaiSnbtUtbk[]>([]);
  const [outsideServices, setOutsideServices] = useState<OutsideService[]>([]);
  const [permintaanPelayanan, setPermintaanPelayanan] = useState<PermintaanPelayanan[]>([]);

  // Loading state
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // KBM Reguler Loading State
  const [isKbmLoading, setIsKbmLoading] = useState<boolean>(false);

  const todayDateObj = new Date();
  const todayDateStr = `${todayDateObj.getFullYear()}-${String(todayDateObj.getMonth() + 1).padStart(2, '0')}-${String(todayDateObj.getDate()).padStart(2, '0')}`;


  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState<boolean>(false);

  // Synchronize activeStudent & selectedStudentId when currentStudent changes
  useEffect(() => {
    if (currentStudent) {
      const mappedStudent: Student = {
        id: currentStudent.nis,
        name: currentStudent.nama,
        class: currentStudent.kelompok_kelas || 'Umum',
        parent_name: currentStudent.no_whatsapp_orang_tua ? 'Orang Tua' : 'Wali Siswa',
        academic_year: '2025/2026',
        semester: 'Ganjil'
      };
      setActiveStudent(mappedStudent);
      setSelectedStudentId(currentStudent.nis);
      setSelectedStudentData(currentStudent);
    } else {
      setActiveStudent(null);
      setSelectedStudentData(null);
    }
    if (currentStudent?.nis) {
      // OneSignal removed — no action required here for subscription linking
    }
  }, [currentStudent]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Monitor network connectivity & auto-refresh full data when online is restored
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('📶 Koneksi terhubung kembali. Memperbarui seluruh data...', 'info');
      setDataRefreshCounter(prev => prev + 1);
    };

    const handleOffline = () => {
      setIsOnline(false);
      showToast('⚠️ Koneksi internet terputus. Menggunakan data tersimpan (Offline Mode).', 'info');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRefreshData = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);

    try {
      if (selectedStudentId) {
        localStorage.removeItem(`kbm_reguler_${selectedStudentId}`);
        localStorage.removeItem(`kbm_khusus_${selectedStudentId}`);
        localStorage.removeItem(`rapor_srv_${selectedStudentId}`);
        localStorage.removeItem(`rapor_eval_${selectedStudentId}`);
        localStorage.removeItem(`rapor_std_${selectedStudentId}`);
        localStorage.removeItem(`rapor_snbt_${selectedStudentId}`);
        localStorage.removeItem(`rapor_booking_${selectedStudentId}`);
        localStorage.removeItem(`rapor_attendance_${selectedStudentId}`);
        localStorage.removeItem(`rapor_progress_${selectedStudentId}`);
        
        const cleanNis = selectedStudentId.replace(/[^a-zA-Z0-9]/g, '');
        if (cleanNis) {
          localStorage.removeItem(`kbm_reguler_${cleanNis}`);
          localStorage.removeItem(`kbm_khusus_${cleanNis}`);
          localStorage.removeItem(`rapor_booking_${cleanNis}`);
        }
      }

      // Force re-fetch of all student records and schedules from D1
      setDataRefreshCounter(prev => prev + 1);

      await new Promise(resolve => setTimeout(resolve, 800));

      showToast('Data berhasil diperbarui dari database', 'success');
    } catch (err) {
      console.error('Gagal memperbarui data:', err);
      showToast('Gagal memperbarui data', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('rapor_siswa_session');
    localStorage.removeItem('active_nis');
    setCurrentStudent(null);
    setSelectedStudentData(null);
    setSelectedStudentId('60-444-001-6');
    setIsMobileMenuOpen(false);
    showToast('Berhasil keluar dari portal.', 'info');
  };

  // Show customized Toast function
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setCustomToast({ message, type });
    setTimeout(() => {
      setCustomToast(null);
    }, 4000);
  };

  // Listen for PWA installation prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if already in standalone PWA mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallBanner(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const triggerInstall = async () => {
    if (!deferredPrompt) {
      showToast('Gunakan Menu Berbagi (Share) di browser Anda dan pilih "Tambahkan ke Layar Utama" (Add to Home Screen) untuk menginstal.', 'info');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      showToast('Terima kasih telah menginstal aplikasi!', 'success');
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  // Test Connection to D1 & Fetch Initial Data
  const testD1Connection = async (showNotifications = true) => {
    setDbStatus('testing');
    setDbErrorMessage(null);
    try {
      // Test fetching students from main data_siswa table
      const { data: siswaData, error } = await d1
        .from('data_siswa')
        .select('*');

      if (error) throw error;

      if (siswaData && siswaData.length > 0) {
        // Map data_siswa to Student format
        const mappedStudents: Student[] = siswaData.map(item => ({
          id: item.nis,
          name: item.nama,
          class: item.kelompok_kelas || 'Umum',
          parent_name: item.no_whatsapp_orang_tua ? 'Orang Tua' : 'Wali Siswa',
          academic_year: '2025/2026',
          semester: 'Ganjil'
        }));
        setStudentsList(mappedStudents);
        setUseD1(true);
        setDbStatus('connected');
        if (showNotifications) {
          showToast('Berhasil terhubung ke database! Data real-time aktif.', 'success');
        }
        return true;
      } else {
        // Connected but empty table
        setUseD1(true);
        setDbStatus('connected');
        if (showNotifications) {
          showToast('Terhubung ke database, namun tabel data_siswa masih kosong.', 'info');
        }
        return true;
      }
    } catch (err: any) {
      console.warn('Gagal koneksi ke database:', err);
      setDbStatus('error');
      setDbErrorMessage(err.message || 'Koneksi gagal atau tabel di database belum dibuat.');
      // Keep useD1 as true since the user wants a direct connection
      setUseD1(true);
      setStudentsList([]);
      if (showNotifications) {
        showToast(`Koneksi database gagal: ${err.message}`, 'error');
      }
      return false;
    }
  };

  // Automatically attempt D1 connection on load
  useEffect(() => {
    testD1Connection(false);
  }, []);

  // Fetch student specific data when selectedStudentId changes or connection type changes
  useEffect(() => {
    const loadStudentData = async () => {
      if (!selectedStudentId) return;
      setIsLoading(true);
      
      // Sync active student info first
      if (currentStudent && currentStudent.nis === selectedStudentId) {
        setActiveStudent({
          id: currentStudent.nis,
          name: currentStudent.nama,
          class: currentStudent.kelompok_kelas || 'Umum',
          parent_name: currentStudent.no_whatsapp_orang_tua ? 'Orang Tua' : 'Wali Siswa',
          academic_year: '2025/2026',
          semester: 'Ganjil'
        });
        setSelectedStudentData(currentStudent);
      } else {
        try {
          const { data: profileData, error: profileErr } = await d1
            .from('data_siswa')
            .select('*')
            .eq('nis', selectedStudentId)
            .maybeSingle();

          if (!profileErr && profileData) {
            setActiveStudent({
              id: profileData.nis,
              name: profileData.nama,
              class: profileData.kelompok_kelas || 'Umum',
              parent_name: profileData.no_whatsapp_orang_tua ? 'Orang Tua' : 'Wali Siswa',
              academic_year: '2025/2026',
              semester: 'Ganjil'
            });
            setSelectedStudentData(profileData);
          }
        } catch (err) {
          console.error('Error fetching selected student profile:', err);
        }
      }



      // Build candidate NIS list to support both hyphenated & non-hyphenated formats in database
      const cleanNis = selectedStudentId.replace(/[^a-zA-Z0-9]/g, '');
      const nisCandidates = [selectedStudentId];
      if (cleanNis && cleanNis !== selectedStudentId) {
        nisCandidates.push(cleanNis);
      }
      if (cleanNis.length === 9) {
        const patterned = `${cleanNis.slice(0, 2)}-${cleanNis.slice(2, 5)}-${cleanNis.slice(5, 8)}-${cleanNis.slice(8)}`;
        if (!nisCandidates.includes(patterned)) {
          nisCandidates.push(patterned);
        }
      }
      const siswaIdCandidates = [...new Set(
        [selectedStudentData?.id, currentStudent?.id]
          .filter(Boolean)
          .map(String)
      )];

      // 1. Initial cached dataset load for immediate offline availability
      try {
        const cachedSrv = localStorage.getItem(`rapor_srv_${selectedStudentId}`);
        const cachedEval = localStorage.getItem(`rapor_eval_${selectedStudentId}`);
        const cachedStd = localStorage.getItem(`rapor_std_${selectedStudentId}`);
        const cachedSnbt = localStorage.getItem(`rapor_snbt_${selectedStudentId}`);
        const cachedBooking = localStorage.getItem(`rapor_booking_${selectedStudentId}`);
        const cachedAttendance = localStorage.getItem(`rapor_attendance_${selectedStudentId}`);
        const cachedProgress = localStorage.getItem(`rapor_progress_${selectedStudentId}`);

        if (cachedSrv) setOutsideServices(JSON.parse(cachedSrv));
        if (cachedEval) setNilaiEvaluasi(JSON.parse(cachedEval));
        if (cachedStd) setNilaiStandar(JSON.parse(cachedStd));
        if (cachedSnbt) setNilaiSnbtUtbk(JSON.parse(cachedSnbt));
        if (cachedBooking) setPermintaanPelayanan(JSON.parse(cachedBooking));
        if (cachedAttendance) setAttendanceRecords(JSON.parse(cachedAttendance));
        if (cachedProgress) setLearningProgress(JSON.parse(cachedProgress));
      } catch (cacheErr) {
        console.warn('Gagal membaca cache lokal:', cacheErr);
      }

      // D1 loading logic
      try {
        const loadByStudentIdentity = async (tableName: string) => {
          const [nisResult, siswaResult] = await Promise.all([
            d1.from(tableName).select('*').in('nis', nisCandidates).order('tanggal', { ascending: false }),
            siswaIdCandidates.length > 0
              ? d1.from(tableName).select('*').in('siswa_id', siswaIdCandidates).order('tanggal', { ascending: false })
              : Promise.resolve({ data: [], error: null })
          ]);

          const rowsById = new Map<string, any>();
          for (const row of [...(nisResult.data || []), ...(siswaResult.data || [])]) {
            const rowKey = String(row.id ?? `${row.nis ?? ''}:${row.siswa_id ?? ''}:${row.tanggal ?? ''}`);
            rowsById.set(rowKey, row);
          }

          const combined = Array.from(rowsById.values());
          combined.sort((a, b) => {
            const dateA = parseDateSafe(a.tanggal || a.created_at)?.getTime() || 0;
            const dateB = parseDateSafe(b.tanggal || b.created_at)?.getTime() || 0;
            return dateB - dateA;
          });

          return {
            data: combined,
            error: nisResult.error && siswaResult.error ? nisResult.error : null
          };
        };

        // Parallel fetches for tables
        const [
          pbRes, // perkembangan_belajar response
          srvRes,
          evalRes,
          stdRes,
          snbtRes,
          bookingRes
        ] = await Promise.all([
          loadByStudentIdentity('perkembangan_belajar'),
          d1.from('riwayat_pelayanan_siswa').select('*').in('nis', nisCandidates).order('tanggal', { ascending: false }),
          loadByStudentIdentity('nilai_evaluasi'),
          d1.from('nilai_standar').select('*').in('nis', nisCandidates).order('tanggal', { ascending: false }),
          d1.from('nilai_snbt').select('*').in('nis', nisCandidates).order('tanggal', { ascending: false }),
          (async () => {
            const [kbmBookingRes, mainBookingRes] = await Promise.all([
              d1Kbm.from('permintaan_pelayanan').select('*').in('nis', nisCandidates).order('created_at', { ascending: false }),
              d1.from('permintaan_pelayanan').select('*').in('nis', nisCandidates).order('created_at', { ascending: false })
            ]);

            const mapById = new Map();
            if (kbmBookingRes.data && Array.isArray(kbmBookingRes.data)) {
              kbmBookingRes.data.forEach((item: any) => mapById.set(item.id, item));
            }
            if (mainBookingRes.data && Array.isArray(mainBookingRes.data)) {
              mainBookingRes.data.forEach((item: any) => {
                if (!mapById.has(item.id)) {
                  mapById.set(item.id, item);
                }
              });
            }

            const combinedBookings = Array.from(mapById.values());
            combinedBookings.sort((a, b) => {
              const dateA = parseDateSafe(a.created_at)?.getTime() || 0;
              const dateB = parseDateSafe(b.created_at)?.getTime() || 0;
              return dateB - dateA;
            });

            return { 
              data: combinedBookings, 
              error: kbmBookingRes.error && mainBookingRes.error ? kbmBookingRes.error : null 
            };
          })()
        ]);

        if (srvRes.data) {
          setOutsideServices(srvRes.data);
          localStorage.setItem(`rapor_srv_${selectedStudentId}`, JSON.stringify(srvRes.data));
        }
        if (evalRes.data) {
          const evaluationRows = evalRes.data.filter((row: any) => {
            const rowNis = String(row?.nis ?? '').trim();
            const rowStudentId = String(row?.siswa_id ?? '').trim();
            return nisCandidates.includes(rowNis) || (
              rowStudentId.length > 0 && siswaIdCandidates.includes(rowStudentId)
            );
          });
          setNilaiEvaluasi(evaluationRows);
          localStorage.setItem(`rapor_eval_${selectedStudentId}`, JSON.stringify(evaluationRows));
        }
        if (stdRes.data) {
          setNilaiStandar(stdRes.data);
          localStorage.setItem(`rapor_std_${selectedStudentId}`, JSON.stringify(stdRes.data));
        }
        if (snbtRes.data) {
          setNilaiSnbtUtbk(snbtRes.data);
          localStorage.setItem(`rapor_snbt_${selectedStudentId}`, JSON.stringify(snbtRes.data));
        }
        if (bookingRes.data !== undefined && bookingRes.data !== null) {
          setPermintaanPelayanan(bookingRes.data);
          localStorage.setItem(`rapor_booking_${selectedStudentId}`, JSON.stringify(bookingRes.data));
        }

        if (pbRes.error) {
          console.warn('Gagal mengambil data presensi/perkembangan dari D1:', pbRes.error);
        } else {
          const progressRows = Array.isArray(pbRes.data) ? pbRes.data : [];

          // Map to AttendanceRecords
          // Baris perkembangan tanpa kolom kehadiran atau tanpa tanggal valid (>= 2000) tidak boleh masuk ke log presensi.
          const mappedAttendance: Attendance[] = progressRows
            .filter((row: any) => {
              const hasKehadiran = String(row.kehadiran ?? '').trim().length > 0;
              const parsedDate = parseDateSafe(row.tanggal);
              const isValidDate = parsedDate !== null && parsedDate.getFullYear() >= 2000;
              return hasKehadiran && isValidDate;
            })
            .map((row: any) => {
            let status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa' | 'Alpha' = 'Hadir';
            const rawKehadiran = (row.kehadiran || '').trim().toLowerCase();
            if (rawKehadiran.startsWith('h')) status = 'Hadir';
            else if (rawKehadiran.startsWith('s')) status = 'Sakit';
            else if (rawKehadiran.startsWith('i')) status = 'Izin';
            else if (rawKehadiran.startsWith('a')) status = 'Alpha';
            
            return {
              id: row.id,
              student_id: row.nis || row.siswa_id || selectedStudentId,
              date: row.tanggal,
              subject: row.mata_pelajaran || 'Umum',
              status,
              notes: row.catatan_pengajar || row.materi_sub_bab || ''
            };
          });
          setAttendanceRecords(mappedAttendance);
          localStorage.setItem(`rapor_attendance_${selectedStudentId}`, JSON.stringify(mappedAttendance));

          // Map to LearningProgress
          const mappedProgress: LearningProgress[] = progressRows.map((row: any) => {
            let status: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Butuh Perhatian' = 'Baik';
            const pct = row.prosen_penguasaan != null ? Number(row.prosen_penguasaan) : null;
            if (pct !== null) {
              if (pct >= 85) status = 'Sangat Baik';
              else if (pct >= 70) status = 'Baik';
              else if (pct >= 55) status = 'Cukup';
              else status = 'Butuh Perhatian';
            }

            let notes = row.catatan_pengajar || '';
            const stats: string[] = [];
            if (row.prosen_penguasaan != null) stats.push(`Penguasaan: ${row.prosen_penguasaan}%`);
            if (row.prosen_penjelasan != null) stats.push(`Penjelasan: ${row.prosen_penjelasan}%`);
            if (row.prosen_kondisi != null) stats.push(`Kondisi: ${row.prosen_kondisi}%`);
            if (stats.length > 0) {
              notes = `[${stats.join(', ')}] ${notes}`;
            }

            return {
              id: row.id,
              student_id: row.nis || row.siswa_id || selectedStudentId,
              date: row.tanggal,
              subject: row.mata_pelajaran || 'Umum',
              progress_title: row.materi_sub_bab || 'Materi Pembelajaran',
              status,
              notes: notes || 'Tidak ada catatan tambahan.',
              penguasaan: row.prosen_penguasaan != null ? Number(row.prosen_penguasaan) : undefined,
              penjelasan: row.prosen_penjelasan != null ? Number(row.prosen_penjelasan) : undefined,
              kondisi: row.prosen_kondisi != null ? Number(row.prosen_kondisi) : undefined
            };
          });
          setLearningProgress(mappedProgress);
          localStorage.setItem(`rapor_progress_${selectedStudentId}`, JSON.stringify(mappedProgress));
        }

        // Save last sync timestamp for cache freshness check
        localStorage.setItem('last_rapor_sync_timestamp', Date.now().toString());
      } catch (err: any) {
        console.warn('Gagal memuat data dari D1 (Menggunakan data tersimpan offline jika ada):', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadStudentData();
  }, [selectedStudentId, useD1, currentStudent, dataRefreshCounter]);

  // Periodic Cache Update every 15 minutes (900,000ms) automatically
  useEffect(() => {
    const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

    // 1. Auto timer every 15 minutes
    const intervalId = setInterval(() => {
      console.log('🔄 Periodic 15-minute cache update triggered automatically.');
      setDataRefreshCounter((prev) => prev + 1);
    }, FIFTEEN_MINUTES_MS);

    // 2. Tab focus / visibility check (if > 15 mins passed since last sync)
    const handleSyncCheck = () => {
      if (document.visibilityState === 'visible') {
        const lastSyncStr = localStorage.getItem('last_rapor_sync_timestamp');
        if (lastSyncStr) {
          const lastSyncTime = parseInt(lastSyncStr, 10);
          if (Date.now() - lastSyncTime >= FIFTEEN_MINUTES_MS) {
            console.log('🔄 Tab visible & >15 minutes elapsed. Refreshing local cache...');
            setDataRefreshCounter((prev) => prev + 1);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleSyncCheck);
    window.addEventListener('focus', handleSyncCheck);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleSyncCheck);
      window.removeEventListener('focus', handleSyncCheck);
    };
  }, []);



  // Fetch KBM Reguler and Khusus schedule based on active student profile
  useEffect(() => {
    const loadKbmSchedules = async () => {
      // Don't block if we can fall back to defaults, but currentStudent is required
      if (!currentStudent) return;
      
      // Load from cache first
      const cachedReg = localStorage.getItem(`kbm_reguler_${selectedStudentId}`);
      const cachedKhusus = localStorage.getItem(`kbm_khusus_${selectedStudentId}`);
      if (cachedReg) {
        try { setRegularSchedules(JSON.parse(cachedReg)); } catch (_) {}
      }
      if (cachedKhusus) {
        try { setAdditionalSchedules(JSON.parse(cachedKhusus)); } catch (_) {}
      }
      
      setIsKbmLoading(true);
      try {
        let queryReg = d1Kbm.from('jadwal_reguler').select('*');
        let queryKhusus = d1Kbm.from('jadwal_khusus').select('*');
        
        // Match with the active student's profile data
        const activeCabang = (selectedStudentData?.cabang || currentStudent.cabang || '').trim();
        const activeKelas = (selectedStudentData?.kelompok_kelas || currentStudent.kelompok_kelas || '').trim();
        const activeJenjang = (selectedStudentData?.jenjang_studi || currentStudent.jenjang_studi || '').trim();
        const activeSekolah = (selectedStudentData?.asal_sekolah || currentStudent.asal_sekolah || '').trim();
        
        if (activeCabang) {
          queryReg = queryReg.ilike('cabang', `%${activeCabang}%`);
          queryKhusus = queryKhusus.ilike('cabang', `%${activeCabang}%`);
        }

        // Limit D1 query row count to maintain high speed and prevent heavy database reads
        queryReg = queryReg.order('class_order', { ascending: true }).limit(300);
        queryKhusus = queryKhusus.order('tanggal', { ascending: false }).order('class_order', { ascending: true }).limit(300);
        
        const [regRes, khususRes] = await Promise.all([queryReg, queryKhusus]);

        if (regRes.error) throw regRes.error;
        if (khususRes.error) throw khususRes.error;

        const rawRegSchedules = (regRes.data || []);
        const rawKhususSchedules = (khususRes.data || []);
        
        // Extract student subjects list cleanly (from state or student profile)
        const getStudentSubjectsList = (): string[] => {
          const raw = profileSelectedSubjects.length > 0
            ? profileSelectedSubjects
            : (selectedStudentData?.mata_pelajaran || currentStudent?.mata_pelajaran);

          if (!raw) return [];

          let list: string[] = [];
          if (Array.isArray(raw)) {
            list = raw.map(s => String(s));
          } else if (typeof raw === 'string') {
            list = raw.split(/[;,]/);
          }

          return list
            .map(s => String(s).trim().toLowerCase().replace(/\s+/g, ' '))
            .filter(Boolean);
        };

        const studentSubjects = getStudentSubjectsList();
        const normalize = (val: any) => String(val || '').trim().toLowerCase().replace(/\s+/g, ' ');

        const isScheduleMatch = (row: any, targetJenis: 'Reguler' | 'Khusus') => {
          if (!row) return false;

          // 1. Check KBM type
          const rowJenis = normalize(row.jenis_kbm || row.jenis || row.tipe);
          if (rowJenis) {
            if (targetJenis === 'Reguler' && rowJenis.includes('khusus')) return false;
            if (targetJenis === 'Khusus' && !rowJenis.includes('khusus') && rowJenis !== 'khusus') return false;
          }

          // 2. Check Cabang
          if (activeCabang) {
            const normCabang = normalize(activeCabang);
            const rowCabang = normalize(row.cabang);
            if (rowCabang && !rowCabang.includes(normCabang) && !normCabang.includes(rowCabang)) {
              return false;
            }
          }

          // 3. Check Subject existence
          const rowSubjectRaw = row.mata_pelajaran || row.mapel || row.subject || row.nama_mapel || row.pelajaran;
          const rowSubject = normalize(rowSubjectRaw);

          if (!rowSubject || rowSubject === 'mata pelajaran' || rowSubject === '-') {
            return false;
          }

          if (targetJenis === 'Reguler') {
            // KHUSUS MENU JADWAL KBM REGULER:
            // Data diambil murni berdasarkan Cabang dan Kelompok Kelas saja (semua mapel kelas reguler ditampilkan)
            const normActiveKelas = normalize(activeKelas);
            const rowKelasRaw = normalize(row.kelompok_kelas || row.kelas || row.sekolah);

            if (normActiveKelas) {
              if (!rowKelasRaw) {
                return false;
              }
              const rowItems = rowKelasRaw.split(/[,;\/]+/).map(s => s.trim()).filter(Boolean);
              const matchesClass = rowItems.some(item => {
                if (item === normActiveKelas) return true;
                
                const cleanActive = normActiveKelas.replace(/[^a-z0-9]/g, '');
                const cleanItem = item.replace(/[^a-z0-9]/g, '');
                
                if (cleanItem === cleanActive) return true;

                // Ensure grade number matches if present
                const activeNums = normActiveKelas.match(/\d+/g) || [];
                const itemNums = item.match(/\d+/g) || [];
                if (activeNums.length > 0 && itemNums.length > 0) {
                  if (activeNums[0] !== itemNums[0]) {
                    return false;
                  }
                }

                return cleanItem.includes(cleanActive) || cleanActive.includes(cleanItem);
              });

              if (!matchesClass) {
                return false;
              }
            }

            return true;
          } else {
            // KHUSUS MENU JADWAL KBM KHUSUS:
            // Data diambil murni berdasarkan Cabang, Jenjang Studi, dan Asal Sekolah saja
            
            // 1. Check Jenjang Studi
            const normActiveJenjang = normalize(activeJenjang);
            const rowJenjangRaw = normalize(row.jenjang_studi || row.jenjang);
            
            if (normActiveJenjang) {
              if (!rowJenjangRaw) {
                return false;
              }
              const cleanActiveJenjang = normActiveJenjang.replace(/[^a-z0-9]/g, '');
              const cleanRowJenjang = rowJenjangRaw.replace(/[^a-z0-9]/g, '');
              if (!cleanRowJenjang.includes(cleanActiveJenjang) && !cleanActiveJenjang.includes(cleanRowJenjang)) {
                return false;
              }
            }
            
            // 2. Check Asal Sekolah
            const normActiveSekolah = normalize(activeSekolah);
            const rowSekolahRaw = normalize(row.sekolah || row.asal_sekolah);
            
            if (normActiveSekolah) {
              if (!rowSekolahRaw) {
                return false;
              }
              const cleanActiveSekolah = normActiveSekolah.replace(/[^a-z0-9]/g, '');
              const cleanRowSekolah = rowSekolahRaw.replace(/[^a-z0-9]/g, '');
              if (!cleanRowSekolah.includes(cleanActiveSekolah) && !cleanActiveSekolah.includes(cleanRowSekolah)) {
                return false;
              }
            }

            return true;
          }
        };

        let filteredRegSchedules = rawRegSchedules.filter((row: any) => isScheduleMatch(row, 'Reguler'));
        let filteredKhususSchedules = rawKhususSchedules.filter((row: any) => isScheduleMatch(row, 'Khusus'));



        let mappedRegSchedules: RegularSchedule[] = filteredRegSchedules.map((row: any) => {
          const waktuStr = String(row.waktu || row.jam || row.time || '');
          const waktuParts = waktuStr.split('-');
          const time_start = waktuParts[0]?.trim() || '';
          const time_end = waktuParts[1]?.trim() || '';

          const subjectName = String(row.mata_pelajaran || row.mapel || row.subject || row.nama_mapel || row.pelajaran || '').trim() || 'Mata Pelajaran';
          const teacherName = String(row.nama_pengajar || row.pengajar || row.tentor || row.guru || '').trim() || 'Pengajar';

          let dayName = row.hari || '';
          if (row.tanggal) {
            const date = parseDateSafe(row.tanggal);
            if (date) {
              const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
              dayName = days[date.getDay()];
            } else if (typeof row.tanggal === 'string' && row.tanggal.trim()) {
              dayName = row.tanggal.trim();
            }
          }

          return {
            id: row.id,
            student_id: selectedStudentId,
            day: dayName,
            subject: subjectName,
            time_start,
            time_end,
            teacher: teacherName,
            classroom: row.sekolah || row.kelompok_kelas || row.kelas || '',
            tanggal: row.tanggal,
            kelas: row.kelompok_kelas || row.kelas
          };
        });

        let mappedKhususSchedules: AdditionalSchedule[] = filteredKhususSchedules.map((row: any) => {
          const waktuStr = String(row.waktu || row.jam || row.time || '');
          const waktuParts = waktuStr.split('-');
          const time_start = waktuParts[0]?.trim() || '';
          const time_end = waktuParts[1]?.trim() || '';
          
          let dayName = row.hari || '';
          let status = 'Aktif';
          
          if (row.tanggal) {
            const date = parseDateSafe(row.tanggal);
            if (date) {
              const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
              dayName = days[date.getDay()];
              
              const today = new Date();
              const dateTime = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
              const todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
              if (dateTime < todayTime) {
                  status = 'Selesai';
              }
            } else if (typeof row.tanggal === 'string' && row.tanggal.trim()) {
              dayName = row.tanggal.trim();
            }
          }

          return {
            id: row.id,
            student_id: selectedStudentId,
            day: dayName,
            subject: String(row.mata_pelajaran || row.mapel || row.subject || row.nama_mapel || row.pelajaran || '').trim() || 'Mata Pelajaran',
            time_start,
            time_end,
            teacher: String(row.nama_pengajar || row.pengajar || row.tentor || row.guru || '').trim() || 'Pengajar',
            status: status,
            tanggal: row.tanggal,
            kelas: row.kelompok_kelas || row.kelas
          };
        });

        // Deduplicate schedules with identical subject, time, teacher, day/date, and class
        const dedupeList = <T extends { subject: string; time_start?: string; time_end?: string; teacher?: string; day?: string; tanggal?: string; kelas?: string }>(list: T[]): T[] => {
          const seen = new Set<string>();
          return list.filter(item => {
            const key = `${item.subject}_${item.time_start || ''}_${item.time_end || ''}_${item.teacher || ''}_${item.day || ''}_${item.tanggal || ''}_${item.kelas || ''}`.toLowerCase().replace(/\s+/g, '');
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        };

        mappedRegSchedules = dedupeList(mappedRegSchedules).sort((a, b) => {
          const dateComp = compareScheduleDates(a.tanggal, b.tanggal);
          if (dateComp !== 0) return dateComp;
          return (a.time_start || '').localeCompare(b.time_start || '');
        });

        mappedKhususSchedules = dedupeList(mappedKhususSchedules).sort((a, b) => {
          const dateComp = compareScheduleDates(a.tanggal, b.tanggal);
          if (dateComp !== 0) return dateComp;
          return (a.time_start || '').localeCompare(b.time_start || '');
        });

        setRegularSchedules(mappedRegSchedules);
        setAdditionalSchedules(mappedKhususSchedules);
        localStorage.setItem(`kbm_reguler_${selectedStudentId}`, JSON.stringify(mappedRegSchedules));
        localStorage.setItem(`kbm_khusus_${selectedStudentId}`, JSON.stringify(mappedKhususSchedules));
      } catch (err: any) {
        console.warn('Gagal memuat jadwal dari database KBM:', err);
        setRegularSchedules([]);
        setAdditionalSchedules([]);
      } finally {
        setIsKbmLoading(false);
      }
    };

    loadKbmSchedules();
  }, [selectedStudentId, currentStudent, selectedStudentData, profileSelectedSubjects, dataRefreshCounter]);



  // Handle manual parent login/search by NISN
  const handleStudentSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(null);
    const trimmedId = studentInputId.trim();
    if (!trimmedId) {
      setSearchError('Harap masukkan NISN siswa.');
      return;
    }

    // Check if exist in active list (exact or normalized comparison)
    const found = studentsList.some(s => s.id === trimmedId || s.id.replace(/\D/g, '') === trimmedId.replace(/\D/g, ''));
    if (found) {
      const match = studentsList.find(s => s.id === trimmedId || s.id.replace(/\D/g, '') === trimmedId.replace(/\D/g, ''));
      if (match) {
        setSelectedStudentId(match.id);
        showToast(`Berhasil memuat data siswa NIS: ${match.id}`, 'success');
      }
    } else {
      setSearchError('Siswa dengan nomor NIS tersebut tidak ditemukan di database. Pastikan nomor NIS Anda sudah terdaftar.');
    }
  };

  const availableAttendanceMonths = useMemo(() => {
    const monthsMap = new Map<string, string>();
    attendanceRecords.forEach(record => {
      const d = parseDateSafe(record.date);
      if (d) {
        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!monthsMap.has(ym)) {
           const monthName = MONTHS_INDO[d.getMonth()];
           monthsMap.set(ym, `${monthName} ${d.getFullYear()}`);
        }
      }
    });
    return Array.from(monthsMap.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([value, label]) => ({ value, label }));
  }, [attendanceRecords]);

  const filteredAttendanceRecords = useMemo(() => {
    if (attendanceMonthFilter === 'all') return attendanceRecords;
    return attendanceRecords.filter(record => {
      const d = parseDateSafe(record.date);
      if (!d) return false;
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return ym === attendanceMonthFilter;
    });
  }, [attendanceRecords, attendanceMonthFilter]);

  // Helper for attendance stats
  const getAttendanceStats = () => {
    const stats = { percent: 100, hadir: 0, sakit: 0, izin: 0, alpa: 0, total: 0 };
    
    if (!filteredAttendanceRecords || filteredAttendanceRecords.length === 0) {
      if (attendanceMonthFilter !== 'all') {
        const expected = getExpectedSessionsForMonth(attendanceMonthFilter);
        stats.alpa = expected;
        stats.total = expected;
        stats.percent = 0;
      }
      return stats;
    }

    const hadir = filteredAttendanceRecords.filter(r => r.status === 'Hadir').length;
    const sakit = filteredAttendanceRecords.filter(r => r.status === 'Sakit').length;
    const izin = filteredAttendanceRecords.filter(r => r.status === 'Izin').length;
    const alpaInDb = filteredAttendanceRecords.filter(r => r.status === 'Alpa' || r.status === 'Alpha').length;
    
    let extraAlpa = 0;
    let expectedTotal = 0;

    if (attendanceMonthFilter !== 'all') {
      expectedTotal = getExpectedSessionsForMonth(attendanceMonthFilter);
      const currentTotal = hadir + sakit + izin + alpaInDb;
      extraAlpa = Math.max(0, expectedTotal - currentTotal);
    } else {
      // Sum up expected sessions for all available months
      availableAttendanceMonths.forEach(m => {
        expectedTotal += getExpectedSessionsForMonth(m.value);
      });
      const currentTotal = hadir + sakit + izin + alpaInDb;
      extraAlpa = Math.max(0, expectedTotal - currentTotal);
    }

    const totalAlpa = alpaInDb + extraAlpa;
    const totalSessions = Math.max(filteredAttendanceRecords.length, hadir + sakit + izin + totalAlpa);

    return {
      percent: totalSessions > 0 ? Math.round((hadir / totalSessions) * 100) : 100,
      hadir,
      sakit,
      izin,
      alpa: totalAlpa,
      total: totalSessions
    };
  };

  const getExpectedSessionsForMonth = (monthStr: string) => {
    if (monthStr === 'all') return 0;
    const now = new Date();
    const parts = monthStr.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      return 12; // Past month: 4 weeks * 3
    }
    
    if (year === currentYear && month === currentMonth) {
      const day = now.getDate();
      if (day <= 7) return 3;
      if (day <= 14) return 6;
      if (day <= 21) return 9;
      return 12;
    }
    
    return 0; // Future month
  };

  // Helper for grade averages
  const getGradeStats = () => {
    const scores: number[] = [];
    nilaiEvaluasi.forEach(e => { if (e.nilai != null) scores.push(Number(e.nilai)); });
    nilaiStandar.forEach(s => { if (s.nilai != null) scores.push(Number(s.nilai)); });

    if (scores.length === 0) return { average: 0, highest: 0, lowest: 0, total: 0 };
    const average = roundScore(scores.reduce((a, b) => a + b, 0) / scores.length);
    const highest = roundScore(Math.max(...scores));
    const lowest = roundScore(Math.min(...scores));
    return {
      average,
      highest,
      lowest,
      total: scores.length
    };
  };

  const attendanceStats = getAttendanceStats();
  const gradeStats = getGradeStats();

  const groupedSnbt = useMemo(() => {
    const map = new Map<string, {
      tanggal: string;
      jenis_tes: string;
      subjects: { [key: string]: number };
      total: number;
      rerata: number;
    }>();

    nilaiSnbtUtbk.forEach(row => {
      const key = `${row.tanggal}_${row.jenis_tes || 'SNBT'}`;
      if (!map.has(key)) {
        map.set(key, {
          tanggal: row.tanggal,
          jenis_tes: row.jenis_tes || 'SNBT',
          subjects: {},
          total: 0,
          rerata: 0
        });
      }
      const group = map.get(key)!;
      if (row.mata_pelajaran && row.scor != null) {
        const parsedScore = Number(row.scor);
        group.subjects[row.mata_pelajaran] = isNaN(parsedScore) ? 0 : roundScore(parsedScore);
      }
    });

    return Array.from(map.values()).map(group => {
      const scores = Object.values(group.subjects);
      const total = scores.reduce((a, b) => a + b, 0);
      group.total = roundScore(total);
      group.rerata = scores.length > 0 ? roundScore(total / scores.length) : 0;
      return group;
    }).sort((a, b) => {
      const dateA = parseDateSafe(a.tanggal)?.getTime() || 0;
      const dateB = parseDateSafe(b.tanggal)?.getTime() || 0;
      return dateB - dateA;
    });
  }, [nilaiSnbtUtbk]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSql(true);
    showToast('Script SQL berhasil disalin ke clipboard!', 'success');
    setTimeout(() => setCopiedSql(false), 2000);
  };



  // Render Login page if student is not authenticated
  if (!currentStudent) {
    return (
      <div id="rapor-app-root" className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
        {/* Toast Notification Container */}
        {customToast && (
          <div 
            id="custom-toast" 
            className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-50 flex items-center gap-3 p-4 rounded-xl shadow-lg border animate-bounce max-w-sm ${
              customToast.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : customToast.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-sky-50 border-sky-200 text-sky-800'
            }`}
          >
            {customToast.type === 'success' ? <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" /> : <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />}
            <p className="text-sm font-medium flex-1">{customToast.message}</p>
            <button
              type="button"
              onClick={() => setCustomToast(null)}
              aria-label="Tutup notifikasi"
              title="Tutup notifikasi"
              className="ml-auto p-1 rounded-lg hover:bg-black/5 transition cursor-pointer shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <Login 
          onLoginSuccess={(student, fromD1) => {
            // Reset previous student data states
            setAttendanceRecords([]);
            setLearningProgress([]);
            setNilaiEvaluasi([]);
            setNilaiStandar([]);
            setNilaiSnbtUtbk([]);
            setOutsideServices([]);
            setPermintaanPelayanan([]);
            setRegularSchedules([]);
            setAdditionalSchedules([]);

            // Set new student session and selected student
            setCurrentStudent(student);
            setSelectedStudentData(student);
            setSelectedStudentId(student.nis);
            localStorage.setItem('rapor_siswa_session', JSON.stringify(student));
            localStorage.setItem('active_nis', String(student.nis || ''));

            // Force immediate data reload for the logged in student
            setDataRefreshCounter(prev => prev + 1);

            showToast(`Berhasil masuk sebagai ${student.nama}`, 'success');
          }}
          useD1={useD1}
          dbStatus={dbStatus}
          onToggleDemoMode={() => {
            const nextMode = !useD1;
            setUseD1(nextMode);
            showToast(`Beralih ke ${nextMode ? 'Database Cloudflare D1' : 'Mode Demo Lokal'}`, 'info');
          }}
        />
      </div>
    );
  }

  return (
    <div id="rapor-app-root" className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Toast Notification Container */}
      {customToast && (
        <div 
          id="custom-toast" 
          className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-50 flex items-center gap-3 p-4 rounded-xl shadow-lg border animate-bounce max-w-sm ${
            customToast.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : customToast.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-sky-50 border-sky-200 text-sky-800'
          }`}
        >
          {customToast.type === 'success' ? <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" /> : <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />}
          <p className="text-sm font-medium flex-1">{customToast.message}</p>
          <button
            type="button"
            onClick={() => setCustomToast(null)}
            aria-label="Tutup notifikasi"
            title="Tutup notifikasi"
            className="ml-auto p-1 rounded-lg hover:bg-black/5 transition cursor-pointer shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}


      {/* TOP NAVIGATION / NAVBAR */}
      <header id="app-navbar" className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 border-b border-slate-200/80 dark:border-slate-800 backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center overflow-hidden w-10 h-10 shrink-0">
              <img 
                src="/logo.png"
                alt="Logo Rapor Siswa"
                className="w-full h-full object-contain" 
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  if (e.currentTarget.parentElement) {
                    e.currentTarget.parentElement.innerHTML = '<svg class="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>';
                  }
                }}
              />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">Rapor Kita</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                {isOnline ? 'Pantauan Real-Time' : 'Mode Offline (Tersimpan)'}
                <span className={`inline-block w-2 h-2 rounded-full ${isOnline ? (useD1 ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400') : 'bg-amber-500'}`}></span>
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {/* Refresh Data Button */}
            <button
              id="btn-refresh-data-desktop"
              onClick={handleRefreshData}
              disabled={isRefreshing}
              title="Perbarui Data dari Database"
              className="flex items-center gap-1.5 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 text-xs font-bold py-2 px-3.5 rounded-xl border border-sky-200/80 dark:border-sky-800 transition duration-150 cursor-pointer disabled:opacity-60 active:scale-[0.98]"
            >
              <RefreshCw className={`h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Memperbarui...' : 'Perbarui Data'}</span>
            </button>

            {/* Profile, Settings & Logout Button for Authenticated Student */}
            <button
              id="btn-profile-desktop"
              onClick={() => setShowProfileModal(true)}
              title="Lihat Profil Siswa"
              className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 px-3 py-1.5 rounded-2xl cursor-pointer transition duration-150 active:scale-[0.98] text-left outline-none"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 hover:text-sky-700 dark:hover:text-sky-400 transition">{currentStudent?.nama}</span>
            </button>

            <button
              id="btn-install-pwa-desktop"
              onClick={() => setIsPWAInstallModalOpen(true)}
              title="Pasang / Instal Aplikasi (PWA)"
              className="flex items-center gap-1.5 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 text-xs font-bold py-2 px-3 rounded-xl border border-sky-200/80 dark:border-sky-800 transition duration-150 cursor-pointer"
            >
              <Smartphone className="h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
              <span>Instal App</span>
            </button>

            <button
              id="btn-notifications-desktop"
              onClick={() => setIsNotificationModalOpen(true)}
              title="Pusat Notifikasi"
              className="relative p-2 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl border border-slate-200/60 dark:border-slate-700 transition duration-150 cursor-pointer"
            >
              <Bell className={`h-4 w-4 shrink-0 transition-transform ${unreadNotifCount > 0 ? 'animate-bell-wiggle text-indigo-600 dark:text-indigo-400' : ''}`} />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
              )}
            </button>

            <button
              id="btn-settings-desktop"
              onClick={() => setIsSettingsModalOpen(true)}
              title="Pengaturan Aplikasi"
              className="flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 p-2 rounded-xl border border-slate-200/60 dark:border-slate-700 transition duration-150 cursor-pointer"
            >
              <Settings className="h-4 w-4 shrink-0 text-slate-600 dark:text-slate-300" />
            </button>

            <button
              id="btn-logout-desktop"
              onClick={handleLogout}
              className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-bold py-2 px-3.5 rounded-xl border border-slate-200/60 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-800 transition duration-150 cursor-pointer"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Keluar</span>
            </button>
          </div>

          {/* Mobile Profile Toggle */}
          <div className="flex md:hidden items-center gap-2 relative">
            <button 
              id="btn-refresh-data-mobile-icon"
              onClick={handleRefreshData}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/60 border border-sky-200/80 dark:border-sky-800 text-sky-700 dark:text-sky-300 transition cursor-pointer disabled:opacity-60"
              title="Perbarui Data"
            >
              <RefreshCw className={`h-4 w-4 text-sky-600 dark:text-sky-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            <button 
              id="btn-notifications-mobile-icon"
              onClick={() => setIsNotificationModalOpen(true)}
              className="relative p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-200 transition cursor-pointer"
              title="Notifikasi"
            >
              <Bell className={`h-4 w-4 text-indigo-600 dark:text-indigo-400 ${unreadNotifCount > 0 ? 'animate-bell-wiggle' : ''}`} />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
              )}
            </button>

            <button 
              id="btn-settings-mobile-icon"
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-200 transition cursor-pointer"
              title="Pengaturan"
            >
              <Settings className="h-4 w-4" />
            </button>

            <button 
              id="btn-mobile-menu-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex items-center justify-center bg-slate-50 hover:bg-sky-50 border border-slate-100 hover:border-sky-200 p-1 rounded-xl cursor-pointer transition duration-150 active:scale-[0.98] outline-none"
            >
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 font-extrabold text-xs flex items-center justify-center border border-sky-100 shrink-0">
                {currentStudent?.nama ? currentStudent.nama.split(' ').slice(0, 2).map(n => n[0]).join('') : 'S'}
              </div>
            </button>
            
            {/* Mobile Profile Dropdown */}
            {isMobileMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <button
                  onClick={() => { handleRefreshData(); setIsMobileMenuOpen(false); }}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-sky-50 hover:text-sky-700 flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 text-sky-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Perbarui Data
                </button>
                <button
                  onClick={() => { setShowProfileModal(true); setIsMobileMenuOpen(false); }}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 hover:text-sky-700 flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  Lihat Profil
                </button>
                <button
                  onClick={() => { setIsSettingsModalOpen(true); setIsMobileMenuOpen(false); }}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 hover:text-sky-700 flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Pengaturan
                </button>
                <button
                  onClick={() => { setIsPWAInstallModalOpen(true); setIsMobileMenuOpen(false); }}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center gap-2"
                >
                  <Smartphone className="h-4 w-4" />
                  Pasang Aplikasi (PWA)
                </button>
                <div className="h-px bg-slate-100 my-1"></div>
                <button
                  onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Keluar
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* PWA INSTALL BANNER */}
      <PWAInstallBanner onOpenGuide={() => setIsPWAInstallModalOpen(true)} />

      {/* OFFLINE STATUS BANNER */}
      {!isOnline && (
        <div id="offline-banner" className="bg-amber-500 text-white text-xs font-semibold py-2 px-4 text-center flex items-center justify-center gap-2 shadow-sm animate-in fade-in">
          <WifiOff className="h-4 w-4 shrink-0" />
          <span>Modus Offline: Menampilkan data jadwal & nilai tersimpan. Data akan diperbarui otomatis saat koneksi internet terhubung kembali.</span>
        </div>
      )}

      {/* CORE WRAPPER - SIDEBAR & WORKSPACE */}
      <main id="main-content-layout" className="flex-1 max-w-7xl mx-auto w-full px-4 pb-24 pt-6 md:py-8 flex gap-6">
        
        {/* DESKTOP SIDEBAR */}
        <aside id="desktop-sidebar-nav" className={`hidden md:flex flex-col gap-5 transition-all duration-300 shrink-0 ${isSidebarCollapsed ? 'w-16' : 'w-64'}`}>
          
          {/* Main Menus */}
          <div className={`bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-1 transition-all duration-300 ${isSidebarCollapsed ? 'p-2' : 'p-4'}`}>
            {!isSidebarCollapsed ? (
              <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase px-3 mb-2 transition duration-300">Navigasi Utama</p>
            ) : (
              <div className="h-px bg-slate-100 my-2 mx-1" />
            )}
            
            <button 
              id="btn-menu-overview"
              onClick={() => setActiveTab('overview')} 
              className={`flex items-center transition duration-150 ${
                isSidebarCollapsed ? 'justify-center p-3 rounded-xl' : 'gap-3 px-3 py-3 rounded-xl text-xs font-bold text-left'
              } ${activeTab === 'overview' ? 'bg-sky-600 text-white shadow-md shadow-sky-100' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50'}`}
              title={isSidebarCollapsed ? "Dashboard Ringkasan" : undefined}
            >
              <BookOpen className="h-4 w-4 shrink-0" />
              {!isSidebarCollapsed && <span>Dashboard Ringkasan</span>}
            </button>

            <button 
              id="btn-menu-kbm-reguler"
              onClick={() => setActiveTab('kbm-reguler')} 
              className={`flex items-center transition duration-150 ${
                isSidebarCollapsed ? 'justify-center p-3 rounded-xl' : 'gap-3 px-3 py-3 rounded-xl text-xs font-bold text-left'
              } ${activeTab === 'kbm-reguler' ? 'bg-sky-600 text-white shadow-md shadow-sky-100' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50'}`}
              title={isSidebarCollapsed ? "Jadwal KBM Reguler" : undefined}
            >
              <Calendar className="h-4 w-4 shrink-0 animate-hover-bounce" />
              {!isSidebarCollapsed && <span>Jadwal KBM Reguler</span>}
            </button>

            <button 
              id="btn-menu-kbm-tambahan"
              onClick={() => setActiveTab('kbm-tambahan')} 
              className={`flex items-center transition duration-150 ${
                isSidebarCollapsed ? 'justify-center p-3 rounded-xl' : 'gap-3 px-3 py-3 rounded-xl text-xs font-bold text-left'
              } ${activeTab === 'kbm-tambahan' ? 'bg-sky-600 text-white shadow-md shadow-sky-100' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50'}`}
              title={isSidebarCollapsed ? "Jadwal KBM Khusus" : undefined}
            >
              <Clock className="h-4 w-4 shrink-0" />
              {!isSidebarCollapsed && <span>Jadwal KBM Khusus</span>}
            </button>

            <button 
              id="btn-menu-presensi"
              onClick={() => setActiveTab('presensi')} 
              className={`flex items-center transition duration-150 ${
                isSidebarCollapsed ? 'justify-center p-3 rounded-xl' : 'gap-3 px-3 py-3 rounded-xl text-xs font-bold text-left'
              } ${activeTab === 'presensi' ? 'bg-sky-600 text-white shadow-md shadow-sky-100' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50'}`}
              title={isSidebarCollapsed ? "Riwayat Presensi" : undefined}
            >
              <ClipboardList className="h-4 w-4 shrink-0" />
              {!isSidebarCollapsed && <span>Riwayat Presensi</span>}
            </button>

            <button 
              id="btn-menu-perkembangan"
              onClick={() => setActiveTab('perkembangan')} 
              className={`flex items-center transition duration-150 ${
                isSidebarCollapsed ? 'justify-center p-3 rounded-xl' : 'gap-3 px-3 py-3 rounded-xl text-xs font-bold text-left'
              } ${activeTab === 'perkembangan' ? 'bg-sky-600 text-white shadow-md shadow-sky-100' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50'}`}
              title={isSidebarCollapsed ? "Perkembangan Belajar" : undefined}
            >
              <BookMarked className="h-4 w-4 shrink-0" />
              {!isSidebarCollapsed && <span>Perkembangan Belajar</span>}
            </button>

            <button 
              id="btn-menu-uji-materi"
              onClick={() => setActiveTab('uji-materi')} 
              className={`flex items-center transition duration-150 ${
                isSidebarCollapsed ? 'justify-center p-3 rounded-xl' : 'gap-3 px-3 py-3 rounded-xl text-xs font-bold text-left'
              } ${activeTab === 'uji-materi' ? 'bg-sky-600 text-white shadow-md shadow-sky-100' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50'}`}
              title={isSidebarCollapsed ? "Uji Materi" : undefined}
            >
              <FileText className="h-4 w-4 shrink-0" />
              {!isSidebarCollapsed && <span>Uji Materi</span>}
            </button>

            <button 
              id="btn-menu-nilai"
              onClick={() => setActiveTab('nilai')} 
              className={`flex items-center transition duration-150 ${
                isSidebarCollapsed ? 'justify-center p-3 rounded-xl' : 'gap-3 px-3 py-3 rounded-xl text-xs font-bold text-left'
              } ${activeTab === 'nilai' ? 'bg-sky-600 text-white shadow-md shadow-sky-100' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50'}`}
              title={isSidebarCollapsed ? "Riwayat Nilai Siswa" : undefined}
            >
              <Award className="h-4 w-4 shrink-0" />
              {!isSidebarCollapsed && <span>Riwayat Nilai Siswa</span>}
            </button>

            <button 
              id="btn-menu-luar-kbm"
              onClick={() => setActiveTab('luar-kbm')} 
              className={`flex items-center transition duration-150 ${
                isSidebarCollapsed ? 'justify-center p-3 rounded-xl' : 'gap-3 px-3 py-3 rounded-xl text-xs font-bold text-left'
              } ${activeTab === 'luar-kbm' ? 'bg-sky-600 text-white shadow-md shadow-sky-100' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50'}`}
              title={isSidebarCollapsed ? "Pelayanan Luar KBM" : undefined}
            >
              <HeartHandshake className="h-4 w-4 shrink-0" />
              {!isSidebarCollapsed && <span>Pelayanan Luar KBM</span>}
            </button>
            <button 
              id="btn-menu-analisa"
              onClick={() => setActiveTab('analisa')} 
              className={`flex items-center transition duration-150 ${
                isSidebarCollapsed ? 'justify-center p-3 rounded-xl' : 'gap-3 px-3 py-3 rounded-xl text-xs font-bold text-left'
              } ${activeTab === 'analisa' ? 'bg-sky-600 text-white shadow-md shadow-sky-100' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50'}`}
              title={isSidebarCollapsed ? "Analisa" : undefined}
            >
              <Search className="h-4 w-4 shrink-0" />
              {!isSidebarCollapsed && <span>Analisa</span>}
            </button>

            {/* Collapse/Expand Toggle Button */}
            <div className="border-t border-slate-100 mt-3 pt-3 flex flex-col">
              <button 
                id="btn-sidebar-toggle"
                onClick={toggleSidebar}
                className={`flex items-center transition duration-150 cursor-pointer text-slate-400 hover:text-slate-800 dark:text-slate-200 hover:bg-slate-50 ${
                  isSidebarCollapsed ? 'justify-center p-3 rounded-xl' : 'gap-3 px-3 py-3 rounded-xl text-xs font-bold text-left'
                }`}
                title={isSidebarCollapsed ? "Perbesar Menu" : "Perkecil Menu"}
              >
                {isSidebarCollapsed ? (
                  <ChevronRight className="h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0" />
                ) : (
                  <ChevronLeft className="h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0" />
                )}
                {!isSidebarCollapsed && <span className="truncate">Sembunyikan Menu</span>}
              </button>
            </div>
          </div>
        </aside>

        {/* WORKSPACE & VIEWS */}
        <section id="workspace-container" className="flex-1 min-w-0">
          
          <AnimatePresence mode="wait">
            {/* TAB 1: OVERVIEW / DASHBOARD */}
            {activeTab === 'overview' && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                id="view-overview" 
                className="space-y-6"
              >
              
              {/* Active KBM Schedule Alert System */}
              <ActiveScheduleAlert
                regularSchedules={regularSchedules}
                additionalSchedules={additionalSchedules}
                currentStudent={currentStudent}
                onOpenLeaveModal={handleOpenLeaveModal}
                onNavigateTab={(tab) => setActiveTab(tab as any)}
              />

              {/* Quick stats grid */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                
                {/* Stat 1: Attendance */}
                <div className="bg-white p-3 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center sm:items-start justify-center sm:justify-between text-center sm:text-left gap-2 sm:gap-0">
                  <div className="flex flex-col items-center sm:items-start w-full">
                    <p className="text-[9px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider line-clamp-1">Presensi</p>
                    <h3 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5 sm:mt-1">{attendanceStats.percent}%</h3>
                    <p className="hidden sm:block text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                      <span className="text-emerald-600 font-bold">{attendanceStats.hadir} Hadir</span> dari {attendanceRecords.length} Hari
                    </p>
                  </div>
                  <div className="hidden sm:flex bg-emerald-50 text-emerald-600 p-3.5 rounded-2xl shrink-0">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                </div>

                {/* Stat 2: Grade Average */}
                <div className="bg-white p-3 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center sm:items-start justify-center sm:justify-between text-center sm:text-left gap-2 sm:gap-0">
                  <div className="flex flex-col items-center sm:items-start w-full">
                    <p className="text-[9px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider line-clamp-1">Rata-Rata</p>
                    <h3 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5 sm:mt-1">{gradeStats.average || 0}</h3>
                    <p className="hidden sm:block text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                      Nilai tertinggi: <strong className="text-slate-800 dark:text-slate-200">{gradeStats.highest || 0}</strong>
                    </p>
                  </div>
                  <div className="hidden sm:flex bg-sky-50 text-sky-600 p-3.5 rounded-2xl shrink-0">
                    <Award className="h-6 w-6" />
                  </div>
                </div>

                {/* Stat 3: Schedules */}
                <div className="bg-white p-3 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center sm:items-start justify-center sm:justify-between text-center sm:text-left gap-2 sm:gap-0">
                  <div className="flex flex-col items-center sm:items-start w-full">
                    <p className="text-[9px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider line-clamp-1">Jadwal KBM</p>
                    <h3 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5 sm:mt-1">
                      {regularSchedules.length} <span className="hidden sm:inline text-xs font-bold text-slate-500 dark:text-slate-400">Mapel</span>
                    </h3>
                    <p className="hidden sm:block text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                      Tambahan: <strong className="text-indigo-600">{additionalSchedules.length} Kelas Aktif</strong>
                    </p>
                  </div>
                  <div className="hidden sm:flex bg-indigo-50 text-indigo-600 p-3.5 rounded-2xl shrink-0">
                    <Calendar className="h-6 w-6" />
                  </div>
                </div>
              </div>

              {/* Two Column details section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Column Left: Today Schedule & Attendance overview */}
                <div className="space-y-6">
                  
                  {/* Today regular schedule */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-sky-600" />
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Jadwal Hari Ini</h4>
                      </div>
                      <button 
                        id="btn-overview-go-regular"
                        onClick={() => setActiveTab('kbm-reguler')} 
                        className="text-xs text-sky-600 hover:text-sky-700 font-bold flex items-center gap-1"
                      >
                        Cek <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      {(() => {
                        const rawTodaySchedules = [
                          ...regularSchedules.filter(isScheduleForToday),
                          ...additionalSchedules.filter(isScheduleForToday)
                        ];

                        // Deduplicate by subject, time_start, time_end, and teacher
                        const todayMap = new Map<string, typeof rawTodaySchedules[0]>();
                        rawTodaySchedules.forEach(item => {
                          const key = `${item.subject}_${item.time_start || ''}_${item.time_end || ''}_${item.teacher || ''}`.toLowerCase().replace(/\s+/g, '');
                          if (!todayMap.has(key)) {
                            todayMap.set(key, item);
                          }
                        });
                        const todaySchedules = Array.from(todayMap.values());

                        if (todaySchedules.length === 0) {
                          return (
                            <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">Tidak ada jadwal hari ini.</p>
                          );
                        }

                        return todaySchedules.map((item, idx) => {
                          const timeStatus = getScheduleTimeStatus(item);
                          const isActive = timeStatus.isActiveNow;
                          const isFinished = isScheduleFinished(item);

                          return (
                            <div key={idx} className={`flex items-center justify-between p-3 rounded-xl transition ${
                              isActive
                                ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-2 border-emerald-500 shadow-sm'
                                : 'bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:shadow-xs'
                            }`}>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.subject}</p>
                                  {isActive && (
                                    <span className="text-[9px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping"></span>
                                      LIVE
                                    </span>
                                  )}
                                  {'status' in item && (
                                    <span className="text-[9px] font-extrabold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-800">
                                      Khusus
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.teacher}</p>
                                {!isFinished ? (
                                  <button
                                    onClick={() => handleOpenLeaveModal({
                                      subject: item.subject,
                                      date: item.tanggal || getTodayIndoString(false),
                                      time: `${item.time_start} - ${item.time_end}`,
                                      teacher: item.teacher,
                                      kelas: item.kelas || currentStudent?.kelompok_kelas
                                    })}
                                    className="mt-1.5 text-[10px] font-extrabold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-200/80 transition flex items-center gap-1 cursor-pointer"
                                  >
                                    <FileText className="h-3 w-3 text-amber-600" />
                                    Isi Izin/Sakit
                                  </button>
                                ) : (
                                  <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700/50 px-2 py-0.5 rounded-md">
                                    <CheckCircle className="h-2.5 w-2.5 text-slate-400" />
                                    KBM Selesai
                                  </span>
                                )}
                              </div>
                              <div className="text-right flex flex-col items-end">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 ${
                                  isActive
                                    ? 'bg-emerald-600 text-white font-black'
                                    : 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300'
                                }`}>
                                  <Clock className="h-3 w-3" />
                                  {item.time_start} - {item.time_end}
                                </span>
                                <p className="text-[10px] text-slate-400 mt-1 font-bold">{item.kelas || currentStudent?.kelompok_kelas || 'KELAS'}</p>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Action Cards: Booking & Presensi Layanan */}
                  <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
                    {/* Card 1: Booking / Reservasi Jadwal Layanan */}
                    <div className="bg-gradient-to-br from-indigo-50 to-sky-50 dark:bg-slate-800 dark:bg-none border border-indigo-200/80 dark:border-slate-700 rounded-2xl p-3 sm:p-4 flex flex-col justify-between gap-2.5 shadow-3xs">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className="p-2 sm:p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs shrink-0">
                          <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                        <div>
                          <h5 className="text-[11px] sm:text-xs font-bold text-blue-600 dark:text-blue-400 leading-tight">Reservasi Layanan</h5>
                          <p className="text-[10px] sm:text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-0.5 hidden sm:block">Ajukan konsultasi & bimbingan tambahan</p>
                        </div>
                      </div>
                      <button
                        id="btn-booking-layanan"
                        onClick={() => setIsBookingModalOpen(true)}
                        className="w-full text-[11px] sm:text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-2.5 rounded-xl shadow-xs flex items-center justify-center gap-1 transition shrink-0 cursor-pointer"
                      >
                        <CalendarDays className="h-3.5 w-3.5" />
                        <span>Reservasi</span>
                      </button>
                    </div>

                    {/* Card 2: Presensi Layanan di Luar KBM */}
                    <div className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:bg-slate-800 dark:bg-none border border-teal-200/80 dark:border-slate-700 rounded-2xl p-3 sm:p-4 flex flex-col justify-between gap-2.5 shadow-3xs">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className="p-2 sm:p-2.5 bg-teal-600 text-white rounded-xl shadow-xs shrink-0">
                          <HeartHandshake className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                        <div>
                          <h5 className="text-[11px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 leading-tight">Presensi Layanan</h5>
                          <p className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5 hidden sm:block">Catat layanan konseling luar KBM</p>
                        </div>
                      </div>
                      <button
                        id="btn-presensi-layanan-luar-kbm"
                        onClick={() => setIsOutsideServiceModalOpen(true)}
                        className="w-full text-[11px] sm:text-xs font-extrabold bg-teal-600 hover:bg-teal-700 text-white py-2 px-2.5 rounded-xl shadow-xs flex items-center justify-center gap-1 transition shrink-0 cursor-pointer"
                      >
                        <HeartHandshake className="h-3.5 w-3.5" />
                        <span>Presensi</span>
                      </button>
                    </div>
                  </div>


                  {/* Card 3: Uji Materi & Pemahaman */}
                  <div className="bg-gradient-to-br from-indigo-600 via-sky-600 to-blue-700 rounded-2xl p-4 sm:p-5 text-white shadow-md relative overflow-hidden">
                    <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
                    <div className="flex items-center justify-between relative z-10 gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 sm:p-3 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner shrink-0">
                          <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-white text-xs sm:text-sm truncate">Uji Materi & Pemahaman</h4>
                            <span className="bg-emerald-400 text-slate-900 dark:text-slate-100 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">Baru</span>
                          </div>
                          <p className="text-[11px] sm:text-xs text-sky-100 mt-0.5 font-medium line-clamp-1">
                            Latihan soal secara online.
                          </p>
                        </div>
                      </div>
                      <button
                        id="btn-overview-go-uji-materi"
                        onClick={() => setActiveTab('uji-materi')}
                        className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-white text-sky-700 hover:bg-sky-50 font-extrabold text-xs rounded-xl shadow-xs transition shrink-0 cursor-pointer"
                      >
                        <span>Mulai Uji</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-white/15 flex items-center justify-between text-[11px] text-sky-100 relative z-10">
                      <span className="flex items-center gap-1 font-semibold truncate">
                        <Sparkles className="h-3.5 w-3.5 text-amber-300 shrink-0" />
                        <span className="truncate">Asah pemahaman dengan kuis interaktif</span>
                      </span>
                      <button
                        onClick={() => setActiveTab('uji-materi')}
                        className="text-xs font-black text-amber-300 hover:underline flex items-center gap-1 shrink-0 ml-2"
                      >
                        Buka <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Attendance breakdown summary */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
                      <div className="flex items-center gap-2">
                        <ClipboardList className="h-5 w-5 text-sky-600" />
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Rekap Presensi & Kehadiran</h4>
                      </div>
                      <button 
                        id="btn-overview-go-presensi"
                        onClick={() => setActiveTab('presensi')} 
                        className="text-xs text-sky-600 hover:text-sky-700 font-bold flex items-center gap-1"
                      >
                        Cek <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Simple Custom SVG Donut Chart */}
                    <div className="flex items-center gap-6">
                      <div className="relative shrink-0 flex items-center justify-center">
                        <svg className="w-24 h-24 transform -rotate-90">
                          <circle cx="48" cy="48" r="38" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                          <circle cx="48" cy="48" r="38" stroke="#10b981" strokeWidth="8" fill="transparent"
                            strokeDasharray={238.76}
                            strokeDashoffset={238.76 - (238.76 * attendanceStats.percent) / 100}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute text-center">
                          <span className="text-base font-black text-slate-900 dark:text-slate-100">{attendanceStats.percent}%</span>
                          <span className="block text-[8px] text-slate-400 font-bold uppercase leading-none">Kehadiran</span>
                        </div>
                      </div>

                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100/50">
                          <span className="block text-[10px] font-bold text-emerald-800 uppercase">Hadir</span>
                          <span className="text-lg font-black text-emerald-900">{attendanceStats.hadir} Hari</span>
                        </div>
                        <div className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-100/50">
                          <span className="block text-[10px] font-bold text-blue-800 uppercase">Sakit</span>
                          <span className="text-lg font-black text-blue-900">{attendanceStats.sakit} Hari</span>
                        </div>
                        <div className="bg-amber-50/50 p-2.5 rounded-xl border border-amber-100/50">
                          <span className="block text-[10px] font-bold text-amber-800 uppercase">Izin</span>
                          <span className="text-lg font-black text-amber-900">{attendanceStats.izin} Hari</span>
                        </div>
                        <div className="bg-rose-50/50 p-2.5 rounded-xl border border-rose-100/50">
                          <span className="block text-[10px] font-bold text-rose-800 uppercase">Alpha</span>
                          <span className="text-lg font-black text-rose-900">{attendanceStats.alpa} Hari</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Column Right: Grades summary & Progress */}
                <div className="space-y-6">
                  
                  {/* Learning progress timeline preview */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
                      <div className="flex items-center gap-2">
                        <BookMarked className="h-5 w-5 text-sky-600" />
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Catatan Perkembangan</h4>
                      </div>
                      <button 
                        id="btn-overview-go-progress"
                        onClick={() => setActiveTab('perkembangan')} 
                        className="text-xs text-sky-600 hover:text-sky-700 font-bold flex items-center gap-1"
                      >
                        Cek <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-slate-100">
                      {learningProgress.slice(0, 2).map((item, idx) => (
                        <div key={idx} className="relative pl-7">
                          <span className="absolute left-1.5 top-1.5 w-4 h-4 rounded-full border-2 border-white bg-sky-500 shadow-sm flex items-center justify-center">
                            <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                          </span>
                          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                            <div className="flex items-center justify-between flex-wrap gap-1">
                              <span className="bg-sky-50 text-sky-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                                {item.subject}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold">{item.date}</span>
                            </div>
                            <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1.5">{item.progress_title}</h5>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 italic">"{item.notes}"</p>
                          </div>
                        </div>
                      ))}
                      {learningProgress.length === 0 && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">Belum ada catatan perkembangan.</p>
                      )}
                    </div>
                  </div>

                  {/* Grades overview and average bar */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-sky-600" />
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Nilai Mata Pelajaran Teratas</h4>
                      </div>
                      <button 
                        id="btn-overview-go-grades"
                        onClick={() => setActiveTab('nilai')} 
                        className="text-xs text-sky-600 hover:text-sky-700 font-bold flex items-center gap-1"
                      >
                        Cek <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      {nilaiEvaluasi.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-700 dark:text-slate-300">{item.mata_pelajaran} <span className="font-normal text-slate-400">({item.sub_bab_kode_soal || 'Evaluasi'})</span></span>
                            <span className="font-black text-slate-900 dark:text-slate-100">{formatScore(item.nilai)}</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                Number(item.nilai) >= 90 ? 'bg-emerald-500' : Number(item.nilai) >= 80 ? 'bg-sky-500' : 'bg-amber-400'
                              }`} 
                              style={{ width: `${Math.min(100, Math.max(0, Number(item.nilai) || 0))}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                      {nilaiEvaluasi.length === 0 && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">Belum ada data nilai evaluasi.</p>
                      )}
                    </div>
                  </div>

                </div>

              </div>

              {/* Weekly Trend Summary */}
              <div className="mt-6">
                <WeeklySummaryCard 
                  attendanceRecords={attendanceRecords}
                  learningProgress={learningProgress}
                />
              </div>

              </motion.div>
            )}

            {/* TAB 2: JADWAL KBM REGULER */}
            {activeTab === 'kbm-reguler' && (
              <motion.div
                key="kbm-reguler"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <KbmRegulerView
                  currentStudent={currentStudent}
                  selectedStudentData={selectedStudentData}
                  regularSchedules={regularSchedules}
                  isKbmLoading={isKbmLoading}
                  isThisOrNextMonth={isThisOrNextMonth}
                  isScheduleFinished={isScheduleFinished}
                  handleOpenLeaveModal={handleOpenLeaveModal}
                />
              </motion.div>
            )}

            {/* TAB 3: JADWAL KBM TAMBAHAN */}
            {activeTab === 'kbm-tambahan' && (
              <motion.div
                key="kbm-tambahan"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <KbmKhususView
                  currentStudent={currentStudent}
                  selectedStudentData={selectedStudentData}
                  additionalSchedules={additionalSchedules}
                  isThisOrNextMonth={isThisOrNextMonth}
                  isScheduleFinished={isScheduleFinished}
                  handleOpenLeaveModal={handleOpenLeaveModal}
                />
              </motion.div>
            )}

            {/* TAB 4: RIWAYAT PRESENSI */}
            {activeTab === 'presensi' && (
              <motion.div
                key="presensi"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <PresensiView
                  currentStudent={currentStudent}
                  attendanceRecords={filteredAttendanceRecords}
                  availableAttendanceMonths={availableAttendanceMonths}
                  attendanceMonthFilter={attendanceMonthFilter}
                  setAttendanceMonthFilter={setAttendanceMonthFilter}
                />
              </motion.div>
            )}

            {/* TAB 5: RIWAYAT PERKEMBANGAN BELAJAR */}
            {activeTab === 'perkembangan' && (
              <motion.div
                key="perkembangan"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <PerkembanganView
                  currentStudent={currentStudent}
                  learningProgress={learningProgress}
                />
              </motion.div>
            )}

            {/* TAB: UJI MATERI */}
            {activeTab === 'uji-materi' && (
              <motion.div
                key="uji-materi"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <UjiMateriView currentStudent={currentStudent} />
              </motion.div>
            )}

            {/* TAB 6: RIWAYAT NILAI-NILAI */}
            {activeTab === 'nilai' && (
              <motion.div
                key="nilai"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <NilaiView
                  currentStudent={currentStudent}
                  nilaiEvaluasi={nilaiEvaluasi}
                  nilaiStandar={nilaiStandar}
                  nilaiSnbtUtbk={nilaiSnbtUtbk}
                  groupedSnbt={groupedSnbt}
                />
              </motion.div>
            )}

            {/* TAB 7: LAYANAN DI LUAR KBM */}
            {activeTab === 'luar-kbm' && (
              <motion.div
                key="luar-kbm"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <LuarKbmView
                  currentStudent={currentStudent}
                  permintaanPelayanan={permintaanPelayanan}
                  outsideServices={outsideServices}
                  showChartLuarKbm={showChartLuarKbm}
                  setShowChartLuarKbm={setShowChartLuarKbm}
                  setIsBookingModalOpen={setIsBookingModalOpen}
                  setIsOutsideServiceModalOpen={setIsOutsideServiceModalOpen}
                />
              </motion.div>
            )}


            {/* TAB 8: ANALISA */}
            {activeTab === 'analisa' && (
              <motion.div 
                key="analisa"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                id="view-analisa" 
                className="space-y-6"
              >
                <AnalisaView 
                  attendanceRecords={attendanceRecords}
                  learningProgress={learningProgress}
                  nilaiEvaluasi={nilaiEvaluasi}
                  outsideServices={outsideServices}
                />
              </motion.div>
            )}
          </AnimatePresence>

        </section>
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav id="mobile-bottom-nav" className="md:hidden fixed bottom-3 left-3 right-3 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 px-2 py-1.5 rounded-3xl flex justify-around items-center shadow-[0_12px_36px_-8px_rgba(0,0,0,0.18)] transition-all duration-300">
        <button 
          id="btn-bottom-nav-overview"
          onClick={() => setActiveTab('overview')} 
          className={`flex flex-col items-center justify-center py-1.5 px-3 transition-all duration-200 rounded-2xl cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 font-black shadow-xs border border-sky-100 dark:border-sky-900/60 scale-102'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 font-medium'
          }`}
        >
          <div className="relative">
            <BookOpen className={`h-5 w-5 ${activeTab === 'overview' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
            {activeTab === 'overview' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-sky-500 rounded-full" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-1">Dashboard</span>
        </button>

        <button 
          id="btn-bottom-nav-kbm"
          onClick={() => setActiveTab('kbm-reguler')} 
          className={`flex flex-col items-center justify-center py-1.5 px-3 transition-all duration-200 rounded-2xl cursor-pointer ${
            activeTab === 'kbm-reguler' || activeTab === 'kbm-tambahan'
              ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 font-black shadow-xs border border-sky-100 dark:border-sky-900/60 scale-102'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 font-medium'
          }`}
        >
          <div className="relative">
            <Calendar className={`h-5 w-5 ${activeTab === 'kbm-reguler' || activeTab === 'kbm-tambahan' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
            {(activeTab === 'kbm-reguler' || activeTab === 'kbm-tambahan') && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-sky-500 rounded-full" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-1">Jadwal</span>
        </button>

        <button 
          id="btn-bottom-nav-presensi"
          onClick={() => setActiveTab('presensi')} 
          className={`flex flex-col items-center justify-center py-1.5 px-3 transition-all duration-200 rounded-2xl cursor-pointer ${
            activeTab === 'presensi'
              ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 font-black shadow-xs border border-sky-100 dark:border-sky-900/60 scale-102'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 font-medium'
          }`}
        >
          <div className="relative">
            <ClipboardList className={`h-5 w-5 ${activeTab === 'presensi' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
            {activeTab === 'presensi' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-sky-500 rounded-full" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-1">Presensi</span>
        </button>

        <button 
          id="btn-bottom-nav-nilai"
          onClick={() => setActiveTab('nilai')} 
          className={`flex flex-col items-center justify-center py-1.5 px-3 transition-all duration-200 rounded-2xl cursor-pointer ${
            activeTab === 'nilai' || activeTab === 'perkembangan'
              ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 font-black shadow-xs border border-sky-100 dark:border-sky-900/60 scale-102'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 font-medium'
          }`}
        >
          <div className="relative">
            <Award className={`h-5 w-5 ${activeTab === 'nilai' || activeTab === 'perkembangan' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
            {(activeTab === 'nilai' || activeTab === 'perkembangan') && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-sky-500 rounded-full" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-1">Nilai</span>
        </button>

        <button 
          id="btn-bottom-nav-menu"
          onClick={() => setIsMobileGridMenuOpen(true)} 
          className="flex flex-col items-center justify-center py-1.5 px-3 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200 rounded-2xl cursor-pointer font-medium"
        >
          <Menu className="h-5 w-5 stroke-2" />
          <span className="text-[10px] tracking-tight mt-1">Lainnya</span>
        </button>
      </nav>

      {/* MOBILE GRID MENU OVERLAY */}
      {isMobileGridMenuOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md md:hidden animate-fade-in flex items-end"
          onClick={() => setIsMobileGridMenuOpen(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 w-full rounded-t-3xl p-6 pb-10 border-t border-slate-200/80 dark:border-slate-800 shadow-2xl animate-slide-up space-y-5 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag Handle & Header */}
            <div>
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-4" />
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Navigasi & Layanan Siswa</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Pilih modul untuk melihat data dan fitur lengkap</p>
                </div>
                <button 
                  onClick={() => setIsMobileGridMenuOpen(false)}
                  className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-800 dark:text-slate-300 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {/* Bento Category Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {[
                { id: 'overview', icon: BookOpen, label: 'Dashboard', desc: 'Ringkasan Utama', color: 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 border-sky-100 dark:border-sky-900/50' },
                { id: 'kbm-reguler', icon: Calendar, label: 'Jadwal Reguler', desc: 'Sesi Rutin', color: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50' },
                { id: 'kbm-tambahan', icon: Clock, label: 'Jadwal Khusus', desc: 'Kelas Tambahan', color: 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50' },
                { id: 'presensi', icon: ClipboardList, label: 'Presensi', desc: 'Riwayat Kehadiran', color: 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/50' },
                { id: 'perkembangan', icon: BookMarked, label: 'Perkembangan', desc: 'Catatan Belajar', color: 'bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/50' },
                { id: 'uji-materi', icon: FileText, label: 'Uji Materi', desc: 'Kuis & Evaluasi', color: 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/50' },
                { id: 'nilai', icon: Award, label: 'Nilai Rapor', desc: 'Evaluasi Tryout', color: 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/50' },
                { id: 'luar-kbm', icon: HeartHandshake, label: 'Luar KBM', desc: 'Konsultasi & Layanan', color: 'bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 border-teal-100 dark:border-teal-900/50' },
                { id: 'analisa', icon: Search, label: 'Analisis', desc: 'Grafik Performansi', color: 'bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 border-cyan-100 dark:border-cyan-900/50' },
              ].map(item => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id as any); setIsMobileGridMenuOpen(false); }}
                    className={`flex flex-col items-center justify-between p-3 rounded-2xl border transition duration-200 text-center active:scale-95 cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                        : 'bg-slate-50/80 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 border-slate-200/70 dark:border-slate-700/70'
                    }`}
                  >
                    <div className={`p-3 rounded-xl ${isActive ? 'bg-white/10 text-white' : item.color} border mb-2`}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <span className={`text-xs font-bold leading-tight line-clamp-1 ${isActive ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>
                      {item.label}
                    </span>
                    <span className={`text-[9px] font-medium mt-0.5 line-clamp-1 ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>
                      {item.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}



      {/* STUDENT PROFILE DETAILS MODAL */}
      {showProfileModal && (
        <div 
          id="student-profile-modal-overlay" 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setShowProfileModal(false)}
        >
          <div 
            id="student-profile-modal" 
            className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 max-w-md w-full overflow-hidden animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-sky-600 to-indigo-700 p-6 text-white relative">
              <div className="flex items-center gap-4 mt-2">
                <div className="w-16 h-16 rounded-2xl bg-white/10 text-white font-extrabold text-2xl flex items-center justify-center border border-white/20 shadow-inner shrink-0">
                  {currentStudent?.nama ? currentStudent.nama.split(' ').slice(0, 2).map(n => n[0]).join('') : 'S'}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-black tracking-tight truncate">{currentStudent?.nama}</h3>
                  <p className="text-xs text-sky-100/90 font-medium mt-1 flex items-center gap-1.5 truncate">
                    <GraduationCap className="h-4 w-4 shrink-0" />
                    NIS: {currentStudent?.nis}
                  </p>
                </div>
                <div className="shrink-0 flex flex-col gap-2">
                  {!isProfileEditMode && (
                    <button
                      onClick={handleEditProfile}
                      className="bg-white/20 hover:bg-white/30 text-white text-[10px] font-extrabold px-2.5 py-1.5 rounded-lg border border-white/30 transition"
                    >
                      ✎ Edit
                    </button>
                  )}
                  <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-inner ${isDarkMode ? 'bg-indigo-900/60 border-indigo-900/60' : 'bg-white/20 border-white/10'}`}
                  >
                    <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-[#ffffff] shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center ${isDarkMode ? 'translate-x-5' : 'translate-x-0'}`}>
                      {isDarkMode ? <Moon className="h-3.5 w-3.5 text-indigo-500" /> : <Sun className="h-3.5 w-3.5 text-amber-500" />}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Profile Fields Details */}
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700 pb-2">Informasi Akademik & Pribadi</h4>
              
              {/* NAMA LENGKAP - EDITABLE */}
              <div>
                <label className="text-[9px] font-extrabold uppercase text-slate-400 block mb-0.5">Nama Lengkap</label>
                {isProfileEditMode ? (
                  <input
                    type="text"
                    value={profileFormData?.nama_lengkap || ''}
                    onChange={(e) => setProfileFormData({ ...profileFormData, nama_lengkap: e.target.value })}
                    className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="Nama lengkap siswa"
                  />
                ) : (
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{currentStudent?.nama_lengkap || currentStudent?.nama || '-'}</span>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* ASAL SEKOLAH - EDITABLE */}
                <div>
                  <label className="text-[9px] font-extrabold uppercase text-slate-400 block mb-0.5">Asal Sekolah</label>
                  {isProfileEditMode ? (
                    <input
                      type="text"
                      value={profileFormData?.asal_sekolah || ''}
                      onChange={(e) => setProfileFormData({ ...profileFormData, asal_sekolah: e.target.value })}
                      className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder="Asal sekolah"
                    />
                  ) : (
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <GraduationCap className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                      {currentStudent?.asal_sekolah || '-'}
                    </span>
                  )}
                </div>

                {/* JENJANG STUDI - READ ONLY */}
                <div>
                  <label className="text-[9px] font-extrabold uppercase text-slate-400 block mb-0.5">Jenjang Studi</label>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                    {currentStudent?.jenjang_studi || 'SMA'}
                  </span>
                </div>

                {/* KELOMPOK KELAS - READ ONLY */}
                <div>
                  <label className="text-[9px] font-extrabold uppercase text-slate-400 block mb-0.5">Kelompok Kelas</label>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Sliders className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                    {currentStudent?.kelompok_kelas || 'Umum'}
                  </span>
                </div>

                {/* CABANG - READ ONLY */}
                <div>
                  <label className="text-[9px] font-extrabold uppercase text-slate-400 block mb-0.5">Cabang</label>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                    {currentStudent?.cabang || 'Jakarta Selatan'}
                  </span>
                </div>

                {/* MATA PELAJARAN - EDITABLE */}
                <div className="sm:col-span-2">
                  <label className="text-[9px] font-extrabold uppercase text-slate-400 block mb-0.5">Mata Pelajaran Yang Dipilih</label>
                  {isProfileEditMode ? (
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => setIsProfileSubjectPickerOpen((prev) => !prev)}
                        className="w-full flex flex-wrap gap-2 rounded-2xl border border-sky-300 bg-sky-50/60 dark:bg-slate-700/80 dark:border-sky-700 p-2 min-h-[44px] text-left"
                      >
                        {profileSelectedSubjects.length > 0 ? (
                          profileSelectedSubjects.map((subject) => (
                            <span
                              key={subject}
                              className="inline-flex items-center gap-2 rounded-xl border border-sky-400 bg-sky-100 px-2.5 py-1.5 text-[11px] font-extrabold text-sky-700"
                            >
                              {subject}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-400">Klik untuk memilih mata pelajaran</span>
                        )}
                      </button>

                      {isProfileSubjectPickerOpen && (
                        <div className="rounded-2xl border border-sky-300 bg-white dark:bg-slate-800 p-2 shadow-inner">
                          <div className="flex items-center gap-2 rounded-xl border border-sky-300 px-3 py-2 text-slate-500 dark:text-slate-300 mb-2">
                            <Search className="h-4 w-4" />
                            <input
                              value={profileSubjectSearch}
                              onChange={(e) => setProfileSubjectSearch(e.target.value)}
                              placeholder="Cari..."
                              className="w-full bg-transparent text-xs text-slate-700 dark:text-slate-200 outline-none placeholder:text-slate-400"
                            />
                          </div>

                          <div className="flex items-center justify-between gap-2 pb-2 text-[10px] font-bold text-slate-500 dark:text-slate-300">
                            <span>{profileSelectedSubjects.length} dari {mataPelajaranOptions.length} dipilih</span>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const allSelected = [...new Set(mataPelajaranOptions)];
                                  setProfileSelectedSubjects(allSelected);
                                  setProfileFormData((prev: any) => ({
                                    ...(prev || {}),
                                    mata_pelajaran: allSelected.join(', '),
                                  }));
                                }}
                                className="text-sky-600 hover:text-sky-700 font-extrabold"
                              >
                                Pilih Semua
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setProfileSelectedSubjects([]);
                                  setProfileFormData((prev: any) => ({
                                    ...(prev || {}),
                                    mata_pelajaran: '',
                                  }));
                                }}
                                className="text-rose-600 hover:text-rose-700 font-extrabold"
                              >
                                Hapus Semua
                              </button>
                            </div>
                          </div>

                          <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                            {filteredMataPelajaranOptions.length > 0 ? (
                              filteredMataPelajaranOptions.map((subject) => {
                                const isSelected = profileSelectedSubjects.includes(subject);
                                return (
                                  <button
                                    key={subject}
                                    type="button"
                                    onClick={() => toggleProfileSubject(subject)}
                                    className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-bold transition ${
                                      isSelected
                                        ? 'bg-sky-100 text-sky-800 border border-sky-300'
                                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 border border-transparent'
                                    }`}
                                  >
                                    <span>{subject}</span>
                                    <span className={`inline-flex h-5 w-5 items-center justify-center rounded-md border ${
                                      isSelected
                                        ? 'border-sky-500 bg-sky-500 text-white'
                                        : 'border-slate-300 bg-white text-slate-500'
                                    }`}>
                                      {isSelected ? '✓' : ''}
                                    </span>
                                  </button>
                                );
                              })
                            ) : (
                              <div className="text-xs text-slate-400 py-3 text-center">Tidak ada mata pelajaran ditemukan.</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 flex-wrap">
                      <BookOpen className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                      <span className="bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-500/30">
                        {currentStudent?.mata_pelajaran || 'Matematika, Fisika, Kimia, Biologi'}
                      </span>
                    </span>
                  )}
                </div>

                {/* TANGGAL LAHIR - EDITABLE */}
                <div className="sm:col-span-2">
                  <label className="text-[9px] font-extrabold uppercase text-slate-400 block mb-0.5">Tanggal Lahir</label>
                  {isProfileEditMode ? (
                    <input
                      type="date"
                      value={profileFormData?.tanggal_lahir || ''}
                      onChange={(e) => setProfileFormData({ ...profileFormData, tanggal_lahir: e.target.value })}
                      className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  ) : (
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                      {currentStudent?.tanggal_lahir || '12 Oktober 2008'}
                    </span>
                  )}
                </div>
              </div>

              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700 pb-2 pt-2">Hubungan & Kontak</h4>

              <div className="grid grid-cols-1 gap-3">
                {/* WHATSAPP SISWA - EDITABLE */}
                <div>
                  <label className="text-[9px] font-extrabold uppercase text-slate-400 block mb-0.5">WhatsApp Siswa</label>
                  {isProfileEditMode ? (
                    <input
                      type="tel"
                      value={profileFormData?.no_whatsapp_siswa || ''}
                      onChange={(e) => setProfileFormData({ ...profileFormData, no_whatsapp_siswa: e.target.value })}
                      className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder="08123456789"
                    />
                  ) : (
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Smartphone className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                      {currentStudent?.no_whatsapp_siswa || '-'}
                    </span>
                  )}
                </div>

                {/* WHATSAPP ORANG TUA - EDITABLE */}
                <div>
                  <label className="text-[9px] font-extrabold uppercase text-slate-400 block mb-0.5">WhatsApp Orang Tua</label>
                  {isProfileEditMode ? (
                    <input
                      type="tel"
                      value={profileFormData?.no_whatsapp_orang_tua || ''}
                      onChange={(e) => setProfileFormData({ ...profileFormData, no_whatsapp_orang_tua: e.target.value })}
                      className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder="08123456789"
                    />
                  ) : (
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Smartphone className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                      {currentStudent?.no_whatsapp_orang_tua || '-'}
                    </span>
                  )}
                </div>

                {/* EMAIL - EDITABLE */}
                <div>
                  <label className="text-[9px] font-extrabold uppercase text-slate-400 block mb-0.5">Email</label>
                  {isProfileEditMode ? (
                    <input
                      type="email"
                      value={profileFormData?.email || ''}
                      onChange={(e) => setProfileFormData({ ...profileFormData, email: e.target.value })}
                      className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder="email@example.com"
                    />
                  ) : (
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 break-all">
                      <Mail className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                      {currentStudent?.email || '-'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 dark:bg-slate-800/80 p-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
              {isProfileEditMode ? (
                <>
                  <button 
                    onClick={handleCancelEditProfile}
                    className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-extrabold text-xs py-2.5 px-5 rounded-xl transition duration-150 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleSaveProfile}
                    disabled={isProfileSaving}
                    className="bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-extrabold text-xs py-2.5 px-5 rounded-xl transition duration-150 cursor-pointer flex items-center gap-1.5"
                  >
                    {isProfileSaving ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Menyimpan...
                      </>
                    ) : (
                      '💾 Simpan Perubahan'
                    )}
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setShowProfileModal(false)}
                  className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-extrabold text-xs py-2.5 px-5 rounded-xl transition duration-150 cursor-pointer"
                >
                  Tutup Profil
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Leave / Sakit Form Modal */}
      <LeaveFormModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        scheduleData={selectedScheduleForLeave}
        student={selectedStudentData || currentStudent}
        onSubmitSuccess={(sub) => {
          setCustomToast({
            message: `Permohonan ${sub.type} untuk ${sub.subject} (${sub.date}) berhasil dikirim.`,
            type: 'success'
          });
          setDataRefreshCounter(prev => prev + 1);
          setTimeout(() => setCustomToast(null), 4000);
        }}
      />

      {/* Outside Service Form Modal */}
      <OutsideServiceFormModal
        isOpen={isOutsideServiceModalOpen}
        onClose={() => setIsOutsideServiceModalOpen(false)}
        student={selectedStudentData || currentStudent}
        onSubmitSuccess={(sub) => {
          setCustomToast({
            message: `Presensi Layanan ${sub.subject} (${sub.date}) berhasil dicatat.`,
            type: 'success'
          });
          setDataRefreshCounter(prev => prev + 1);
          setTimeout(() => setCustomToast(null), 4000);
        }}
      />

      {/* Booking Service Form Modal */}
      <BookingServiceFormModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        student={selectedStudentData || currentStudent}
        onSubmitSuccess={(booking) => {
          setCustomToast({
            message: `Reservasi Layanan ${booking.mata_pelajaran} (${booking.tanggal}) berhasil diajukan.`,
            type: 'success'
          });
          setDataRefreshCounter(prev => prev + 1);
          setTimeout(() => setCustomToast(null), 4000);
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onOpenEditProfile={() => setShowProfileModal(true)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        student={selectedStudentData || currentStudent}
        onCheckUpdate={() => setManualCheckTrigger(prev => prev + 1)}
      />

      {/* Global App Update Checker Modal */}
      <UpdateCheckerModal manualCheckTrigger={manualCheckTrigger} />

      {/* Notification Center Modal - Displays riwayat_notifikasi_pengajar */}
      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        student={selectedStudentData || currentStudent}
        onUnreadCountChange={setUnreadNotifCount}
      />

      {/* PWA Install Modal */}
      <PWAInstallModal
        isOpen={isPWAInstallModalOpen}
        onClose={() => setIsPWAInstallModalOpen(false)}
      />

    </div>
  );
}
