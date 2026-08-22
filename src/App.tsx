import React, { useState, useEffect } from 'react';
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
import { AttendancePieChart } from './components/AttendancePieChart';
import { PerkembanganProgress } from './components/PerkembanganProgress';
import { SubjectBarChart } from './components/SubjectBarChart';
import { ServicePieChart } from './components/ServicePieChart';
import { AnalisaView } from './components/AnalisaView';
import { LeaveFormModal } from './components/LeaveFormModal';
import { OutsideServiceFormModal } from './components/OutsideServiceFormModal';
import { BookingServiceFormModal } from './components/BookingServiceFormModal';
import { formatTanggalIndo, isThisOrNextMonth } from './lib/dateUtils';
import { SettingsModal } from './components/SettingsModal';
import { NotificationModal } from './components/NotificationModal';
import { UjiMateriView } from './components/UjiMateriView';
import { UpdateCheckerModal } from './components/UpdateCheckerModal';
import { requestNotificationPermission } from './lib/pushNotifications';

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
        requestNotificationPermission(currentStudent.nis).catch(err => {
          console.warn('Failed to check/request push notification permission:', err);
        });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentStudent?.nis]);

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

          return {
            data: Array.from(rowsById.values()),
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

            return { 
              data: Array.from(mapById.values()), 
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
          // Baris perkembangan tanpa kolom kehadiran tidak boleh dihitung sebagai Hadir.
          const mappedAttendance: Attendance[] = progressRows
            .filter((row: any) => String(row.kehadiran ?? '').trim().length > 0)
            .map((row: any) => {
            let status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa' = 'Hadir';
            const rawKehadiran = (row.kehadiran || '').trim().toLowerCase();
            if (rawKehadiran.startsWith('h')) status = 'Hadir';
            else if (rawKehadiran.startsWith('s')) status = 'Sakit';
            else if (rawKehadiran.startsWith('i')) status = 'Izin';
            else if (rawKehadiran.startsWith('a')) status = 'Alpa';
            
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
      if (cachedReg) setRegularSchedules(JSON.parse(cachedReg).filter((item: any) => isThisOrNextMonth(item.tanggal)));
      if (cachedKhusus) setAdditionalSchedules(JSON.parse(cachedKhusus).filter((item: any) => isThisOrNextMonth(item.tanggal)));
      
      setIsKbmLoading(true);
      try {
        let queryReg = d1Kbm.from('jadwal_reguler').select('*');
        let queryKhusus = d1Kbm.from('jadwal_khusus').select('*');
        
        // Match with the active student's profile data
        const activeCabang = selectedStudentData?.cabang || currentStudent.cabang;
        const activeJenjang = selectedStudentData?.jenjang_studi || currentStudent.jenjang_studi;
        const activeSekolah = selectedStudentData?.asal_sekolah || currentStudent.asal_sekolah;
        const activeKelas = selectedStudentData?.kelompok_kelas || currentStudent.kelompok_kelas;
        
        if (activeCabang) {
          queryReg = queryReg.eq('cabang', activeCabang);
          queryKhusus = queryKhusus.eq('cabang', activeCabang);
        }
        if (activeJenjang) {
          queryReg = queryReg.eq('jenjang_studi', activeJenjang);
          queryKhusus = queryKhusus.eq('jenjang_studi', activeJenjang);
        }
        if (activeSekolah) {
          queryKhusus = queryKhusus.eq('sekolah', activeSekolah);
        }

        queryReg = queryReg.order('class_order', { ascending: true }).limit(100);
        queryKhusus = queryKhusus.order('tanggal', { ascending: false }).order('class_order', { ascending: true }).limit(100);
        
        const [regRes, khususRes] = await Promise.all([queryReg, queryKhusus]);

        if (regRes.error) throw regRes.error;
        if (khususRes.error) throw khususRes.error;

        const rawRegSchedules = (regRes.data || []);
        const rawKhususSchedules = (khususRes.data || []);
        
        // Parse the student's enrolled subjects from their profile
        const normalizeSubject = (value: any) => String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
        const studentSubjects = (selectedStudentData?.mata_pelajaran || currentStudent.mata_pelajaran)
          ? (selectedStudentData?.mata_pelajaran || currentStudent.mata_pelajaran)
              .split(/[;,]/)
              .map((s: string) => normalizeSubject(s))
              .filter(Boolean)
          : [];

        const isRegularScheduleMatch = (row: any) => {
          const rowJenis = normalizeSubject(row?.jenis_kbm || row?.jenis || row?.tipe || '');
          if (rowJenis && rowJenis !== 'reguler') {
            return false;
          }

          if (!studentSubjects.length) return true;

          const subjectCandidates = [
            row?.mata_pelajaran,
            row?.mapel,
            row?.subject,
            row?.nama_mata_pelajaran,
            row?.nama_pelajaran
          ].filter(Boolean);

          if (!subjectCandidates.length) return true;

          return subjectCandidates.some((candidate) => studentSubjects.includes(normalizeSubject(candidate)));
        };

        const filteredRegSchedules = (rawRegSchedules || []).filter(isRegularScheduleMatch);

        let mappedRegSchedules: RegularSchedule[] = filteredRegSchedules.map((row: any) => {
          const waktuParts = (row.waktu || '').split('-');
          const time_start = waktuParts[0]?.trim() || '';
          const time_end = waktuParts[1]?.trim() || '';

          const subjectName = row.mata_pelajaran || row.mapel || row.subject || 'Mata Pelajaran';
          const teacherName = row.nama_pengajar || row.pengajar || 'Pengajar';

          let dayName = 'Senin';
          if (row.tanggal) {
            const date = new Date(row.tanggal);
            if (!isNaN(date.getTime())) {
              const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
              dayName = days[date.getDay()];
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
            classroom: row.sekolah || '',
            tanggal: row.tanggal,
            kelas: row.kelas
          };
        });

        let mappedKhususSchedules: AdditionalSchedule[] = rawKhususSchedules.map((row: any) => {
          const waktuParts = (row.waktu || '').split('-');
          const time_start = waktuParts[0]?.trim() || '';
          const time_end = waktuParts[1]?.trim() || '';
          
          let dayName = 'Senin';
          let status = 'Aktif';
          
          if (row.tanggal) {
            const date = new Date(row.tanggal);
            if (!isNaN(date.getTime())) {
              const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
              dayName = days[date.getDay()];
              
              const today = new Date();
              const dateTime = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
              const todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
              if (dateTime < todayTime) {
                  status = 'Selesai';
              }
            }
          }

          return {
            id: row.id,
            student_id: selectedStudentId,
            day: dayName,
            subject: row.mapel || 'Mata Pelajaran',
            time_start,
            time_end,
            teacher: row.pengajar || 'Pengajar',
            status: status,
            tanggal: row.tanggal,
            kelas: row.kelas
          };
        });

        // Only show schedule for this month and next month
        mappedRegSchedules = mappedRegSchedules.filter(item => isThisOrNextMonth(item.tanggal));
        mappedKhususSchedules = mappedKhususSchedules.filter(item => isThisOrNextMonth(item.tanggal));

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
  }, [selectedStudentId, currentStudent, selectedStudentData, dataRefreshCounter]);



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

  // Helper for attendance stats
  const getAttendanceStats = () => {
    if (!attendanceRecords || attendanceRecords.length === 0) return { percent: 100, hadir: 0, sakit: 0, izin: 0, alpa: 0 };
    const total = attendanceRecords.length;
    const hadir = attendanceRecords.filter(r => r.status === 'Hadir').length;
    const sakit = attendanceRecords.filter(r => r.status === 'Sakit').length;
    const izin = attendanceRecords.filter(r => r.status === 'Izin').length;
    const alpa = attendanceRecords.filter(r => r.status === 'Alpa').length;
    return {
      percent: Math.round((hadir / total) * 100),
      hadir,
      sakit,
      izin,
      alpa
    };
  };

  // Helper for grade averages
  const getGradeStats = () => {
    const scores: number[] = [];
    nilaiEvaluasi.forEach(e => { if (e.nilai != null) scores.push(Number(e.nilai)); });
    nilaiStandar.forEach(s => { if (s.nilai != null) scores.push(Number(s.nilai)); });

    if (scores.length === 0) return { average: 0, highest: 0, lowest: 0, total: 0 };
    const average = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const highest = Math.max(...scores);
    const lowest = Math.min(...scores);
    return {
      average,
      highest,
      lowest,
      total: scores.length
    };
  };

  const attendanceStats = getAttendanceStats();
  const gradeStats = getGradeStats();

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
              title={isSidebarCollapsed ? "Jadwal KBM Tambahan" : undefined}
            >
              <Clock className="h-4 w-4 shrink-0" />
              {!isSidebarCollapsed && <span>Jadwal KBM Tambahan</span>}
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
          
          {/* TAB 1: OVERVIEW / DASHBOARD */}
          {activeTab === 'overview' && (
            <div id="view-overview" className="space-y-6">
              
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
                      {regularSchedules.filter(item => item.tanggal === todayDateStr).length > 0 ? (
                        regularSchedules.filter(item => item.tanggal === todayDateStr).map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:shadow-xs transition">
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.subject}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.teacher}</p>
                            <button
                              onClick={() => handleOpenLeaveModal({
                                subject: item.subject,
                                date: item.tanggal,
                                time: `${item.time_start} - ${item.time_end}`,
                                teacher: item.teacher,
                                kelas: item.kelas || currentStudent?.kelompok_kelas
                              })}
                              className="mt-1.5 text-[10px] font-extrabold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-200/80 transition flex items-center gap-1"
                            >
                              <FileText className="h-3 w-3 text-amber-600" />
                              Isi Izin/Sakit
                            </button>
                          </div>
                          <div className="text-right flex flex-col items-end">
                            <span className="bg-sky-50 text-sky-700 text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {item.time_start} - {item.time_end}
                            </span>
                            <p className="text-[10px] text-slate-400 mt-1 font-bold">{item.kelas || currentStudent?.kelompok_kelas || 'KELAS'}</p>
                          </div>
                        </div>
                      ))) : (
                        <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">Tidak ada jadwal hari ini.</p>
                      )}
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
                          <span className="block text-[10px] font-bold text-rose-800 uppercase">Alpa</span>
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
                            <span className="font-black text-slate-900 dark:text-slate-100">{item.nilai}</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                item.nilai >= 90 ? 'bg-emerald-500' : item.nilai >= 80 ? 'bg-sky-500' : 'bg-amber-400'
                              }`} 
                              style={{ width: `${item.nilai}%` }}
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

            </div>
          )}

          {/* TAB 2: JADWAL KBM REGULER */}
          {activeTab === 'kbm-reguler' && (() => {
            // Group by tanggal or day (filtered for current and next month only)
            const groupedSchedules: { [dateStr: string]: RegularSchedule[] } = {};
            regularSchedules
              .filter(item => isThisOrNextMonth(item.tanggal))
              .forEach(item => {
                const dateKey = item.tanggal || item.day || 'No Date';
                if (!groupedSchedules[dateKey]) {
                  groupedSchedules[dateKey] = [];
                }
                groupedSchedules[dateKey].push(item);
              });
            
            // Sort dates: Today first, then Future (ascending), then Past (descending)
            const sortedDateKeys = Object.keys(groupedSchedules).sort((a, b) => {
              if (a === 'No Date') return 1;
              if (b === 'No Date') return -1;
              
              const dateA = new Date(a);
              const dateB = new Date(b);
              
              if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0;
              
              const timeA = dateA.getTime();
              const timeB = dateB.getTime();
              
              const today = new Date();
              const todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
              
              const getDayType = (time: number) => {
                const date = new Date(time);
                const itemTime = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
                if (itemTime === todayTime) return 0; // Today
                if (itemTime > todayTime) return 1; // Future
                return 2; // Past
              };
              
              const typeA = getDayType(timeA);
              const typeB = getDayType(timeB);
              
              if (typeA !== typeB) {
                return typeA - typeB;
              }
              
              // If both are past, sort newest past first (descending)
              if (typeA === 2) {
                 return timeB - timeA;
              }
              // If both are future or today, sort nearest future first (ascending)
              return timeA - timeB;
            });

            const formatKbmDate = (dateStr: string) => {
              if (!dateStr || dateStr === 'No Date') return 'Jadwal';
              return formatTanggalIndo(dateStr, { withDayName: true, uppercase: true });
            };

            const getKbmDateBadge = (dateStr: string) => {
              if (!dateStr || dateStr === 'No Date') return null;
              const itemDate = new Date(dateStr);
              if (isNaN(itemDate.getTime())) return null;
              
              const today = new Date();
              const itemTime = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate()).getTime();
              const todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
              
              if (itemTime === todayTime) {
                return (
                  <span className="bg-red-600 text-white text-[9px] font-black tracking-widest px-2.5 py-1 rounded-full uppercase">
                    HARI INI
                  </span>
                );
              }
              
              if (itemTime > todayTime) {
                return (
                  <span className="bg-[#D1FAE5] text-[#065F46] text-[9px] font-black tracking-widest px-2.5 py-1 rounded-full uppercase">
                    AKAN DATANG
                  </span>
                );
              }
              
              return (
                <span className="bg-slate-100 text-slate-500 dark:text-slate-400 text-[9px] font-black tracking-widest px-2.5 py-1 rounded-full uppercase">
                  SELESAI
                </span>
              );
            };

            return (
              <div id="view-kbm-reguler" className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-6">
                  {/* BRANDED HEADER LIKE SCREENSHOT */}
                  <div className="flex justify-between items-start border-b border-slate-100 pb-5 mb-6">
                    <div>
                      <span className="text-[11px] font-extrabold text-slate-400 tracking-widest uppercase block mb-1">CABANG</span>
                      <h3 className="text-xl font-black text-slate-800 dark:text-slate-200 leading-none">{(selectedStudentData || currentStudent)?.cabang || 'Semarang 2'}</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-extrabold text-slate-400 tracking-widest uppercase block mb-1 text-right">JENJANG STUDI</span>
                      <h3 className="text-xl font-black text-red-600 leading-none">{(selectedStudentData || currentStudent)?.jenjang_studi || '2 SMA'}</h3>
                    </div>
                  </div>

                  {/* TIPS / INFORMATION BOX */}
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
                    <div className="text-blue-600 mt-0.5 shrink-0">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-blue-800">💡 Catatan Penting</p>
                      <p className="text-xs text-blue-700 mt-1">Pastikan Mata Pelajaran di profil sudah di isi, untuk menampilkan jadwal reguler.</p>
                    </div>
                  </div>

                  {isKbmLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-2xl border border-slate-100/50">
                      <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs font-extrabold text-slate-400 mt-3">Memuat Jadwal KBM...</p>
                    </div>
                  ) : sortedDateKeys.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 bg-slate-50/50 border border-slate-100 rounded-2xl text-center p-6">
                      <BookOpen className="h-10 w-10 text-slate-300 mb-2" />
                      <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Tidak Ada Jadwal KBM</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">Jadwal tidak ditemukan untuk Cabang, Jenjang Studi, dan Mata Pelajaran di profil siswa saat ini.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                      {sortedDateKeys.map((dateKey) => {
                        const sForDay = groupedSchedules[dateKey] || [];
                        return (
                          <div key={dateKey} className="bg-slate-50/30 dark:bg-slate-800/90 border border-slate-200/60 dark:border-slate-700/80 rounded-3xl p-5 flex flex-col shadow-2xs hover:shadow-xs transition duration-200">
                            <div className="flex items-center justify-between mb-5 pb-2 border-b border-slate-100/80 dark:border-slate-700/80">
                              <span className="text-[11px] font-black text-blue-600 dark:!text-white tracking-wider font-bold">
                                {formatKbmDate(dateKey)}
                              </span>
                              {getKbmDateBadge(dateKey)}
                            </div>
                            <div className="space-y-3">
                              {sForDay.map((item, idx) => (
                                <div key={idx} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-2xl flex flex-col gap-3 shadow-3xs hover:shadow-2xs transition duration-150">
                                  <div className="flex items-center justify-between">
                                    <div className="bg-slate-100/80 dark:bg-slate-700 text-slate-700 dark:text-slate-100 text-[10px] font-black px-3 py-1.5 rounded-full tracking-wider uppercase border border-slate-200/60 dark:border-slate-600">
                                      {item.kelas || currentStudent?.kelompok_kelas || 'KELAS'}
                                    </div>
                                    <span className="text-[11px] text-slate-400 font-bold">
                                      {item.time_start} - {item.time_end}
                                    </span>
                                  </div>
                                  <h5 className="text-[13px] font-black text-slate-800 dark:text-slate-200 leading-snug uppercase break-words">
                                    {item.subject}
                                  </h5>
                                  <div className="flex items-center justify-end pt-2.5 border-t border-slate-100 mt-1">
                                    <button
                                      onClick={() => handleOpenLeaveModal({
                                        subject: item.subject,
                                        date: item.tanggal,
                                        time: `${item.time_start} - ${item.time_end}`,
                                        teacher: item.teacher,
                                        kelas: item.kelas || currentStudent?.kelompok_kelas
                                      })}
                                      className="text-[10px] font-extrabold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200/80 transition flex items-center gap-1 shrink-0 cursor-pointer"
                                    >
                                      <FileText className="h-3 w-3 text-amber-600" />
                                      Form Izin/Sakit
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* TAB 3: JADWAL KBM TAMBAHAN */}
          {activeTab === 'kbm-tambahan' && (
            <div id="view-kbm-tambahan" className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-6">
                {/* BRANDED HEADER */}
                <div className="grid grid-cols-3 gap-4 border-b border-slate-100 pb-5 mb-6">
                  <div>
                    <span className="text-[11px] font-extrabold text-slate-400 tracking-widest uppercase block mb-1">CABANG</span>
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 leading-tight truncate">{(selectedStudentData || currentStudent)?.cabang || '-'}</h3>
                  </div>
                  <div>
                    <span className="text-[11px] font-extrabold text-slate-400 tracking-widest uppercase block mb-1">SEKOLAH</span>
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 leading-tight truncate">{(selectedStudentData || currentStudent)?.asal_sekolah || '-'}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-extrabold text-slate-400 tracking-widest uppercase block mb-1 text-right">JENJANG</span>
                    <h3 className="text-sm font-black text-indigo-600 leading-tight truncate">{(selectedStudentData || currentStudent)?.jenjang_studi || '-'}</h3>
                  </div>
                </div>

                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Jadwal KBM Tambahan</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Kelas bimbingan diluar jam KBM, pembinaan khusus, dan persiapan Tes</p>
                  </div>
                  <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-full border border-indigo-100 flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Opsional/Khusus
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {additionalSchedules.filter(item => isThisOrNextMonth(item.tanggal)).map((item, idx) => (
                    <div key={idx} className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 flex items-start gap-4">
                      <div className="bg-indigo-100/50 text-indigo-700 p-3 rounded-2xl shrink-0">
                        <GraduationCap className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="bg-indigo-50 text-indigo-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-100">
                            Hari {item.day}
                          </span>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                            item.status === 'Aktif' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-600 dark:text-slate-300'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-2">{item.subject}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Pembina: {item.teacher}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Kelas: {item.kelas || '-'}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Tanggal: {item.tanggal ? formatTanggalIndo(item.tanggal, { withDayName: true }) : '-'}</p>
                        
                        <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between gap-2">
                          <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 font-bold">
                            <Clock className="h-4 w-4 text-sky-600 mr-1.5 shrink-0" />
                            {item.time_start} - {item.time_end} WIB
                          </div>
                          <button
                            onClick={() => handleOpenLeaveModal({
                              subject: item.subject,
                              date: item.tanggal,
                              time: `${item.time_start} - ${item.time_end}`,
                              teacher: item.teacher,
                              kelas: item.kelas
                            })}
                            className="text-[10px] font-extrabold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200/80 transition flex items-center gap-1 shrink-0"
                          >
                            <FileText className="h-3 w-3 text-amber-600" />
                            Form Izin/Sakit
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {additionalSchedules.filter(item => isThisOrNextMonth(item.tanggal)).length === 0 && (
                    <div className="col-span-full py-12 text-center">
                      <AlertCircle className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-500 dark:text-slate-400">Siswa tidak memiliki jadwal kelas tambahan atau ekstrakurikuler terdaftar untuk bulan ini dan bulan depan.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: RIWAYAT PRESENSI */}
          {activeTab === 'presensi' && (
            <div id="view-presensi" className="space-y-6">
              
              {/* Presensi stats widgets */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Hadir</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-black text-emerald-600">{attendanceStats.hadir}</span>
                    <span className="text-xs text-slate-400">hari</span>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Sakit</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-black text-blue-600">{attendanceStats.sakit}</span>
                    <span className="text-xs text-slate-400">hari</span>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Izin</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-black text-amber-500">{attendanceStats.izin}</span>
                    <span className="text-xs text-slate-400">hari</span>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Alpa</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-black text-rose-500">{attendanceStats.alpa}</span>
                    <span className="text-xs text-slate-400">hari</span>
                  </div>
                </div>
              </div>

              {/* Records Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Tren Kehadiran</h4>
                  <button
                    onClick={() => setShowChartPresensi(!showChartPresensi)}
                    className="text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 px-3 py-1 rounded-full transition"
                  >
                    {showChartPresensi ? 'Sembunyikan Grafik' : 'Tampilkan Grafik'}
                  </button>
                </div>
                {showChartPresensi && (
                  <AttendancePieChart data={attendanceRecords} />
                )}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Log Presensi Detail</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Daftar kehadiran siswa di kelas secara real-time</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 uppercase font-black tracking-wider text-[10px]">
                        <th className="py-3 px-4">Tanggal</th>
                        <th className="py-3 px-4">Mata Pelajaran</th>
                        <th className="py-3 px-4">Status Kehadiran</th>
                        <th className="py-3 px-4">Catatan Guru</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {attendanceRecords.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition duration-150">
                          <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">{formatTanggalIndo(item.date, { withDayName: true })}</td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{item.subject || 'Seluruh Kelas'}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                              item.status === 'Hadir' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : item.status === 'Sakit'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : item.status === 'Izin'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 italic">"{item.notes || '-'}"</td>
                        </tr>
                      ))}
                      {attendanceRecords.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-12 text-center text-slate-500 dark:text-slate-400 italic">Belum ada riwayat kehadiran terdaftar.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: RIWAYAT PERKEMBANGAN BELAJAR */}
          {activeTab === 'perkembangan' && (
            <div id="view-perkembangan" className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Laporan Perkembangan Kompetensi Belajar</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Evaluasi deskriptif kemampuan akademik dan kompetensi sub-materi</p>
                  </div>
                  <button
                    onClick={() => setShowChartPerkembangan(!showChartPerkembangan)}
                    className="text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 px-3 py-1 rounded-full transition"
                  >
                    {showChartPerkembangan ? 'Sembunyikan Grafik' : 'Tampilkan Grafik'}
                  </button>
                </div>
                {showChartPerkembangan && (
                  <div className="mb-6">
                  <PerkembanganProgress 
                    data={learningProgress}
                  />
                  </div>
                )}
                <div className="relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200 space-y-6">
                  {learningProgress.map((item, idx) => (
                    <div key={idx} className="relative pl-8">
                      {/* Timeline dot */}
                      <span className={`absolute left-2.5 top-2 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${
                        item.status === 'Sangat Baik' ? 'bg-emerald-500' : item.status === 'Baik' ? 'bg-sky-500' : 'bg-amber-400'
                      }`}></span>
                      
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 hover:shadow-xs transition duration-150">
                        <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
                          <div className="flex items-center gap-2">
                            <span className="bg-sky-100 text-sky-800 text-[10px] font-black uppercase px-2.5 py-1 rounded-md">
                              {item.subject}
                            </span>
                            <span className="text-xs text-slate-400 font-bold">{formatTanggalIndo(item.date, { withDayName: true })}</span>
                          </div>

                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-md border ${
                            item.status === 'Sangat Baik' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : item.status === 'Baik'
                              ? 'bg-sky-50 text-sky-700 border-sky-200'
                              : item.status === 'Cukup'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            Evaluasi: {item.status}
                          </span>
                        </div>

                        <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{item.progress_title}</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-2 p-3 bg-white rounded-xl border border-slate-200/50 italic">
                          "{item.notes}"
                        </p>
                      </div>
                    </div>
                  ))}
                  {learningProgress.length === 0 && (
                    <div className="py-12 text-center text-slate-500 dark:text-slate-400 italic">Belum ada catatan perkembangan belajar.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: UJI MATERI */}
          {activeTab === 'uji-materi' && (
            <UjiMateriView currentStudent={currentStudent} />
          )}

          {/* TAB 6: RIWAYAT NILAI-NILAI */}
          {activeTab === 'nilai' && (
            <div id="view-nilai" className="space-y-6">
              
              {/* Grade Highlights */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <div className="bg-white p-3 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm text-center flex flex-col justify-center">
                  <span className="text-[9px] sm:text-xs font-bold text-slate-400 uppercase leading-tight line-clamp-1">Rata-rata</span>
                  <h3 className="text-xl sm:text-3xl font-black text-sky-600 mt-0.5 sm:mt-1">{gradeStats.average || 0}</h3>
                  <p className="hidden sm:block text-[10px] text-slate-400 mt-1">Berdasarkan {gradeStats.total} entri nilai regular</p>
                </div>
                <div className="bg-white p-3 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm text-center flex flex-col justify-center">
                  <span className="text-[9px] sm:text-xs font-bold text-slate-400 uppercase leading-tight line-clamp-1">Tertinggi</span>
                  <h3 className="text-xl sm:text-3xl font-black text-emerald-600 mt-0.5 sm:mt-1">{gradeStats.highest || 0}</h3>
                  <p className="hidden sm:block text-[10px] text-slate-400 mt-1">Sangat memuaskan</p>
                </div>
                <div className="bg-white p-3 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm text-center flex flex-col justify-center">
                  <span className="text-[9px] sm:text-xs font-bold text-slate-400 uppercase leading-tight line-clamp-1">Terendah</span>
                  <h3 className="text-xl sm:text-3xl font-black text-amber-500 mt-0.5 sm:mt-1">{gradeStats.lowest || 0}</h3>
                  <p className="hidden sm:block text-[10px] text-slate-400 mt-1">Standar KKM: 75</p>
                </div>
              </div>

              {/* Navigation Sub-Tabs for Grades Category */}
              <div className="bg-slate-100 p-1.5 rounded-2xl flex flex-wrap gap-1 max-w-2xl">
                <button
                  id="btn-subtab-evaluasi"
                  onClick={() => setGradeSubTab('evaluasi')}
                  className={`flex-1 py-2 px-4 text-xs font-extrabold rounded-xl transition duration-150 ${
                    gradeSubTab === 'evaluasi'
                      ? 'bg-white text-sky-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-100 hover:bg-slate-50'
                  }`}
                >
                  Evaluasi Belajar (Harian)
                </button>
                <button
                  id="btn-subtab-standar"
                  onClick={() => setGradeSubTab('standar')}
                  className={`flex-1 py-2 px-4 text-xs font-extrabold rounded-xl transition duration-150 ${
                    gradeSubTab === 'standar'
                      ? 'bg-white text-sky-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-100 hover:bg-slate-50'
                  }`}
                >
                  Nilai Standar / Rapor
                </button>
                {['1 SMA', '2 SMA', '3 SMA'].includes(currentStudent?.jenjang_studi || '') && (
                  <button
                    id="btn-subtab-snbt"
                    onClick={() => setGradeSubTab('snbt')}
                    className={`flex-1 py-2 px-4 text-xs font-extrabold rounded-xl transition duration-150 ${
                      gradeSubTab === 'snbt'
                        ? 'bg-white text-sky-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    Simulasi UTBK / SNBT
                  </button>
                )}
              </div>

              {/* Sub-Tab 1: Nilai Evaluasi */}
              {gradeSubTab === 'evaluasi' && (
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-2">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Nilai Evaluasi Belajar (Sub-Bab)</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Nilai harian siswa berdasarkan materi pelajaran yang ditekuni</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Tren Nilai</h4>
                      <button
                        onClick={() => setShowChartNilai(!showChartNilai)}
                        className="text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 px-3 py-1 rounded-full transition"
                      >
                        {showChartNilai ? 'Sembunyikan Grafik' : 'Tampilkan Grafik'}
                      </button>
                    </div>
                    {showChartNilai && <SubjectBarChart data={nilaiEvaluasi} title="Rata-rata Nilai per Mata Pelajaran" xKey="mata_pelajaran" yKey="nilai" />}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {nilaiEvaluasi.map((item, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl hover:shadow-xs transition duration-150 flex justify-between items-start">
                        <div className="space-y-1">
                          <span className="text-[10px] bg-slate-200/60 text-slate-500 dark:text-slate-400 font-bold px-2 py-0.5 rounded-md">{formatTanggalIndo(item.tanggal)}</span>
                          <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 mt-1">{item.mata_pelajaran}</h4>
                          <p className="text-xs text-slate-500">Materi: <strong className="font-semibold text-slate-700 dark:text-slate-300">{item.sub_bab_kode_soal || 'Evaluasi'}</strong></p>
                        </div>
                        <div className="text-right">
                          <span className={`text-lg font-black px-3 py-1.5 rounded-xl block ${
                            item.nilai >= 90 ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-sky-50 text-sky-600 border border-sky-200'
                          }`}>
                            {item.nilai}
                          </span>
                        </div>
                      </div>
                    ))}
                    {nilaiEvaluasi.length === 0 && (
                      <div className="col-span-2 py-12 text-center text-slate-500 dark:text-slate-400 italic">Belum ada data nilai evaluasi belajar terdaftar.</div>
                    )}
                  </div>
                </div>
              )}

              {/* Sub-Tab 2: Nilai Standar / Rapor */}
              {gradeSubTab === 'standar' && (
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-2">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Nilai Standar</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Rekapitulasi ujian terstruktur (PTS, PAS, PAT) secara berkala</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Tren Nilai</h4>
                      <button
                        onClick={() => setShowChartNilai(!showChartNilai)}
                        className="text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 px-3 py-1 rounded-full transition"
                      >
                        {showChartNilai ? 'Sembunyikan Grafik' : 'Tampilkan Grafik'}
                      </button>
                    </div>
                    {showChartNilai && <SubjectBarChart data={nilaiStandar} title="Rata-rata Nilai per Mata Pelajaran" xKey="mata_pelajaran" yKey="nilai" />}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-xs font-black uppercase text-slate-400 tracking-wider">
                          <th className="py-3 px-4">Tanggal</th>
                          <th className="py-3 px-4">Mata Pelajaran</th>
                          <th className="py-3 px-4">Jenis Evaluasi</th>
                          <th className="py-3 px-4 text-right">Nilai</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs text-slate-600 dark:text-slate-300 font-bold">
                        {nilaiStandar.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition">
                            <td className="py-3.5 px-4">{formatTanggalIndo(item.tanggal)}</td>
                            <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200">{item.mata_pelajaran}</td>
                            <td className="py-3.5 px-4">
                              <span className="bg-amber-50 text-amber-800 border border-amber-100 px-2 py-0.5 rounded-md">
                                {item.jenis_tes}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right text-sm font-black text-slate-900 dark:text-slate-100">{item.nilai}</td>
                          </tr>
                        ))}
                        {nilaiStandar.length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-12 text-center text-slate-500 dark:text-slate-400 italic">Belum ada data nilai standar / rapor terdaftar.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sub-Tab 3: Nilai UTBK SNBT */}
              {gradeSubTab === 'snbt' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Tren Nilai</h4>
                      <button
                        onClick={() => setShowChartNilai(!showChartNilai)}
                        className="text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 px-3 py-1 rounded-full transition"
                      >
                        {showChartNilai ? 'Sembunyikan Grafik' : 'Tampilkan Grafik'}
                      </button>
                    </div>
                    {showChartNilai && <SubjectBarChart data={nilaiSnbtUtbk.map(r => ({ mata_pelajaran: r.jenis_tes, nilai: r.rerata }))} title="Rata-rata Nilai per Jenis Tes" xKey="mata_pelajaran" yKey="nilai" />}
                  </div>

                  {nilaiSnbtUtbk.map((item, idx) => (
                    <div key={idx} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-6 space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-black uppercase px-2.5 py-1 rounded-md">
                              SNBT - UTBK
                            </span>
                            <span className="text-xs text-slate-400 font-extrabold">{formatTanggalIndo(item.tanggal)}</span>
                          </div>
                          <h3 className="text-base font-black text-slate-900 dark:text-slate-100 mt-1.5">{item.jenis_tes}</h3>
                        </div>

                        {/* Overall Big Scores */}
                        <div className="flex items-center gap-4">
                          <div className="text-center bg-sky-50 border border-sky-100 p-3 rounded-xl min-w-[90px]">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Rata-rata</span>
                            <div className="text-lg font-black text-sky-700">{item.rerata}</div>
                          </div>
                          <div className="text-center bg-emerald-50 border border-emerald-100 p-3 rounded-xl min-w-[90px]">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Skor Total</span>
                            <div className="text-lg font-black text-emerald-700">{item.total}</div>
                          </div>
                        </div>
                      </div>

                      {/* UTBK Subtests Breakdown */}
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4">Rincian Sub-Tes Potensi & Literasi</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                            <div className="text-[10px] font-extrabold text-slate-400 uppercase" title="Penalaran Umum">PU</div>
                            <div className="text-base font-black text-slate-800 dark:text-slate-200 mt-1">{item.pu || 0}</div>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                            <div className="text-[10px] font-extrabold text-slate-400 uppercase" title="Pengetahuan & Pemahaman Umum">PPU</div>
                            <div className="text-base font-black text-slate-800 dark:text-slate-200 mt-1">{item.ppu || 0}</div>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                            <div className="text-[10px] font-extrabold text-slate-400 uppercase" title="Pemahaman Bacaan & Menulis">PBM</div>
                            <div className="text-base font-black text-slate-800 dark:text-slate-200 mt-1">{item.pbm || 0}</div>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                            <div className="text-[10px] font-extrabold text-slate-400 uppercase" title="Pengetahuan Kuantitatif">PK</div>
                            <div className="text-base font-black text-slate-800 dark:text-slate-200 mt-1">{item.pk || 0}</div>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                            <div className="text-[10px] font-extrabold text-slate-400 uppercase" title="Literasi Bahasa Indonesia">L-Ind</div>
                            <div className="text-base font-black text-slate-800 dark:text-slate-200 mt-1">{item.lib || 0}</div>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                            <div className="text-[10px] font-extrabold text-slate-400 uppercase" title="Literasi Bahasa Inggris">L-Ing</div>
                            <div className="text-base font-black text-slate-800 dark:text-slate-200 mt-1">{item.ling || 0}</div>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                            <div className="text-[10px] font-extrabold text-slate-400 uppercase" title="Penalaran Matematika">PM</div>
                            <div className="text-base font-black text-slate-800 dark:text-slate-200 mt-1">{item.pm || 0}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Empty state & Simulation button */}
                  <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium text-center sm:text-left">Lacak perkembangan kesiapan SNBT & UTBK siswa secara terukur dengan simulasi Try Out berkala.</p>
                  </div>

                  {nilaiSnbtUtbk.length === 0 && (
                    <div className="bg-white border border-slate-100 rounded-2xl py-12 text-center text-slate-500 dark:text-slate-400 italic">Belum ada riwayat hasil simulasi UTBK terdaftar.</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 7: LAYANAN DI LUAR KBM */}
          {activeTab === 'luar-kbm' && (
            <div id="view-luar-kbm" className="space-y-6">
              {/* Header Action Banner */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Layanan Tambahan & Konsultasi</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Reservasi jadwal bimbingan, konseling kepribadian, pembinaan karakter, atau presensi layanan luar KBM
                  </p>
                </div>
                <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap sm:flex-nowrap">
                  <button
                    onClick={() => setIsBookingModalOpen(true)}
                    className="flex-1 sm:flex-none text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <CalendarDays className="h-4 w-4" />
                    + Reservasi Jadwal
                  </button>
                  <button
                    onClick={() => setIsOutsideServiceModalOpen(true)}
                    className="flex-1 sm:flex-none text-xs font-extrabold bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <HeartHandshake className="h-4 w-4" />
                    + Presensi Layanan
                  </button>
                </div>
              </div>

              {/* Section 1: Status Booking / Permintaan Layanan */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-indigo-600" />
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Status Permintaan & Reservasi Layanan</h4>
                  </div>
                  <span className="text-xs font-bold text-slate-400">
                    {permintaanPelayanan.length} Permintaan
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {permintaanPelayanan.map((item, idx) => {
                    const statusStr = (item.status || 'Menunggu').toLowerCase();
                    const isApproved = statusStr.includes('setuju') || statusStr.includes('acc');
                    const isRejected = statusStr.includes('tolak') || statusStr.includes('batal');
                    const bookingDate = item.tanggal_pengajuan || item.tanggal || '';
                    const bookingTeacher = item.nama_pengajar || item.pengajar || 'Pengajar';

                    return (
                      <div key={idx} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-start justify-between gap-3 hover:shadow-xs transition">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="bg-indigo-50 text-indigo-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md border border-indigo-100">
                              {item.mata_pelajaran}
                            </span>
                            <span className="text-xs text-slate-400 font-bold">Rencana: {bookingDate ? formatTanggalIndo(bookingDate, { withDayName: true }) : '-'}</span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                            {item.keperluan || 'Pengajuan Jadwal Layanan'}
                          </p>
                          <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400">
                            <span>Pengajar Diharapkan: <strong className="text-slate-700 dark:text-slate-300">{bookingTeacher}</strong></span>
                            {item.cabang && <span>• Cabang: <strong className="text-slate-700 dark:text-slate-300">{item.cabang}</strong></span>}
                          </div>

                          {(item.tanggal_disetujui || item.jam_disetujui) && (
                            <div className="mt-1 p-2 bg-emerald-50/70 border border-emerald-100 rounded-xl text-[11px] text-emerald-800 font-bold flex items-center gap-2">
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                              <span>
                                Disetujui untuk tanggal <strong>{formatTanggalIndo(item.tanggal_disetujui || bookingDate || item.tanggal || '', { withDayName: true })}</strong> {item.jam_disetujui && `jam ${item.jam_disetujui}`}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          {isApproved ? (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black px-3 py-1.5 rounded-full inline-flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Disetujui
                            </span>
                          ) : isRejected ? (
                            <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-black px-3 py-1.5 rounded-full">
                              Ditolak
                            </span>
                          ) : (
                            <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black px-3 py-1.5 rounded-full inline-flex items-center gap-1">
                              <Clock className="h-3 w-3 animate-spin" />
                              Menunggu Approval
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {permintaanPelayanan.length === 0 && (
                    <div className="py-8 text-center text-slate-400 text-xs italic">
                      Belum ada permintaan / reservasi jadwal layanan yang diajukan.
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Riwayat Layanan Terlaksana */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Riwayat Layanan di Luar KBM (Terlaksana)</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Layanan konseling kepribadian, pembinaan karakter, konsultasi karir, and bimbingan minat bakat tambahan</p>
                  </div>
                  <button
                    onClick={() => setShowChartLuarKbm(!showChartLuarKbm)}
                    className="text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 px-3 py-1 rounded-full transition cursor-pointer"
                  >
                    {showChartLuarKbm ? 'Sembunyikan Grafik' : 'Tampilkan Grafik'}
                  </button>
                </div>
                {showChartLuarKbm && (
                  <div className="mb-6 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                  <ServicePieChart 
                    data={outsideServices}
                  />
                  </div>
                )}
                <div className="grid grid-cols-1 gap-4">
                  {outsideServices.map((item, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:shadow-xs transition">
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="bg-emerald-50 text-emerald-800 text-[10px] font-black uppercase px-2.5 py-1 rounded-md border border-emerald-100">
                            {item.mata_pelajaran}
                          </span>
                          <span className="text-xs text-slate-400 font-bold">{formatTanggalIndo(item.tanggal, { withDayName: true })}</span>
                          {item.durasi && (
                            <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-2.5 py-1 rounded-md border border-indigo-100">
                              Durasi: {item.durasi}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                          "{item.materi_sub_bab}"
                        </p>
                        <div className="flex items-center gap-4 text-[11px] font-bold text-slate-400">
                          <span>Pengajar/Petugas: <strong className="text-slate-700 dark:text-slate-300">{item.pengajar}</strong></span>
                          {item.cabang && <span>• Cabang: <strong className="text-slate-700 dark:text-slate-300">{item.cabang}</strong></span>}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="bg-sky-50 text-sky-700 text-[10px] font-black px-3 py-1.5 rounded-full border border-sky-100">
                          Terlaksana
                        </span>
                      </div>
                    </div>
                  ))}
                  {outsideServices.length === 0 && (
                    <div className="py-12 text-center text-slate-500 dark:text-slate-400 italic">Belum ada riwayat pelayanan luar KBM.</div>
                  )}
                </div>
              </div>
            </div>
          )}


          {/* TAB 8: ANALISA */}
          {activeTab === 'analisa' && (
            <div id="view-analisa" className="space-y-6">
              <AnalisaView 
                attendanceRecords={attendanceRecords}
                learningProgress={learningProgress}
                nilaiEvaluasi={nilaiEvaluasi}
                outsideServices={outsideServices}
              />
            </div>
          )}

        </section>
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav id="mobile-bottom-nav" className="md:hidden sticky bottom-0 bg-white/90 border-t border-slate-200/80 pt-2 pb-6 px-2 flex justify-around items-center z-40 backdrop-blur-xl shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        <button 
          id="btn-bottom-nav-overview"
          onClick={() => setActiveTab('overview')} 
          className={`flex flex-col items-center p-2 transition-colors rounded-xl ${activeTab === 'overview' ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600 dark:text-slate-300'}`}
        >
          <BookOpen className={`h-6 w-6 ${activeTab === 'overview' ? 'fill-sky-100' : ''}`} />
          <span className="text-[10px] font-bold mt-1 tracking-wide">Dashboard</span>
        </button>

        <button 
          id="btn-bottom-nav-kbm"
          onClick={() => setActiveTab('kbm-reguler')} 
          className={`flex flex-col items-center p-2 transition-colors rounded-xl ${activeTab === 'kbm-reguler' || activeTab === 'kbm-tambahan' ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600 dark:text-slate-300'}`}
        >
          <Calendar className={`h-6 w-6 ${activeTab === 'kbm-reguler' || activeTab === 'kbm-tambahan' ? 'fill-sky-100' : ''}`} />
          <span className="text-[10px] font-bold mt-1 tracking-wide">Jadwal</span>
        </button>

        <button 
          id="btn-bottom-nav-presensi"
          onClick={() => setActiveTab('presensi')} 
          className={`flex flex-col items-center p-2 transition-colors rounded-xl ${activeTab === 'presensi' ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600 dark:text-slate-300'}`}
        >
          <ClipboardList className={`h-6 w-6 ${activeTab === 'presensi' ? 'fill-sky-100' : ''}`} />
          <span className="text-[10px] font-bold mt-1 tracking-wide">Presensi</span>
        </button>

        <button 
          id="btn-bottom-nav-nilai"
          onClick={() => setActiveTab('nilai')} 
          className={`flex flex-col items-center p-2 transition-colors rounded-xl ${activeTab === 'nilai' || activeTab === 'perkembangan' ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600 dark:text-slate-300'}`}
        >
          <Award className={`h-6 w-6 ${activeTab === 'nilai' || activeTab === 'perkembangan' ? 'fill-sky-100' : ''}`} />
          <span className="text-[10px] font-bold mt-1 tracking-wide">Nilai</span>
        </button>

        <button 
          id="btn-bottom-nav-menu"
          onClick={() => setIsMobileGridMenuOpen(true)} 
          className="flex flex-col items-center p-2 text-slate-400 hover:text-slate-600 dark:text-slate-300 transition-colors rounded-xl"
        >
          <Menu className="h-6 w-6" />
          <span className="text-[10px] font-bold mt-1 tracking-wide">Lainnya</span>
        </button>
      </nav>

      {/* MOBILE GRID MENU OVERLAY */}
      {isMobileGridMenuOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm md:hidden animate-in fade-in flex items-end"
          onClick={() => setIsMobileGridMenuOpen(false)}
        >
          <div 
            className="bg-white w-full rounded-t-3xl p-6 pb-12 animate-in slide-in-from-bottom-full border-t border-slate-200 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-200">Menu Navigasi</h3>
              <button 
                onClick={() => setIsMobileGridMenuOpen(false)}
                className="p-2 bg-slate-100 rounded-full text-slate-500 hover:text-slate-800 dark:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              {[
                { id: 'overview', icon: BookOpen, label: 'Dashboard', color: 'bg-sky-50 text-sky-600 border-sky-100' },
                { id: 'kbm-reguler', icon: Calendar, label: 'Reguler', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
                { id: 'kbm-tambahan', icon: Clock, label: 'Tambahan', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
                { id: 'presensi', icon: ClipboardList, label: 'Presensi', color: 'bg-amber-50 text-amber-600 border-amber-100' },
                { id: 'perkembangan', icon: BookMarked, label: 'Perkembangan', color: 'bg-purple-50 text-purple-600 border-purple-100' },
                { id: 'uji-materi', icon: FileText, label: 'Uji Materi', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
                { id: 'nilai', icon: Award, label: 'Nilai Rapor', color: 'bg-rose-50 text-rose-600 border-rose-100' },
                { id: 'luar-kbm', icon: HeartHandshake, label: 'Layanan Luar KBM', color: 'bg-teal-50 text-teal-600 border-teal-100' },
                { id: 'analisa', icon: Search, label: 'Analisa', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id as any); setIsMobileGridMenuOpen(false); }}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className={`p-4 rounded-2xl ${item.color} shadow-sm border group-active:scale-95 transition-transform w-full flex justify-center items-center`}>
                    <item.icon className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 text-center leading-tight line-clamp-2">{item.label}</span>
                </button>
              ))}
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

    </div>
  );
}
