import React, { useState, useMemo, useEffect } from 'react';
import { formatTanggalIndo } from '../lib/dateUtils';
import { 
  X, 
  Bell, 
  CheckCheck, 
  Trash2, 
  CalendarDays, 
  Clock, 
  TrendingUp, 
  HeartHandshake, 
  ChevronRight,
  UserCheck,
  Award,
  BookOpenCheck,
  Smartphone,
  ShieldCheck,
  Sparkles,
  Copy,
  Check,
  BellOff,
  RefreshCw,
  RotateCcw,
  Info
} from 'lucide-react';
import { 
  getNotificationPermissionState, 
  requestNotificationPermission, 
  sendWebPushNotification,
  syncOneSignalUser
} from '../lib/pushNotifications';
import { 
  DataSiswa, 
  RegularSchedule, 
  AdditionalSchedule, 
  PermintaanPelayanan, 
  LearningProgress, 
  NilaiEvaluasi, 
  OutsideService,
  Attendance,
  Grade,
  NilaiStandar,
  NilaiSnbtUtbk
} from '../types';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  category: 'jadwal' | 'presensi' | 'reservasi' | 'evaluasi' | 'sistem';
  isRead: boolean;
  priority?: 'high' | 'normal' | 'low';
  targetView?: string;
  meta?: {
    subject?: string;
    date?: string;
    status?: string;
    score?: number;
  };
}

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: DataSiswa | null;
  kbmSchedules?: (RegularSchedule | AdditionalSchedule)[];
  bookingReservations?: PermintaanPelayanan[];
  learningProgress?: LearningProgress[];
  nilaiEvaluasi?: NilaiEvaluasi[];
  outsideServices?: OutsideService[];
  attendanceRecords?: Attendance[];
  grades?: Grade[];
  nilaiStandar?: NilaiStandar[];
  nilaiSnbtUtbk?: NilaiSnbtUtbk[];
  onNavigateView?: (viewName: string) => void;
  onUnreadCountChange?: (count: number) => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  student,
  kbmSchedules = [],
  bookingReservations = [],
  learningProgress = [],
  nilaiEvaluasi = [],
  outsideServices = [],
  attendanceRecords = [],
  grades = [],
  nilaiStandar = [],
  nilaiSnbtUtbk = [],
  onNavigateView,
  onUnreadCountChange,
}) => {
  const [activeTab, setActiveTab] = useState<'semua' | 'jadwal' | 'presensi' | 'reservasi' | 'evaluasi'>('semua');
  
  // Persistent read and deleted IDs
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('rapor_read_notif_ids');
        if (saved) return new Set(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
    return new Set(['notif-sys-welcome']);
  });

  const [deletedIds, setDeletedIds] = useState<Set<string>>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('rapor_deleted_notif_ids');
        if (saved) return new Set(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
    return new Set();
  });

  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const [copiedToken, setCopiedToken] = useState<boolean>(false);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('rapor_read_notif_ids', JSON.stringify(Array.from(readIds)));
      }
    } catch (e) {
      console.error(e);
    }
  }, [readIds]);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('rapor_deleted_notif_ids', JSON.stringify(Array.from(deletedIds)));
      }
    } catch (e) {
      console.error(e);
    }
  }, [deletedIds]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const state = getNotificationPermissionState();
      setPushPermission(state);
      if (state === 'granted' && student?.nis) {
        syncOneSignalUser(student.nis);
      }
    }
  }, [isOpen, student?.nis]);

  const handleEnablePush = async () => {
    const { permission } = await requestNotificationPermission(student?.nis);
    setPushPermission(permission);
    if (permission === 'granted') {
      await sendWebPushNotification('OneSignal Web Push Terhubung! 🎉', {
        body: `Aplikasi terhubung dengan OneSignal Web Push. NIS: ${student?.nis || 'Siswa'}.`,
        tag: 'welcome-onesignal'
      });
    }
  };

  const handleCopyNisId = () => {
    const targetText = student?.nis || 'f7a12012-b192-4c27-a7bb-d6ffeb570fb4';
    navigator.clipboard.writeText(targetText);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleDisableOneSignal = async () => {
    if (confirm('Apakah Anda yakin ingin menonaktifkan Notifikasi OneSignal untuk perangkat ini?')) {
      await sendWebPushNotification('Notifikasi OneSignal Dinonaktifkan', {
        body: 'Notifikasi push perangkat ini telah dinonaktifkan.',
        tag: 'disable-onesignal'
      });
    }
  };

  const handleRefreshToken = async () => {
    if (student?.nis) {
      await syncOneSignalUser(student.nis);
    }
    await sendWebPushNotification('OneSignal Diperbarui 🎉', {
      body: `Status OneSignal & NIS ${student?.nis || ''} berhasil diperbarui.`,
      tag: 'refresh-onesignal'
    });
  };

  // Dynamically generate notifications based on current student data
  const notifications = useMemo<AppNotification[]>(() => {
    const list: AppNotification[] = [];
    const todayStr = new Date().toISOString().split('T')[0];
    const daysIndo = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const todayDayName = daysIndo[new Date().getDay()];

    // 1. Jadwal Hari Ini
    const todaySchedules = kbmSchedules.filter(s => {
      if (s.tanggal) return s.tanggal === todayStr;
      if (s.day) return s.day.toLowerCase() === todayDayName.toLowerCase();
      return false;
    });

    if (todaySchedules.length > 0) {
      todaySchedules.forEach((s, idx) => {
        list.push({
          id: `sched-today-${s.id || idx}`,
          title: `Jadwal Hari Ini: ${s.subject}`,
          message: `Sesi KBM jam ${s.time_start || '14:00'} - ${s.time_end || '15:30'}${s.teacher ? ` bersama Pengajar ${s.teacher}` : ''}. Persiapkan materi belajar Anda.`,
          timestamp: 'Hari Ini',
          category: 'jadwal',
          priority: 'high',
          isRead: false,
          targetView: 'kbm',
          meta: { subject: s.subject, status: 'Aktif' }
        });
      });
    } else {
      list.push({
        id: 'sched-info-general',
        title: 'Pengingat Jadwal KBM',
        message: 'Periksa selalu jadwal pelajaran mingguan Anda pada tab KBM Reguler untuk melihat ruang kelas dan tentor pendamping.',
        timestamp: 'Hari Ini',
        category: 'jadwal',
        priority: 'normal',
        isRead: false,
        targetView: 'kbm'
      });
    }

    // 2. Presensi Terbaru (Attendance Records)
    if (attendanceRecords.length > 0) {
      const recentAttendance = [...attendanceRecords].reverse().slice(0, 5);
      recentAttendance.forEach((att) => {
        const isAbsent = att.status === 'Sakit' || att.status === 'Izin' || att.status === 'Alpa';
        const formattedDate = formatTanggalIndo(att.date, { withDayName: true });
        list.push({
          id: `att-rec-${att.id}`,
          title: `Presensi KBM: ${att.subject || 'Sesi Pelajaran'}`,
          message: `Status presensi pada tanggal ${formattedDate}: ${att.status.toUpperCase()}.${att.notes ? ` Catatan: ${att.notes}` : ''}`,
          timestamp: formattedDate || 'Terbaru',
          category: 'presensi',
          priority: isAbsent ? 'high' : 'normal',
          isRead: false,
          targetView: 'overview',
          meta: { subject: att.subject, date: att.date, status: att.status }
        });
      });
    }

    // 3. Presensi Layanan Luar KBM (Outside Services)
    if (outsideServices.length > 0) {
      const recentServices = [...outsideServices].reverse().slice(0, 3);
      recentServices.forEach((serv) => {
        const formattedDate = formatTanggalIndo(serv.tanggal, { withDayName: true });
        list.push({
          id: `outside-${serv.id}`,
          title: `Presensi Layanan Luar KBM`,
          message: `Layanan ${serv.mata_pelajaran || 'Bimbingan/Konsultasi'} pada ${formattedDate} bersama Pengajar ${serv.pengajar || 'Tentor'} telah terekam.`,
          timestamp: formattedDate || 'Terbaru',
          category: 'presensi',
          priority: 'normal',
          isRead: false,
          targetView: 'overview',
          meta: { subject: serv.mata_pelajaran, date: serv.tanggal }
        });
      });
    }

    // 4. Reservasi Jadwal Layanan (PermintaanPelayanan)
    if (bookingReservations.length > 0) {
      bookingReservations.forEach((booking) => {
        const isApproved = booking.status?.toLowerCase() === 'disetujui' || booking.status?.toLowerCase() === 'approved';
        const isRejected = booking.status?.toLowerCase() === 'ditolak';
        const formattedDate = formatTanggalIndo(booking.tanggal, { withDayName: true });

        list.push({
          id: `booking-${booking.id}`,
          title: isApproved 
            ? `Reservasi Layanan Disetujui 🎉` 
            : isRejected 
            ? `Reservasi Layanan Belum Disetujui` 
            : `Reservasi Layanan Menunggu Approval`,
          message: isApproved
            ? `Pengajuan konsultasi ${booking.mata_pelajaran} tanggal ${formattedDate} bersama Tentor ${booking.pengajar} telah DISETUJUI.`
            : `Pengajuan layanan ${booking.mata_pelajaran} tanggal ${formattedDate} sedang diproses oleh Tim Cabang.`,
          timestamp: formattedDate || 'Baru Saja',
          category: 'reservasi',
          priority: isApproved ? 'high' : 'normal',
          isRead: false,
          targetView: 'overview',
          meta: { subject: booking.mata_pelajaran, date: booking.tanggal, status: booking.status }
        });
      });
    }

    // 5. Nilai Evaluasi Sub-Bab Terbaru (NilaiEvaluasi)
    if (nilaiEvaluasi.length > 0) {
      const recentEvaluasi = [...nilaiEvaluasi].reverse().slice(0, 4);
      recentEvaluasi.forEach((e) => {
        const formattedDate = formatTanggalIndo(e.tanggal);
        list.push({
          id: `eval-${e.id}`,
          title: `Nilai Evaluasi Sub-Bab: ${e.mata_pelajaran}`,
          message: `Evaluasi sub-bab "${e.sub_bab || 'Materi'}" (${formattedDate}): Skor ${e.nilai} (${e.nilai >= 75 ? 'Tuntas' : 'Perlu Bimbingan Extra'}).`,
          timestamp: formattedDate || 'Terbaru',
          category: 'evaluasi',
          priority: e.nilai < 70 ? 'high' : 'normal',
          isRead: false,
          targetView: 'analisa',
          meta: { subject: e.mata_pelajaran, score: e.nilai }
        });
      });
    }

    // 6. Nilai Tryout / Standar Terbaru (NilaiStandar)
    if (nilaiStandar.length > 0) {
      const recentStandar = [...nilaiStandar].reverse().slice(0, 3);
      recentStandar.forEach((st) => {
        const formattedDate = formatTanggalIndo(st.tanggal);
        list.push({
          id: `standar-${st.id}`,
          title: `Nilai Tryout / Tes Standar: ${st.mata_pelajaran}`,
          message: `Hasil ${st.jenis_tes || 'Tryout'} tanggal ${formattedDate}: Skor ${st.nilai}.`,
          timestamp: formattedDate || 'Terbaru',
          category: 'evaluasi',
          priority: st.nilai < 70 ? 'high' : 'normal',
          isRead: false,
          targetView: 'analisa',
          meta: { subject: st.mata_pelajaran, score: st.nilai }
        });
      });
    }

    // 7. Nilai UTBK / SNBT Terbaru (NilaiSnbtUtbk)
    if (nilaiSnbtUtbk.length > 0) {
      const recentUtbk = [...nilaiSnbtUtbk].reverse().slice(0, 2);
      recentUtbk.forEach((ut) => {
        const scoreShow = ut.rerata || ut.total || 0;
        const formattedDate = formatTanggalIndo(ut.tanggal);
        list.push({
          id: `utbk-${ut.id}`,
          title: `Nilai Simulasi UTBK/SNBT: ${ut.jenis_tes}`,
          message: `Rerata skor simulasi UTBK (${formattedDate}): ${scoreShow}${ut.pk ? ` (PK: ${ut.pk}, PU: ${ut.pu || '-'}, PM: ${ut.pm || '-'})` : ''}.`,
          timestamp: formattedDate || 'Terbaru',
          category: 'evaluasi',
          priority: scoreShow > 600 ? 'high' : 'normal',
          isRead: false,
          targetView: 'analisa',
          meta: { subject: ut.jenis_tes, score: scoreShow }
        });
      });
    }

    // 8. General Grades (Grades)
    if (grades.length > 0) {
      const recentGrades = [...grades].reverse().slice(0, 3);
      recentGrades.forEach((g) => {
        list.push({
          id: `grade-${g.id}`,
          title: `Nilai Terbaru: ${g.subject}`,
          message: `Nilai ${g.type} untuk ${g.subject} tercatat sebesar ${g.score}.${g.notes ? ` Catatan: ${g.notes}` : ''}`,
          timestamp: 'Terbaru',
          category: 'evaluasi',
          priority: 'normal',
          isRead: false,
          targetView: 'analisa',
          meta: { subject: g.subject, score: g.score }
        });
      });
    }

    // 9. Perkembangan Belajar (LearningProgress)
    if (learningProgress.length > 0) {
      const recentProgress = [...learningProgress].reverse().slice(0, 3);
      recentProgress.forEach((p) => {
        list.push({
          id: `prog-${p.id}`,
          title: `Progress Belajar: ${p.subject}`,
          message: `Materi "${p.progress_title}" tercatat penguasaan "${p.status}". ${p.notes ? `Catatan: ${p.notes}` : ''}`,
          timestamp: p.date || 'Terbaru',
          category: 'evaluasi',
          priority: 'normal',
          isRead: false,
          targetView: 'analisa',
          meta: { subject: p.subject }
        });
      });
    }

    // 10. System Announcement / General Info
    list.push({
      id: 'notif-sys-welcome',
      title: 'Rapor Kita',
      message: `Siswa ${student?.nama || 'Terdaftar'} (${student?.nis || 'NIS'}) aktif di cabang ${student?.cabang || 'Pusat'}. Pantau perkembangan belajar dan presensi secara berkala.`,
      timestamp: 'Sistem',
      category: 'sistem',
      priority: 'low',
      isRead: true
    });

    return list;
  }, [student, kbmSchedules, bookingReservations, learningProgress, nilaiEvaluasi, outsideServices, attendanceRecords, grades, nilaiStandar, nilaiSnbtUtbk]);

  // Filter out deleted notifications and map read statuses
  const allActiveNotifications = useMemo(() => {
    return notifications
      .filter(n => !deletedIds.has(n.id))
      .map(n => ({
        ...n,
        isRead: n.isRead || readIds.has(n.id)
      }));
  }, [notifications, deletedIds, readIds]);

  const filteredNotifications = useMemo(() => {
    return allActiveNotifications.filter(n => {
      if (activeTab === 'semua') return true;
      return n.category === activeTab;
    });
  }, [allActiveNotifications, activeTab]);

  const unreadCount = useMemo(() => {
    return allActiveNotifications.filter(n => !n.isRead).length;
  }, [allActiveNotifications]);

  useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [unreadCount, onUnreadCountChange]);

  const getUnreadCountByCategory = (cat: AppNotification['category']) => {
    return allActiveNotifications.filter(n => n.category === cat && !n.isRead).length;
  };

  const handleMarkAllRead = () => {
    const allIds = new Set(readIds);
    notifications.forEach(n => allIds.add(n.id));
    setReadIds(allIds);
  };

  const handleDeleteNotif = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const handleNotifClick = (notif: AppNotification) => {
    setReadIds(prev => new Set(prev).add(notif.id));
    
    if (notif.targetView && onNavigateView) {
      onNavigateView(notif.targetView);
      onClose();
    }
  };

  const getCategoryIcon = (category: AppNotification['category']) => {
    switch (category) {
      case 'jadwal':
        return <CalendarDays className="h-4 w-4 text-sky-600 dark:text-sky-400" />;
      case 'presensi':
        return <UserCheck className="h-4 w-4 text-teal-600 dark:text-teal-400" />;
      case 'reservasi':
        return <HeartHandshake className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
      case 'evaluasi':
        return <Award className="h-4 w-4 text-purple-600 dark:text-purple-400" />;
      case 'sistem':
      default:
        return <Bell className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
    }
  };

  const getCategoryBadge = (category: AppNotification['category']) => {
    switch (category) {
      case 'jadwal':
        return 'bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800';
      case 'presensi':
        return 'bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800';
      case 'reservasi':
        return 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'evaluasi':
        return 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'sistem':
      default:
        return 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl max-w-md sm:max-w-lg w-[95vw] sm:w-full my-auto relative overflow-hidden flex flex-col max-h-[88vh] transition-colors">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-3.5 sm:p-5 text-white relative flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 sm:p-2.5 bg-white/10 rounded-2xl backdrop-blur-md shrink-0 relative">
              <Bell className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-amber-300" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white ring-2 ring-slate-900 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h3 className="text-sm sm:text-base font-black leading-tight text-white truncate">Pusat Notifikasi</h3>
                {unreadCount > 0 ? (
                  <span className="text-[9px] sm:text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping"></span>
                    {unreadCount} Belum Dibaca
                  </span>
                ) : (
                  <span className="text-[9px] sm:text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                    <CheckCheck className="h-3 w-3" />
                    Semua Dibaca
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-300 mt-0.5 truncate">
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-extrabold transition cursor-pointer shadow-xs"
                title="Tandai semua notifikasi sebagai sudah dibaca"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Tandai Semua Dibaca</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title="Tutup"
            >
              <X className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>

        {/* OneSignal Web Push Banner */}
        <div className="px-3.5 py-2.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-indigo-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
              <Smartphone className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="font-bold flex items-center gap-1.5 flex-wrap">
                <span className="text-slate-100">Notifikasi</span>
                {pushPermission === 'granted' ? (
                  <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-emerald-400" />
                    OneSignal Push Aktif
                  </span>
                ) : pushPermission === 'denied' ? (
                  <span className="text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full">
                    Ditolak Browser
                  </span>
                ) : (
                  <span className="text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full">
                    Belum Diizinkan
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-300 mt-0.5 truncate">
                {student?.nis ? `External User ID (NIS): ${student.nis}` : 'Notifikasi Web Push via OneSignal'}
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end self-end sm:self-auto">
            {pushPermission === 'granted' ? (
              <>
                <button
                  onClick={handleCopyNisId}
                  className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-extrabold transition cursor-pointer flex items-center gap-1 border border-slate-700"
                  title="Salin ID NIS ke Clipboard"
                >
                  {copiedToken ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3 text-indigo-300" />}
                  <span>{copiedToken ? 'Tersalin' : 'Salin NIS'}</span>
                </button>
                <button
                  onClick={handleRefreshToken}
                  className="px-2 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-extrabold transition cursor-pointer flex items-center gap-1 border border-amber-500/30"
                  title="Perbarui & Sinkronkan Ulang OneSignal"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span className="hidden md:inline">Perbarui</span>
                </button>
                <button
                  onClick={handleDisableOneSignal}
                  className="px-2 py-1 rounded-xl bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700/60 text-[11px] font-extrabold transition cursor-pointer flex items-center gap-1"
                  title="Matikan Notifikasi OneSignal Perangkat Ini"
                >
                  <BellOff className="h-3 w-3 text-rose-300" />
                  <span>Matikan</span>
                </button>
              </>
            ) : pushPermission === 'denied' ? (
              <div className="flex items-center gap-1 text-[10px] text-rose-300 bg-rose-950/80 border border-rose-800/80 px-2 py-1 rounded-lg">
                <Info className="h-3 w-3 shrink-0 text-rose-400" />
                <span>Klik 🔒 di address bar browser untuk Izinkan Notifikasi</span>
              </div>
            ) : (
              <button
                onClick={handleEnablePush}
                className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-[11px] font-black transition cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Bell className="h-3.5 w-3.5" />
                Aktifkan Notifikasi OneSignal
              </button>
            )}
          </div>
        </div>

        <div className="p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 overflow-x-auto shrink-0 no-scrollbar">
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('semua')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'semua'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700'
              }`}
            >
              <span>Semua</span>
              {unreadCount > 0 ? (
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                  activeTab === 'semua' ? 'bg-white text-indigo-700' : 'bg-rose-500 text-white'
                }`}>
                  {unreadCount}
                </span>
              ) : (
                <span className="text-[10px] opacity-70">({allActiveNotifications.length})</span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('jadwal')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'jadwal'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700'
              }`}
            >
              <span>Jadwal</span>
              {getUnreadCountByCategory('jadwal') > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('presensi')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'presensi'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700'
              }`}
            >
              <span>Presensi</span>
              {getUnreadCountByCategory('presensi') > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('reservasi')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'reservasi'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700'
              }`}
            >
              <span>Reservasi</span>
              {getUnreadCountByCategory('reservasi') > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('evaluasi')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'evaluasi'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700'
              }`}
            >
              <span>Nilai & Evaluasi</span>
              {getUnreadCountByCategory('evaluasi') > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              )}
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline flex items-center gap-1 shrink-0 cursor-pointer pl-1 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-2.5 py-1 rounded-xl transition shadow-2xs"
              title="Tandai semua sudah dibaca"
            >
              <CheckCheck className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Tandai Semua Dibaca</span>
            </button>
          )}
        </div>

        {/* List Body */}
        <div className="p-2.5 sm:p-4 overflow-y-auto space-y-2 grow min-w-0">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <Bell className="h-6 w-6" />
              </div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tidak ada notifikasi di kategori ini
              </h4>
              <p className="text-[11px] text-slate-400">
                Notifikasi otomatis akan muncul saat ada perubahan presensi, jadwal, atau nilai baru.
              </p>
            </div>
          ) : (
            filteredNotifications.map((item) => (
              <div
                key={item.id}
                onClick={() => handleNotifClick(item)}
                className={`group relative p-3 sm:p-3.5 rounded-2xl border transition-all duration-150 cursor-pointer ${
                  !item.isRead
                    ? 'bg-indigo-50/90 dark:bg-indigo-950/40 border-l-4 border-l-indigo-600 dark:border-l-indigo-400 border-indigo-200 dark:border-indigo-800/80 shadow-xs hover:bg-indigo-100/70 dark:hover:bg-indigo-950/70'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/60 opacity-90 hover:opacity-100'
                }`}
              >
                <div className="flex items-start gap-2.5 sm:gap-3">
                  {/* Category Icon Badge */}
                  <div className={`p-2 rounded-xl shrink-0 border mt-0.5 ${getCategoryBadge(item.category)}`}>
                    {getCategoryIcon(item.category)}
                  </div>

                  <div className="grow min-w-0 pr-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        {/* Title */}
                        <h4 className={`text-xs font-bold leading-tight break-words ${
                          !item.isRead 
                            ? 'text-indigo-950 dark:text-indigo-100 font-extrabold' 
                            : 'text-slate-700 dark:text-slate-300'
                        }`}>
                          {item.title}
                        </h4>

                        {/* Unread Status Dot Indicator & Badge */}
                        {!item.isRead && (
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                            </span>
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                              Belum Dibaca
                            </span>
                          </div>
                        )}
                      </div>

                      <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 flex items-center gap-1 font-medium">
                        <Clock className="h-3 w-3" />
                        {item.timestamp}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed break-words">
                      {item.message}
                    </p>

                    {item.targetView && (
                      <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 group-hover:underline">
                        <span>Lihat detail</span>
                        <ChevronRight className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => handleDeleteNotif(item.id, e)}
                  className="absolute top-2 right-2 p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer opacity-70 sm:opacity-0 group-hover:opacity-100"
                  title="Hapus notifikasi ini"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 truncate">
            {unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : 'Semua notifikasi sudah dibaca'}
          </p>

          <button
            onClick={onClose}
            className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold transition cursor-pointer shrink-0"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
