import React, { useState, useMemo, useEffect } from 'react';
import {
  GraduationCap,
  Calendar,
  Clock,
  CheckCircle,
  FileText,
  Search,
  Filter,
  Activity,
  AlertCircle,
  Users,
  History,
  Layers,
  Database,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { AdditionalSchedule, Student, DataSiswa } from '../types';
import { formatTanggalIndo, parseDateSafe, compareScheduleDates, MONTHS_INDO } from '../lib/dateUtils';

interface KbmKhususViewProps {
  currentStudent: DataSiswa | Student | null;
  selectedStudentData: DataSiswa | null;
  additionalSchedules: AdditionalSchedule[];
  isThisOrNextMonth: (dateStr?: string) => boolean;
  isScheduleFinished: (item: any) => boolean;
  handleOpenLeaveModal: (item: any) => void;
}

export const KbmKhususView: React.FC<KbmKhususViewProps> = ({
  currentStudent,
  selectedStudentData,
  additionalSchedules,
  isThisOrNextMonth,
  isScheduleFinished,
  handleOpenLeaveModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AKTIF' | 'SELESAI'>('ALL');
  const [periodFilter, setPeriodFilter] = useState<'ACTIVE' | 'HISTORY' | 'ALL'>('ACTIVE');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(6);

  const studentData = selectedStudentData || currentStudent;
  const studentName = (studentData as DataSiswa)?.nama || (studentData as Student)?.name || 'Siswa';
  const studentNis = (studentData as DataSiswa)?.nis || (studentData as Student)?.id || '-';
  const studentCabang = (studentData as DataSiswa)?.cabang || 'Semarang 2';
  const studentSekolah = (studentData as DataSiswa)?.asal_sekolah || '-';
  const studentJenjang = (studentData as DataSiswa)?.jenjang_studi || (studentData as Student)?.class || '-';

  // Extract available months for historical filtering
  const availableMonths = useMemo(() => {
    const monthsMap = new Map<string, string>();
    additionalSchedules.forEach(item => {
      if (!item.tanggal) return;
      const d = parseDateSafe(item.tanggal);
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
  }, [additionalSchedules]);

  // Filter schedules by period and specific month
  const scopedSchedules = useMemo(() => {
    return additionalSchedules.filter(item => {
      // 1. Period Scope
      if (periodFilter === 'ACTIVE') {
        if (!isThisOrNextMonth(item.tanggal)) return false;
      } else if (periodFilter === 'HISTORY') {
        if (isThisOrNextMonth(item.tanggal)) return false;
      }

      // 2. Specific Month filter
      if (selectedMonth !== 'ALL') {
        if (!item.tanggal) return false;
        const d = parseDateSafe(item.tanggal);
        if (!d) return false;
        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (ym !== selectedMonth) return false;
      }

      return true;
    });
  }, [additionalSchedules, periodFilter, selectedMonth, isThisOrNextMonth]);

  // Stats calculation based on current scope
  const stats = useMemo(() => {
    const total = scopedSchedules.length;
    if (total === 0) return { total: 0, aktif: 0, selesai: 0 };

    let aktif = 0;
    let selesai = 0;

    scopedSchedules.forEach(item => {
      const finished = isScheduleFinished(item);
      if (finished || item.status === 'Selesai') {
        selesai += 1;
      } else {
        aktif += 1;
      }
    });

    return { total, aktif, selesai };
  }, [scopedSchedules, isScheduleFinished]);

  // Filtered and sorted schedules
  const filteredSchedules = useMemo(() => {
    return scopedSchedules
      .filter(item => {
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery = !q ||
          (item.subject && item.subject.toLowerCase().includes(q)) ||
          (item.teacher && item.teacher.toLowerCase().includes(q)) ||
          (item.kelas && item.kelas.toLowerCase().includes(q)) ||
          (item.day && item.day.toLowerCase().includes(q)) ||
          (item.tanggal && item.tanggal.toLowerCase().includes(q));

        if (!matchesQuery) return false;

        const finished = isScheduleFinished(item);
        if (statusFilter === 'AKTIF') return !finished && item.status !== 'Selesai';
        if (statusFilter === 'SELESAI') return finished || item.status === 'Selesai';

        return true;
      })
      .sort((a, b) => {
        if (periodFilter === 'HISTORY') {
          const dateComp = compareScheduleDates(b.tanggal, a.tanggal);
          if (dateComp !== 0) return dateComp;
        } else {
          const dateComp = compareScheduleDates(a.tanggal, b.tanggal);
          if (dateComp !== 0) return dateComp;
        }

        const timeA = a.time_start || '';
        const timeB = b.time_start || '';
        return timeA.localeCompare(timeB);
      });
  }, [scopedSchedules, searchQuery, statusFilter, isScheduleFinished, periodFilter]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredSchedules.length / itemsPerPage));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, periodFilter, selectedMonth, itemsPerPage]);

  const paginatedSchedules = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSchedules.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSchedules, currentPage, itemsPerPage]);

  return (
    <div id="view-kbm-khusus-modern" className="space-y-6">
      
      {/* 1. Header Banner & Profile */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-48 h-48 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold text-indigo-200">
              <GraduationCap className="h-3.5 w-3.5 text-indigo-300" />
              Bimbingan Khusus & Ekstrakurikuler
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Jadwal KBM Khusus
            </h2>
            <p className="text-sm text-slate-300 max-w-xl font-normal leading-relaxed">
              Kelas bimbingan di luar jam KBM reguler, pembinaan intensif, persiapan UTBK/Tes, dan konsultasi akademik khusus.
            </p>
          </div>

          {/* Quick Profile Tag */}
          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 shrink-0">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-black text-base text-white shadow-md">
              {studentName ? studentName.charAt(0) : 'S'}
            </div>
            <div>
              <div className="text-xs font-bold text-white leading-snug">{studentName}</div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span>Cabang: {studentCabang}</span>
                <span>•</span>
                <span className="text-indigo-300 font-semibold">{studentJenjang}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Bento Grid KPIs */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-6 pt-6 border-t border-white/10">
          {/* Total Jadwal */}
          <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 flex flex-col justify-between hover:bg-white/10 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                {periodFilter === 'ACTIVE' ? 'Total Sesi Aktif' : periodFilter === 'HISTORY' ? 'Total Sesi Historis' : 'Semua KBM Khusus'}
              </span>
              <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300">
                <GraduationCap className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-white">{stats.total}</span>
                <span className="text-[11px] text-slate-400 font-medium">Sesi</span>
              </div>
              <div className="mt-1 text-[10px] text-slate-300 font-medium">
                {periodFilter === 'ACTIVE' ? 'Bulan ini & depan' : periodFilter === 'HISTORY' ? 'Riwayat lampau' : 'Terdaftar'}
              </div>
            </div>
          </div>

          {/* Aktif */}
          <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 flex flex-col justify-between hover:bg-white/10 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Sesi Aktif</span>
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300">
                <Activity className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-emerald-300">{stats.aktif}</span>
                <span className="text-[11px] text-emerald-200/80 font-medium">Sesi</span>
              </div>
              <div className="mt-1 text-[10px] text-emerald-200/80 font-medium">Berjalan</div>
            </div>
          </div>

          {/* Selesai */}
          <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 flex flex-col justify-between hover:bg-white/10 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Selesai</span>
              <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-300">
                <CheckCircle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-slate-200">{stats.selesai}</span>
                <span className="text-[11px] text-slate-400 font-medium">Sesi</span>
              </div>
              <div className="mt-1 text-[10px] text-slate-300 font-medium">Terlaksana</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs: Active vs History vs All */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-800 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            id="tab-kbm-khusus-active"
            onClick={() => { setPeriodFilter('ACTIVE'); setSelectedMonth('ALL'); }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              periodFilter === 'ACTIVE'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>Jadwal Aktif</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20">
              Bulan Ini & Depan
            </span>
          </button>

          <button
            id="tab-kbm-khusus-history"
            onClick={() => { setPeriodFilter('HISTORY'); setSelectedMonth('ALL'); }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              periodFilter === 'HISTORY'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
            }`}
          >
            <History className="h-4 w-4" />
            <span>Riwayat Historis</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20">
              Lampau
            </span>
          </button>

          <button
            id="tab-kbm-khusus-all"
            onClick={() => { setPeriodFilter('ALL'); setSelectedMonth('ALL'); }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              periodFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Semua Jadwal</span>
          </button>
        </div>

        {/* Month Selector for quick jump */}
        {availableMonths.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">
              Pilih Bulan:
            </span>
            <select
              id="select-kbm-khusus-month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">Semua Bulan ({availableMonths.length})</option>
              {availableMonths.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 4. Toolbar: Search & Filters */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari mata pelajaran, pembina, hari, atau kelas..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/80 overflow-x-auto">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            Semua ({stats.total})
          </button>
          <button
            onClick={() => setStatusFilter('AKTIF')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              statusFilter === 'AKTIF'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            Aktif ({stats.aktif})
          </button>
          <button
            onClick={() => setStatusFilter('SELESAI')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              statusFilter === 'SELESAI'
                ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            Selesai ({stats.selesai})
          </button>
        </div>

        {/* Page Size Selector */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Per Halaman:
          </span>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value={6}>6 sesi</option>
            <option value={12}>12 sesi</option>
            <option value={24}>24 sesi</option>
          </select>
        </div>
      </div>

      {/* 5. Notice / School details */}
      <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/80 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 shrink-0">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
              {periodFilter === 'ACTIVE' ? 'Jadwal Aktif KBM Khusus' : periodFilter === 'HISTORY' ? 'Riwayat Historis KBM Khusus' : 'Seluruh Arsip KBM Khusus'}
            </p>
            <p className="text-[11px] text-indigo-700 dark:text-indigo-300">
              Cabang <strong className="font-bold">{studentCabang}</strong> • Jenjang <strong className="font-bold">{studentJenjang}</strong> • Asal Sekolah <strong className="font-bold">{studentSekolah}</strong>
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-indigo-200/60 dark:border-indigo-800/60 text-xs font-bold text-indigo-800 dark:text-indigo-300">
          <Database className="h-3.5 w-3.5 text-indigo-600" />
          <span>Halaman {currentPage} dari {totalPages} ({filteredSchedules.length} sesi)</span>
        </div>
      </div>

      {/* 6. Schedule Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paginatedSchedules.map((item, idx) => {
          const isFinished = isScheduleFinished(item) || item.status === 'Selesai';
          return (
            <div key={item.id || idx} className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-3xl p-5 flex items-start gap-4 shadow-xs hover:shadow-md transition duration-200">
              <div className="bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 p-3.5 rounded-2xl shrink-0 border border-indigo-100 dark:border-indigo-900">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                  <span className="bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase border border-indigo-200 dark:border-indigo-800">
                    Hari {item.day}
                  </span>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase border ${
                    isFinished 
                      ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600'
                      : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                  }`}>
                    {isFinished ? 'Selesai' : (item.status || 'Aktif')}
                  </span>
                </div>

                <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">{item.subject}</h4>
                
                <div className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                  {item.teacher && (
                    <div className="flex items-center gap-1.5 font-medium">
                      <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>Pembina: <strong className="text-slate-700 dark:text-slate-300">{item.teacher}</strong></span>
                    </div>
                  )}
                  {item.kelas && (
                    <div className="flex items-center gap-1.5 font-medium">
                      <span className="text-[10px] font-bold text-slate-400">KELAS:</span>
                      <span className="text-slate-700 dark:text-slate-300 font-semibold">{item.kelas}</span>
                    </div>
                  )}
                  {item.tanggal && (
                    <div className="flex items-center gap-1.5 font-medium">
                      <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{formatTanggalIndo(item.tanggal, { withDayName: true })}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                  <div className="flex items-center text-xs text-slate-600 dark:text-slate-300 font-bold">
                    <Clock className="h-4 w-4 text-indigo-500 mr-1.5 shrink-0" />
                    {item.time_start} - {item.time_end} WIB
                  </div>
                  {isFinished ? (
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700/50 px-2.5 py-1 rounded-lg flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-slate-400" />
                      Selesai
                    </span>
                  ) : (
                    <button
                      onClick={() => handleOpenLeaveModal({
                        subject: item.subject,
                        date: item.tanggal,
                        time: `${item.time_start} - ${item.time_end}`,
                        teacher: item.teacher,
                        kelas: item.kelas
                      })}
                      className="text-[10px] font-extrabold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800 transition flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <FileText className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                      Form Izin/Sakit
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredSchedules.length === 0 && (
          <div className="col-span-full py-16 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-3xl text-center p-6 space-y-3">
            <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-700 mx-auto w-fit">
              <GraduationCap className="h-8 w-8 text-slate-400" />
            </div>
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {periodFilter === 'HISTORY' ? 'Tidak Ada Riwayat Jadwal KBM Khusus' : 'Tidak Ada Jadwal KBM Khusus'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {searchQuery
                ? 'Tidak ada jadwal yang cocok dengan kata kunci pencarian Anda.'
                : periodFilter === 'HISTORY'
                ? 'Belum ada catatan jadwal KBM khusus masa lampau.'
                : `Jadwal tidak ditemukan untuk Cabang ${studentCabang}, Jenjang ${studentJenjang}, dan Asal Sekolah ${studentSekolah}.`}
            </p>
          </div>
        )}
      </div>

      {/* 7. Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs overflow-hidden">
          {/* Summary Text */}
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium text-center sm:text-left">
            Menampilkan sesi <strong className="text-slate-800 dark:text-slate-200">{(currentPage - 1) * itemsPerPage + 1}</strong>–
            <strong className="text-slate-800 dark:text-slate-200">{Math.min(currentPage * itemsPerPage, filteredSchedules.length)}</strong> dari{' '}
            <strong className="text-slate-800 dark:text-slate-200">{filteredSchedules.length}</strong> sesi
          </div>

          {/* Controls Group */}
          <div className="flex items-center justify-center gap-1 sm:gap-1.5 flex-wrap">
            {/* First Page (Desktop only) */}
            <button
              id="btn-pagination-khusus-first"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              title="Halaman Pertama"
              className="hidden sm:inline-flex items-center justify-center w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>

            {/* Prev Page */}
            <button
              id="btn-pagination-khusus-prev"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              title="Halaman Sebelumnya"
              className="flex items-center justify-center w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Mobile Page Indicator Pill */}
            <div className="inline-flex sm:hidden items-center px-3 h-8 bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200">
              Hal <span className="text-indigo-600 dark:text-indigo-400 mx-1 font-black">{currentPage}</span> / {totalPages}
            </div>

            {/* Numbered Page Buttons (Desktop & Tablet) */}
            <div className="hidden sm:flex items-center gap-1.5">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  if (totalPages <= 7) return true;
                  if (page === 1 || page === totalPages) return true;
                  if (Math.abs(page - currentPage) <= 1) return true;
                  return false;
                })
                .map((page, idx, array) => {
                  const prevPage = array[idx - 1];
                  const showEllipsis = prevPage && page - prevPage > 1;

                  return (
                    <React.Fragment key={page}>
                      {showEllipsis && (
                        <span className="px-1 text-xs text-slate-400 font-bold select-none">...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`min-w-8 h-8 px-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          currentPage === page
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  );
                })}
            </div>

            {/* Next Page */}
            <button
              id="btn-pagination-khusus-next"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              title="Halaman Berikutnya"
              className="flex items-center justify-center w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Last Page (Desktop only) */}
            <button
              id="btn-pagination-khusus-last"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              title="Halaman Terakhir"
              className="hidden sm:inline-flex items-center justify-center w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
