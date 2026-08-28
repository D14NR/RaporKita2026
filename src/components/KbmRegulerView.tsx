import React, { useState, useMemo } from 'react';
import {
  Calendar,
  BookOpen,
  Clock,
  CheckCircle,
  FileText,
  Search,
  Filter,
  Activity,
  MapPin,
  Users,
  GraduationCap
} from 'lucide-react';
import { RegularSchedule, Student, DataSiswa } from '../types';
import { formatTanggalIndo, parseDateSafe, compareScheduleDates } from '../lib/dateUtils';

interface KbmRegulerViewProps {
  currentStudent: DataSiswa | Student | null;
  selectedStudentData: DataSiswa | null;
  regularSchedules: RegularSchedule[];
  isKbmLoading: boolean;
  isThisOrNextMonth: (dateStr?: string) => boolean;
  isScheduleFinished: (item: any) => boolean;
  handleOpenLeaveModal: (item: any) => void;
}

export const KbmRegulerView: React.FC<KbmRegulerViewProps> = ({
  currentStudent,
  selectedStudentData,
  regularSchedules,
  isKbmLoading,
  isThisOrNextMonth,
  isScheduleFinished,
  handleOpenLeaveModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'HARI_INI' | 'AKAN_DATANG' | 'SELESAI'>('ALL');

  const studentData = selectedStudentData || currentStudent;
  const studentName = (studentData as DataSiswa)?.nama || (studentData as Student)?.name || 'Siswa';
  const studentNis = (studentData as DataSiswa)?.nis || (studentData as Student)?.id || '-';
  const studentCabang = (studentData as DataSiswa)?.cabang || 'Semarang 2';
  const studentKelas = (studentData as DataSiswa)?.kelompok_kelas || (studentData as Student)?.class || '2 IPS C';

  // Filter schedules for current and next month
  const activeSchedules = useMemo(() => {
    return regularSchedules.filter(item => isThisOrNextMonth(item.tanggal));
  }, [regularSchedules, isThisOrNextMonth]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = activeSchedules.length;
    if (total === 0) return { total: 0, hariIni: 0, akanDatang: 0, selesai: 0 };

    const today = new Date();
    const todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

    let hariIni = 0;
    let akanDatang = 0;
    let selesai = 0;

    activeSchedules.forEach(item => {
      if (!item.tanggal) {
        selesai += 1;
        return;
      }
      const itemDate = parseDateSafe(item.tanggal);
      if (!itemDate) {
        selesai += 1;
        return;
      }
      const itemTime = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate()).getTime();
      if (itemTime === todayTime) hariIni += 1;
      else if (itemTime > todayTime) akanDatang += 1;
      else selesai += 1;
    });

    return { total, hariIni, akanDatang, selesai };
  }, [activeSchedules]);

  // Grouped and sorted schedules
  const groupedSchedules = useMemo(() => {
    const grouped: { [dateStr: string]: RegularSchedule[] } = {};
    
    activeSchedules
      .filter(item => {
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery = !q ||
          (item.subject && item.subject.toLowerCase().includes(q)) ||
          (item.teacher && item.teacher.toLowerCase().includes(q)) ||
          (item.kelas && item.kelas.toLowerCase().includes(q)) ||
          (item.tanggal && item.tanggal.toLowerCase().includes(q));
        
        if (!matchesQuery) return false;

        if (statusFilter === 'ALL') return true;

        const today = new Date();
        const todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
        const itemDate = parseDateSafe(item.tanggal);
        const itemTime = itemDate ? new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate()).getTime() : 0;

        if (statusFilter === 'HARI_INI') return itemTime === todayTime;
        if (statusFilter === 'AKAN_DATANG') return itemTime > todayTime;
        if (statusFilter === 'SELESAI') return itemTime < todayTime;

        return true;
      })
      .forEach(item => {
        const dateKey = item.tanggal || item.day || 'No Date';
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(item);
      });

    // Sort items within each day by start time
    Object.keys(grouped).forEach(dateKey => {
      grouped[dateKey].sort((a, b) => {
        const timeA = a.time_start || '';
        const timeB = b.time_start || '';
        return timeA.localeCompare(timeB);
      });
    });

    return grouped;
  }, [activeSchedules, searchQuery, statusFilter]);

  const sortedDateKeys = useMemo(() => {
    return Object.keys(groupedSchedules).sort((a, b) => {
      if (a === 'No Date') return 1;
      if (b === 'No Date') return -1;
      return compareScheduleDates(a, b);
    });
  }, [groupedSchedules]);

  const formatKbmDate = (dateStr: string) => {
    if (!dateStr || dateStr === 'No Date') return 'Jadwal';
    return formatTanggalIndo(dateStr, { withDayName: true, uppercase: true });
  };

  const getKbmDateBadge = (dateStr: string) => {
    if (!dateStr || dateStr === 'No Date') return null;
    const itemDate = parseDateSafe(dateStr);
    if (!itemDate) return null;
    
    const today = new Date();
    const itemTime = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate()).getTime();
    const todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    
    if (itemTime === todayTime) {
      return (
        <span className="bg-rose-600 text-white text-[9px] font-black tracking-widest px-3 py-1 rounded-full uppercase shadow-xs animate-pulse">
          HARI INI
        </span>
      );
    }
    
    if (itemTime > todayTime) {
      return (
        <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[9px] font-black tracking-widest px-3 py-1 rounded-full uppercase border border-emerald-200 dark:border-emerald-800">
          AKAN DATANG
        </span>
      );
    }
    
    return (
      <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[9px] font-black tracking-widest px-3 py-1 rounded-full uppercase border border-slate-200 dark:border-slate-700">
        SELESAI
      </span>
    );
  };

  return (
    <div id="view-kbm-reguler-modern" className="space-y-6">
      
      {/* 1. Header Banner & Profile */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold text-sky-200">
              <Calendar className="h-3.5 w-3.5 text-sky-300" />
              Kegiatan Belajar Mengajar Reguler
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Jadwal KBM Reguler
            </h2>
            <p className="text-sm text-slate-300 max-w-xl font-normal leading-relaxed">
              Jadwal tatap muka, mata pelajaran, dan pengampu kelas reguler siswa berdasarkan cabang dan kelompok kelas.
            </p>
          </div>

          {/* Quick Profile Tag */}
          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 shrink-0">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center font-black text-base text-white shadow-md">
              {studentName ? studentName.charAt(0) : 'S'}
            </div>
            <div>
              <div className="text-xs font-bold text-white leading-snug">{studentName}</div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span>Cabang: {studentCabang}</span>
                <span>•</span>
                <span className="text-sky-300 font-semibold">{studentKelas}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Bento Grid KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-white/10">
          {/* Total Jadwal */}
          <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 flex flex-col justify-between hover:bg-white/10 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Total Jadwal</span>
              <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-300">
                <BookOpen className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-white">{stats.total}</span>
                <span className="text-[11px] text-slate-400 font-medium">Sesi</span>
              </div>
              <div className="mt-1 text-[10px] text-slate-300 font-medium">Periode aktif berjalan</div>
            </div>
          </div>

          {/* Hari Ini */}
          <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 flex flex-col justify-between hover:bg-white/10 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Jadwal Hari Ini</span>
              <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-rose-300">{stats.hariIni}</span>
                <span className="text-[11px] text-rose-200/80 font-medium">Sesi</span>
              </div>
              <div className="mt-1 text-[10px] text-rose-200/80 font-medium">Berlangsung hari ini</div>
            </div>
          </div>

          {/* Akan Datang */}
          <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 flex flex-col justify-between hover:bg-white/10 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Akan Datang</span>
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-emerald-300">{stats.akanDatang}</span>
                <span className="text-[11px] text-slate-400 font-medium">Sesi</span>
              </div>
              <div className="mt-1 text-[10px] text-emerald-200/80 font-medium">Mendatang</div>
            </div>
          </div>

          {/* Selesai */}
          <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 flex flex-col justify-between hover:bg-white/10 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Selesai</span>
              <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300">
                <CheckCircle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-slate-200">{stats.selesai}</span>
                <span className="text-[11px] text-slate-400 font-medium">Sesi</span>
              </div>
              <div className="mt-1 text-[10px] text-slate-300 font-medium">Telah terlaksana</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Toolbar: Search & Filters */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari mata pelajaran, nama pengajar, atau kelas..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/80 overflow-x-auto">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              statusFilter === 'ALL'
                ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            Semua ({stats.total})
          </button>
          <button
            onClick={() => setStatusFilter('HARI_INI')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              statusFilter === 'HARI_INI'
                ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            Hari Ini ({stats.hariIni})
          </button>
          <button
            onClick={() => setStatusFilter('AKAN_DATANG')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              statusFilter === 'AKAN_DATANG'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            Akan Datang ({stats.akanDatang})
          </button>
          <button
            onClick={() => setStatusFilter('SELESAI')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              statusFilter === 'SELESAI'
                ? 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            Selesai ({stats.selesai})
          </button>
        </div>
      </div>

      {/* 4. Notice Box */}
      <div className="bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/80 rounded-2xl p-4 flex items-start gap-3">
        <div className="text-sky-600 dark:text-sky-400 mt-0.5 shrink-0">
          <BookOpen className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold text-sky-900 dark:text-sky-200">Informasi Cabang & Kelompok Kelas</p>
          <p className="text-xs text-sky-800 dark:text-sky-300 mt-0.5">
            Menampilkan seluruh jadwal KBM Reguler untuk Cabang <strong className="font-bold">{studentCabang}</strong> dan Kelompok Kelas <strong className="font-bold">{studentKelas}</strong>.
          </p>
        </div>
      </div>

      {/* 5. Schedule Content */}
      {isKbmLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700/80">
          <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-extrabold text-slate-400 mt-3">Memuat Jadwal KBM Reguler...</p>
        </div>
      ) : sortedDateKeys.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-3xl text-center p-6 space-y-3">
          <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-700">
            <BookOpen className="h-8 w-8 text-slate-400" />
          </div>
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Tidak Ada Jadwal KBM Ditemukan</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
            {searchQuery ? 'Tidak ada jadwal yang cocok dengan kata kunci pencarian Anda.' : `Jadwal tidak ditemukan untuk Cabang ${studentCabang} dan Kelompok Kelas ${studentKelas}.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedDateKeys.map((dateKey) => {
            const sForDay = groupedSchedules[dateKey] || [];
            if (sForDay.length === 0) return null;

            return (
              <div key={dateKey} className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-3xl p-5 flex flex-col shadow-xs hover:shadow-md transition duration-200">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-700/80">
                  <span className="text-xs font-black text-sky-600 dark:text-sky-400 tracking-wider">
                    {formatKbmDate(dateKey)}
                  </span>
                  {getKbmDateBadge(dateKey)}
                </div>

                <div className="space-y-3 flex-1">
                  {sForDay.map((item, idx) => (
                    <div key={idx} className="bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl flex flex-col gap-3 shadow-3xs hover:shadow-2xs transition duration-150">
                      <div className="flex items-center justify-between">
                        <span className="bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 text-[10px] font-black px-2.5 py-1 rounded-lg tracking-wider uppercase border border-sky-200 dark:border-sky-800">
                          {item.kelas || studentKelas}
                        </span>
                        <div className="flex items-center text-[11px] text-slate-500 dark:text-slate-400 font-bold gap-1">
                          <Clock className="h-3 w-3 text-sky-500" />
                          <span>{item.time_start} - {item.time_end}</span>
                        </div>
                      </div>

                      <h5 className="text-[13px] font-black text-slate-900 dark:text-slate-100 leading-snug uppercase break-words">
                        {item.subject}
                      </h5>

                      {item.teacher && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                          <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>Pengajar: <strong className="text-slate-700 dark:text-slate-300">{item.teacher}</strong></span>
                        </div>
                      )}

                      <div className="flex items-center justify-end pt-2.5 border-t border-slate-200/60 dark:border-slate-800 mt-1">
                        {(() => {
                          const isFinished = isScheduleFinished({
                            ...item,
                            tanggal: item.tanggal || (dateKey !== 'No Date' ? dateKey : undefined)
                          });
                          if (isFinished) {
                            return (
                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg flex items-center gap-1">
                                <CheckCircle className="h-3 w-3 text-slate-400" />
                                KBM Selesai
                              </span>
                            );
                          }
                          return (
                            <button
                              onClick={() => handleOpenLeaveModal({
                                subject: item.subject,
                                date: item.tanggal || (dateKey !== 'No Date' ? dateKey : undefined),
                                time: `${item.time_start} - ${item.time_end}`,
                                teacher: item.teacher,
                                kelas: item.kelas || studentKelas
                              })}
                              className="text-[10px] font-extrabold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800 transition flex items-center gap-1 shrink-0 cursor-pointer"
                            >
                              <FileText className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                              Form Izin/Sakit
                            </button>
                          );
                        })()}
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
  );
};
