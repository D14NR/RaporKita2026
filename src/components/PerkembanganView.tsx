import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Award,
  BookOpen,
  Calendar,
  Search,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Target,
  Layers,
  Activity,
  CheckCircle,
  FileText,
  UserCheck
} from 'lucide-react';
import { LearningProgress, Student, DataSiswa } from '../types';
import { formatTanggalIndo, parseDateSafe } from '../lib/dateUtils';
import { PerkembanganProgress } from './PerkembanganProgress';

interface PerkembanganViewProps {
  currentStudent: DataSiswa | Student | null;
  learningProgress: LearningProgress[];
}

export const PerkembanganView: React.FC<PerkembanganViewProps> = ({
  currentStudent,
  learningProgress
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc'>('date_desc');
  const [showCharts, setShowCharts] = useState(true);

  const studentName = (currentStudent as DataSiswa)?.nama || (currentStudent as Student)?.name || 'Siswa';
  const studentNis = (currentStudent as DataSiswa)?.nis || (currentStudent as Student)?.id || '-';
  const studentJenjang = (currentStudent as DataSiswa)?.jenjang_studi || (currentStudent as Student)?.class || '';
  const studentKelompok = (currentStudent as DataSiswa)?.kelompok_kelas || '';

  // Stats calculation
  const stats = useMemo(() => {
    const total = learningProgress.length;
    if (total === 0) {
      return {
        totalRecords: 0,
        sangatBaikCount: 0,
        baikCount: 0,
        successRate: 0,
        avgPenguasaan: 0,
        avgPenjelasan: 0,
        avgKondisi: 0
      };
    }

    const sangatBaik = learningProgress.filter(p => p.status === 'Sangat Baik').length;
    const baik = learningProgress.filter(p => p.status === 'Baik').length;
    const successRate = Math.round(((sangatBaik + baik) / total) * 100);

    const penguasaanSum = learningProgress.reduce((acc, curr) => acc + (curr.penguasaan || 0), 0);
    const penjelasanSum = learningProgress.reduce((acc, curr) => acc + (curr.penjelasan || 0), 0);
    const kondisiSum = learningProgress.reduce((acc, curr) => acc + (curr.kondisi || 0), 0);

    return {
      totalRecords: total,
      sangatBaikCount: sangatBaik,
      baikCount: baik,
      successRate,
      avgPenguasaan: Math.round(penguasaanSum / total),
      avgPenjelasan: Math.round(penjelasanSum / total),
      avgKondisi: Math.round(kondisiSum / total)
    };
  }, [learningProgress]);

  // Unique subjects for filter
  const subjectsList = useMemo(() => {
    const set = new Set<string>();
    learningProgress.forEach(p => { if (p.subject) set.add(p.subject); });
    return Array.from(set).sort();
  }, [learningProgress]);

  // Filtered & Sorted Records
  const filteredRecords = useMemo(() => {
    return learningProgress
      .filter(item => {
        const matchesSubject = selectedSubject === 'ALL' || item.subject === selectedSubject;
        const matchesStatus = selectedStatus === 'ALL' || item.status === selectedStatus;
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery = !q ||
          (item.subject && item.subject.toLowerCase().includes(q)) ||
          (item.progress_title && item.progress_title.toLowerCase().includes(q)) ||
          (item.notes && item.notes.toLowerCase().includes(q));
        return matchesSubject && matchesStatus && matchesQuery;
      })
      .sort((a, b) => {
        const dateA = parseDateSafe(a.date)?.getTime() || 0;
        const dateB = parseDateSafe(b.date)?.getTime() || 0;
        if (sortBy === 'date_desc') return dateB - dateA;
        return dateA - dateB;
      });
  }, [learningProgress, selectedSubject, selectedStatus, searchQuery, sortBy]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Sangat Baik':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-950/40',
          text: 'text-emerald-700 dark:text-emerald-400',
          border: 'border-emerald-200 dark:border-emerald-800',
          badgeColor: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300',
          dot: 'bg-emerald-500'
        };
      case 'Baik':
        return {
          bg: 'bg-sky-50 dark:bg-sky-950/40',
          text: 'text-sky-700 dark:text-sky-400',
          border: 'border-sky-200 dark:border-sky-800',
          badgeColor: 'bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300',
          dot: 'bg-sky-500'
        };
      case 'Cukup':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/40',
          text: 'text-amber-700 dark:text-amber-400',
          border: 'border-amber-200 dark:border-amber-800',
          badgeColor: 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300',
          dot: 'bg-amber-500'
        };
      default:
        return {
          bg: 'bg-rose-50 dark:bg-rose-950/40',
          text: 'text-rose-700 dark:text-rose-400',
          border: 'border-rose-200 dark:border-rose-800',
          badgeColor: 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300',
          dot: 'bg-rose-500'
        };
    }
  };

  return (
    <div id="view-perkembangan-modern" className="space-y-6">
      
      {/* 1. Header Banner & Profile */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-48 h-48 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold text-violet-200">
              <Activity className="h-3.5 w-3.5 text-violet-300" />
              Laporan Kompetensi & Catatan Bimbingan
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Riwayat Perkembangan Belajar
            </h2>
            <p className="text-sm text-slate-300 max-w-xl font-normal leading-relaxed">
              Analisis komprehensif perkembangan pemahaman materi, catatan tutor, dan evaluasi berkala siswa.
            </p>
          </div>

          {/* Quick Profile Tag */}
          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 shrink-0">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-violet-500 to-indigo-500 flex items-center justify-center font-black text-base text-white shadow-md">
              {studentName ? studentName.charAt(0) : 'S'}
            </div>
            <div>
              <div className="text-xs font-bold text-white leading-snug">{studentName}</div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span>NIS: {studentNis}</span>
                <span>•</span>
                <span className="text-violet-300 font-semibold">{studentKelompok || studentJenjang || 'Reguler'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Bento Grid KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-white/10">
          {/* Card 1: Total Catatan */}
          <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 flex flex-col justify-between hover:bg-white/10 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Total Catatan</span>
              <div className="p-1.5 rounded-lg bg-violet-500/20 text-violet-300">
                <FileText className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-white">{stats.totalRecords}</span>
                <span className="text-[11px] text-slate-400 font-medium">Laporan</span>
              </div>
              <div className="mt-1 text-[10px] text-slate-300 font-medium">
                Tercatat aktif dalam sesi bimbingan
              </div>
            </div>
          </div>

          {/* Card 2: Tingkat Keberhasilan */}
          <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 flex flex-col justify-between hover:bg-white/10 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Predikat Baik/Sangat Baik</span>
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300">
                <Award className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-emerald-300">{stats.successRate}%</span>
                <span className="text-[11px] text-emerald-200/70 font-medium">({stats.sangatBaikCount + stats.baikCount}/{stats.totalRecords})</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-emerald-400 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${stats.successRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 3: Penguasaan Materi */}
          <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 flex flex-col justify-between hover:bg-white/10 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Rerata Penguasaan</span>
              <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-300">
                <Target className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-sky-300">{stats.avgPenguasaan}%</span>
                <span className="text-[11px] text-slate-400 font-medium">Skala 100</span>
              </div>
              <div className="mt-1 text-[10px] text-slate-300 font-medium">
                Indeks penguasaan materi
              </div>
            </div>
          </div>

          {/* Card 4: Kondisi & Pemahaman */}
          <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 flex flex-col justify-between hover:bg-white/10 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Rerata Pemahaman</span>
              <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-white">{stats.avgKondisi}%</span>
                <span className="text-[11px] text-slate-400 font-medium">Kondisi Belajar</span>
              </div>
              <div className="mt-1 text-[10px] text-slate-300 font-medium">
                Keaktifan & respon belajar
              </div>
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
            placeholder="Cari mata pelajaran, topik materi, atau catatan tutor..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition"
          />
        </div>

        {/* Filters & Sorting */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
          >
            <option value="ALL">Semua Mata Pelajaran</option>
            {subjectsList.map((sub, sIdx) => (
              <option key={sIdx} value={sub}>{sub}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
          >
            <option value="ALL">Semua Predikat</option>
            <option value="Sangat Baik">Sangat Baik</option>
            <option value="Baik">Baik</option>
            <option value="Cukup">Cukup</option>
            <option value="Butuh Perhatian">Butuh Perhatian</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
          >
            <option value="date_desc">Tanggal: Terbaru</option>
            <option value="date_asc">Tanggal: Terlama</option>
          </select>

          <button
            onClick={() => setShowCharts(!showCharts)}
            className={`text-xs font-bold px-3 py-2.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer ${
              showCharts 
                ? 'bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800' 
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>{showCharts ? 'Grafik Aktif' : 'Grafik'}</span>
          </button>
        </div>
      </div>

      {/* 4. Progress Summary Charts Section */}
      {showCharts && learningProgress.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs p-5 sm:p-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-700/60 mb-5">
            <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
                Grafik Rata-rata Kompetensi Pembelajaran
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Akumulasi nilai penguasaan materi, kejelasan penjelasan, dan kondisi belajar
              </p>
            </div>
          </div>

          <PerkembanganProgress data={learningProgress} />
        </div>
      )}

      {/* 5. Timeline / Records List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">
            Daftar Catatan Perkembangan ({filteredRecords.length})
          </h3>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs font-bold text-violet-600 hover:underline"
            >
              Reset Pencarian
            </button>
          )}
        </div>

        <div className="relative before:absolute before:left-5 before:top-3 before:bottom-3 before:w-[2px] before:bg-slate-200 dark:before:bg-slate-700 space-y-4">
          {filteredRecords.map((item, idx) => {
            const statusStyle = getStatusBadge(item.status);

            return (
              <div key={item.id || idx} className="relative pl-12">
                {/* Timeline Dot */}
                <span className={`absolute left-3.5 top-3.5 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 shadow-md ${statusStyle.dot}`} />

                <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-violet-300 dark:hover:border-violet-700 transition duration-200 space-y-3">
                  {/* Header Row */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-extrabold px-3 py-1 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-100 dark:border-violet-900/60">
                        {item.subject || 'Mata Pelajaran'}
                      </span>
                      <span className="text-xs text-slate-400 font-bold flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatTanggalIndo(item.date, { withDayName: true })}
                      </span>
                    </div>

                    <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full border ${statusStyle.badgeColor} ${statusStyle.border}`}>
                      Predikat: {item.status}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="text-base font-black text-slate-900 dark:text-slate-100">
                    {item.progress_title || 'Catatan Sesi Bimbingan'}
                  </h4>

                  {/* Metrics Subgrid if available */}
                  {(item.penguasaan != null || item.penjelasan != null || item.kondisi != null) && (
                    <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block">Penguasaan</span>
                        <span className="text-xs font-black text-violet-600 dark:text-violet-400">{item.penguasaan || 0}%</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block">Penjelasan</span>
                        <span className="text-xs font-black text-sky-600 dark:text-sky-400">{item.penjelasan || 0}%</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block">Kondisi</span>
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{item.kondisi || 0}%</span>
                      </div>
                    </div>
                  )}

                  {/* Notes / Description */}
                  {item.notes && (
                    <div className="bg-slate-50/80 dark:bg-slate-900/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
                      "{item.notes}"
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {filteredRecords.length === 0 && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-3xl p-12 text-center space-y-3 ml-12">
              <Activity className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Tidak ada catatan perkembangan belajar</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {searchQuery ? 'Tidak ada hasil yang cocok dengan kata kunci pencarian Anda.' : 'Belum ada laporan catatan perkembangan belajar yang terdaftar untuk siswa ini.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
