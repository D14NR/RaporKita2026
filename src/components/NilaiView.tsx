import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Award,
  TrendingUp,
  BarChart3,
  Search,
  Calendar,
  User,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  LayoutGrid,
  List,
  Sparkles,
  Target,
  FileSpreadsheet,
  Layers,
  Flame,
  ArrowUpRight,
  School
} from 'lucide-react';
import { NilaiEvaluasi, NilaiStandar, NilaiSnbtUtbk, Student, DataSiswa } from '../types';
import { formatTanggalIndo, parseDateSafe } from '../lib/dateUtils';
import { formatScore, roundScore } from '../lib/formatUtils';
import { SubjectBarChart } from './SubjectBarChart';
import { GradeRadarChart } from './GradeRadarChart';

interface NilaiViewProps {
  currentStudent: DataSiswa | Student | null;
  nilaiEvaluasi: NilaiEvaluasi[];
  nilaiStandar: NilaiStandar[];
  nilaiSnbtUtbk: NilaiSnbtUtbk[];
  groupedSnbt: Array<{
    tanggal: string;
    jenis_tes: string;
    subjects: { [key: string]: number };
    total: number;
    rerata: number;
  }>;
}

export const NilaiView: React.FC<NilaiViewProps> = ({
  currentStudent,
  nilaiEvaluasi,
  nilaiStandar,
  nilaiSnbtUtbk,
  groupedSnbt
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'evaluasi' | 'standar' | 'snbt'>('evaluasi');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'score_desc' | 'score_asc'>('date_desc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showCharts, setShowCharts] = useState(true);
  const [chartType, setChartType] = useState<'bar' | 'radar'>('bar');

  // Stats for Evaluasi Harian
  const evaluasiStats = useMemo(() => {
    const scores = nilaiEvaluasi.map(e => Number(e.nilai)).filter(n => !isNaN(n) && n > 0);
    if (scores.length === 0) return { average: 0, highest: 0, lowest: 0, totalTests: 0, tuntasCount: 0, tuntasRate: 0, topSubject: '-' };
    const total = scores.reduce((acc, curr) => acc + curr, 0);
    const avg = roundScore(total / scores.length);
    const highest = roundScore(Math.max(...scores));
    const lowest = roundScore(Math.min(...scores));
    const tuntas = scores.filter(s => s >= 75).length;
    const rate = Math.round((tuntas / scores.length) * 100);

    const subjectMap: Record<string, { total: number; count: number }> = {};
    nilaiEvaluasi.forEach(e => {
      if (e.mata_pelajaran && e.nilai != null) {
        if (!subjectMap[e.mata_pelajaran]) subjectMap[e.mata_pelajaran] = { total: 0, count: 0 };
        subjectMap[e.mata_pelajaran].total += Number(e.nilai);
        subjectMap[e.mata_pelajaran].count += 1;
      }
    });
    let topSub = '-';
    let maxAvg = 0;
    Object.entries(subjectMap).forEach(([sub, data]) => {
      const subAvg = data.total / (data.count || 1);
      if (subAvg > maxAvg) { maxAvg = subAvg; topSub = sub; }
    });

    return { average: avg, highest, lowest, totalTests: scores.length, tuntasCount: tuntas, tuntasRate: rate, topSubject: topSub };
  }, [nilaiEvaluasi]);

  // Stats for Nilai Standar
  const standarStats = useMemo(() => {
    const scores = nilaiStandar.map(s => Number(s.nilai)).filter(n => !isNaN(n) && n > 0);
    if (scores.length === 0) return { average: 0, highest: 0, lowest: 0, totalTests: 0, tuntasCount: 0, tuntasRate: 0, topSubject: '-' };
    const total = scores.reduce((acc, curr) => acc + curr, 0);
    const avg = roundScore(total / scores.length);
    const highest = roundScore(Math.max(...scores));
    const lowest = roundScore(Math.min(...scores));
    const tuntas = scores.filter(s => s >= 75).length;
    const rate = Math.round((tuntas / scores.length) * 100);

    const subjectMap: Record<string, { total: number; count: number }> = {};
    nilaiStandar.forEach(s => {
      if (s.mata_pelajaran && s.nilai != null) {
        if (!subjectMap[s.mata_pelajaran]) subjectMap[s.mata_pelajaran] = { total: 0, count: 0 };
        subjectMap[s.mata_pelajaran].total += Number(s.nilai);
        subjectMap[s.mata_pelajaran].count += 1;
      }
    });
    let topSub = '-';
    let maxAvg = 0;
    Object.entries(subjectMap).forEach(([sub, data]) => {
      const subAvg = data.total / (data.count || 1);
      if (subAvg > maxAvg) { maxAvg = subAvg; topSub = sub; }
    });

    return { average: avg, highest, lowest, totalTests: scores.length, tuntasCount: tuntas, tuntasRate: rate, topSubject: topSub };
  }, [nilaiStandar]);

  // Stats for SNBT / UTBK
  const snbtStats = useMemo(() => {
    const reratas = groupedSnbt.map(g => g.rerata).filter(n => !isNaN(n) && n > 0);
    if (reratas.length === 0) return { average: 0, highest: 0, lowest: 0, totalTests: 0, tuntasCount: 0, tuntasRate: 0, topSubject: '-' };
    const total = reratas.reduce((acc, curr) => acc + curr, 0);
    const avg = roundScore(total / reratas.length);
    const highest = roundScore(Math.max(...reratas));
    const lowest = roundScore(Math.min(...reratas));
    const tuntas = reratas.filter(s => s >= 600).length;
    const rate = Math.round((tuntas / reratas.length) * 100);

    return { average: avg, highest, lowest, totalTests: groupedSnbt.length, tuntasCount: tuntas, tuntasRate: rate, topSubject: 'UTBK SNBT' };
  }, [groupedSnbt]);

  const stats = activeSubTab === 'evaluasi' 
    ? evaluasiStats 
    : activeSubTab === 'standar' 
    ? standarStats 
    : snbtStats;

  // List of unique subjects for filter
  const subjectsList = useMemo(() => {
    const set = new Set<string>();
    nilaiEvaluasi.forEach(e => { if (e.mata_pelajaran) set.add(e.mata_pelajaran); });
    nilaiStandar.forEach(s => { if (s.mata_pelajaran) set.add(s.mata_pelajaran); });
    return Array.from(set).sort();
  }, [nilaiEvaluasi, nilaiStandar]);

  // Filtered & Sorted Nilai Evaluasi
  const filteredEvaluasi = useMemo(() => {
    return nilaiEvaluasi
      .filter(item => {
        const matchesSubject = selectedSubject === 'ALL' || item.mata_pelajaran === selectedSubject;
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery = !q || 
          (item.mata_pelajaran && item.mata_pelajaran.toLowerCase().includes(q)) ||
          (item.sub_bab_kode_soal && item.sub_bab_kode_soal.toLowerCase().includes(q)) ||
          (item.sub_bab && item.sub_bab.toLowerCase().includes(q)) ||
          (item.nama_pengajar && item.nama_pengajar.toLowerCase().includes(q)) ||
          (item.kode_pengajar && item.kode_pengajar.toLowerCase().includes(q)) ||
          (item.cabang && item.cabang.toLowerCase().includes(q));
        return matchesSubject && matchesQuery;
      })
      .sort((a, b) => {
        const dateA = parseDateSafe(a.tanggal)?.getTime() || 0;
        const dateB = parseDateSafe(b.tanggal)?.getTime() || 0;
        const scoreA = Number(a.nilai) || 0;
        const scoreB = Number(b.nilai) || 0;

        if (sortBy === 'date_desc') return dateB - dateA;
        if (sortBy === 'date_asc') return dateA - dateB;
        if (sortBy === 'score_desc') return scoreB - scoreA;
        if (sortBy === 'score_asc') return scoreA - scoreB;
        return 0;
      });
  }, [nilaiEvaluasi, selectedSubject, searchQuery, sortBy]);

  // Filtered & Sorted Nilai Standar
  const filteredStandar = useMemo(() => {
    return nilaiStandar
      .filter(item => {
        const matchesSubject = selectedSubject === 'ALL' || item.mata_pelajaran === selectedSubject;
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery = !q ||
          (item.mata_pelajaran && item.mata_pelajaran.toLowerCase().includes(q)) ||
          (item.jenis_tes && item.jenis_tes.toLowerCase().includes(q)) ||
          (item.cabang && item.cabang.toLowerCase().includes(q));
        return matchesSubject && matchesQuery;
      })
      .sort((a, b) => {
        const dateA = parseDateSafe(a.tanggal)?.getTime() || 0;
        const dateB = parseDateSafe(b.tanggal)?.getTime() || 0;
        const scoreA = Number(a.nilai) || 0;
        const scoreB = Number(b.nilai) || 0;

        if (sortBy === 'date_desc') return dateB - dateA;
        if (sortBy === 'date_asc') return dateA - dateB;
        if (sortBy === 'score_desc') return scoreB - scoreA;
        if (sortBy === 'score_asc') return scoreA - scoreB;
        return 0;
      });
  }, [nilaiStandar, selectedSubject, searchQuery, sortBy]);

  // Filtered SNBT
  const filteredSnbt = useMemo(() => {
    return groupedSnbt.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return item.jenis_tes.toLowerCase().includes(q) ||
        Object.keys(item.subjects).some(s => s.toLowerCase().includes(q));
    });
  }, [groupedSnbt, searchQuery]);

  // Helper for score grade badge styling
  const getScoreBadge = (scoreNum: number) => {
    if (scoreNum >= 90) {
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950/40',
        text: 'text-emerald-700 dark:text-emerald-400',
        border: 'border-emerald-200 dark:border-emerald-800/80',
        badge: 'Sangat Memuaskan',
        badgeColor: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
      };
    }
    if (scoreNum >= 80) {
      return {
        bg: 'bg-sky-50 dark:bg-sky-950/40',
        text: 'text-sky-700 dark:text-sky-400',
        border: 'border-sky-200 dark:border-sky-800/80',
        badge: 'Baik Sekali',
        badgeColor: 'bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300'
      };
    }
    if (scoreNum >= 75) {
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/40',
        text: 'text-amber-700 dark:text-amber-400',
        border: 'border-amber-200 dark:border-amber-800/80',
        badge: 'Tuntas KKM',
        badgeColor: 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300'
      };
    }
    return {
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      text: 'text-rose-700 dark:text-rose-400',
      border: 'border-rose-200 dark:border-rose-800/80',
      badge: 'Perlu Remedial',
      badgeColor: 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300'
    };
  };

  const studentName = (currentStudent as DataSiswa)?.nama || (currentStudent as Student)?.name || 'Siswa';
  const studentNis = (currentStudent as DataSiswa)?.nis || (currentStudent as Student)?.id || '-';
  const studentJenjang = (currentStudent as DataSiswa)?.jenjang_studi || (currentStudent as Student)?.class || '';
  const studentKelompok = (currentStudent as DataSiswa)?.kelompok_kelas || '';

  const isSma = ['1 SMA', '2 SMA', '3 SMA'].includes(studentJenjang);

  return (
    <div id="view-nilai-modern" className="space-y-6">
      
      {/* 1. Header Banner & Student Academic Profile */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-48 h-48 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold text-sky-200">
              <GraduationCap className="h-3.5 w-3.5 text-sky-300" />
              Laporan Hasil Belajar & Evaluasi
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Riwayat Nilai Akademik
            </h2>
            <p className="text-sm text-slate-300 max-w-xl font-normal leading-relaxed">
              Pantau perkembangan nilai evaluasi harian, ujian periodik bulanan, dan simulasi SNBT UTBK secara komprehensif.
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
                <span>NIS: {studentNis}</span>
                <span>•</span>
                <span className="text-sky-300 font-semibold">{studentKelompok || studentJenjang || 'Reguler'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Key Performance Indicators (Bento Grid) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-white/10">
          {/* Card 1: Rata-rata */}
          <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 flex flex-col justify-between hover:bg-white/10 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Rerata Nilai</span>
              <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-300">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-white">{formatScore(stats.average)}</span>
                <span className="text-[11px] text-slate-400 font-medium">/ 100</span>
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-300 font-medium">
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${stats.average >= 75 ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                <span>{stats.average >= 75 ? 'Di atas standar KKM (550)' : 'Perlu bimbingan KKM'}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Nilai Tertinggi */}
          <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 flex flex-col justify-between hover:bg-white/10 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Nilai Tertinggi</span>
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300">
                <Award className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-emerald-300">{formatScore(stats.highest)}</span>
                <span className="text-[11px] text-emerald-200/70 font-medium">Pencapaian Max</span>
              </div>
              <div className="mt-1 text-[10px] text-slate-300 font-medium truncate">
                Mapel Unggulan: <strong className="text-white font-bold">{stats.topSubject}</strong>
              </div>
            </div>
          </div>

          {/* Card 3: Tingkat Ketuntasan */}
          <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 flex flex-col justify-between hover:bg-white/10 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                {activeSubTab === 'snbt' ? 'Target Skor (≥600)' : 'Ketuntasan (≥75)'}
              </span>
              <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300">
                <Target className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-amber-300">{stats.tuntasRate}%</span>
                <span className="text-[11px] text-slate-400 font-medium">({stats.tuntasCount}/{stats.totalTests})</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-amber-400 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${stats.tuntasRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 4: Total Ujian / Sesi */}
          <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 flex flex-col justify-between hover:bg-white/10 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Total Evaluasi</span>
              <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300">
                <Layers className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-white">{stats.totalTests}</span>
                <span className="text-[11px] text-slate-400 font-medium">Entri Tercatat</span>
              </div>
              <div className="mt-1 text-[10px] text-slate-300 font-medium">
                Terendah: <strong className="text-rose-300 font-bold">{formatScore(stats.lowest)}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Navigation Sub-Tabs Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-2 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          <button
            id="btn-subtab-evaluasi"
            onClick={() => setActiveSubTab('evaluasi')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
              activeSubTab === 'evaluasi'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Evaluasi Belajar (Harian)</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
              activeSubTab === 'evaluasi' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {nilaiEvaluasi.length}
            </span>
          </button>

          <button
            id="btn-subtab-standar"
            onClick={() => setActiveSubTab('standar')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
              activeSubTab === 'standar'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
            }`}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Nilai Standar / Bulanan</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
              activeSubTab === 'standar' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {nilaiStandar.length}
            </span>
          </button>

          {isSma && (
            <button
              id="btn-subtab-snbt"
              onClick={() => setActiveSubTab('snbt')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
                activeSubTab === 'snbt'
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
              }`}
            >
              <Flame className="h-3.5 w-3.5" />
              <span>Simulasi UTBK / SNBT</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                activeSubTab === 'snbt' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                {groupedSnbt.length}
              </span>
            </button>
          )}
        </div>

        {/* Quick View Controls */}
        <div className="flex items-center gap-2 justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-700">
          <button
            onClick={() => setShowCharts(!showCharts)}
            className={`text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer ${
              showCharts 
                ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80' 
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>{showCharts ? 'Grafik Aktif' : 'Tampilkan Grafik'}</span>
          </button>

          {activeSubTab !== 'snbt' && (
            <div className="flex items-center bg-slate-100 dark:bg-slate-700 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  viewMode === 'grid' 
                    ? 'bg-white dark:bg-slate-800 text-sky-600 shadow-2xs' 
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
                title="Tampilan Grid Kartu"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  viewMode === 'table' 
                    ? 'bg-white dark:bg-slate-800 text-sky-600 shadow-2xs' 
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
                title="Tampilan Tabel Kompak"
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. Filter & Search Toolbar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari mata pelajaran, materi, kode soal, pengajar..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
          />
        </div>

        {/* Subject Filter & Sort Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          {activeSubTab !== 'snbt' && (
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            >
              <option value="ALL">Semua Mata Pelajaran</option>
              {subjectsList.map((sub, sIdx) => (
                <option key={sIdx} value={sub}>{sub}</option>
              ))}
            </select>
          )}

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          >
            <option value="date_desc">Tanggal: Terbaru</option>
            <option value="date_asc">Tanggal: Terlama</option>
            <option value="score_desc">Nilai: Tertinggi</option>
            <option value="score_asc">Nilai: Terendah</option>
          </select>
        </div>
      </div>

      {/* 5. Interactive Analytics Charts Section */}
      {showCharts && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700/60 gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400">
                <BarChart3 className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
                  Visualisasi Distribusi & Penguasaan Materi
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Analisis perbandingan capaian rerata per subjek pelajaran
                </p>
              </div>
            </div>

            {activeSubTab !== 'snbt' && (
              <div className="flex items-center bg-slate-100 dark:bg-slate-700/60 p-1 rounded-xl self-start sm:self-auto">
                <button
                  onClick={() => setChartType('bar')}
                  className={`px-3 py-1 text-[11px] font-extrabold rounded-lg transition cursor-pointer ${
                    chartType === 'bar'
                      ? 'bg-white dark:bg-slate-800 text-sky-600 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  Diagram Batang
                </button>
                <button
                  onClick={() => setChartType('radar')}
                  className={`px-3 py-1 text-[11px] font-extrabold rounded-lg transition cursor-pointer ${
                    chartType === 'radar'
                      ? 'bg-white dark:bg-slate-800 text-sky-600 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  Radar Kompetensi
                </button>
              </div>
            )}
          </div>

          <div className="pt-2">
            {activeSubTab === 'evaluasi' && (
              chartType === 'bar' ? (
                <SubjectBarChart
                  data={filteredEvaluasi}
                  title="Rata-rata Nilai per Mata Pelajaran (Evaluasi Belajar)"
                  xKey="mata_pelajaran"
                  yKey="nilai"
                />
              ) : (
                <GradeRadarChart data={filteredEvaluasi} />
              )
            )}

            {activeSubTab === 'standar' && (
              chartType === 'bar' ? (
                <SubjectBarChart
                  data={filteredStandar}
                  title="Rata-rata Nilai per Mata Pelajaran (Nilai Standar/Bulanan)"
                  xKey="mata_pelajaran"
                  yKey="nilai"
                />
              ) : (
                <GradeRadarChart data={filteredStandar} />
              )
            )}

            {activeSubTab === 'snbt' && (
              <SubjectBarChart
                data={filteredSnbt.map(r => ({ mata_pelajaran: r.jenis_tes, nilai: r.rerata }))}
                title="Rata-rata Nilai per Sesi Simulasi UTBK / SNBT"
                xKey="mata_pelajaran"
                yKey="nilai"
              />
            )}
          </div>
        </div>
      )}

      {/* 6. CONTENT SUB-TAB 1: EVALUASI BELAJAR (HARIAN) */}
      {activeSubTab === 'evaluasi' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">
              Daftar Evaluasi Belajar Sub-Bab ({filteredEvaluasi.length})
            </h3>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs font-bold text-sky-600 hover:underline"
              >
                Reset Pencarian
              </button>
            )}
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredEvaluasi.map((item, idx) => {
                const numScore = Number(item.nilai) || 0;
                const badgeStyle = getScoreBadge(numScore);

                return (
                  <div
                    key={item.id || idx}
                    className="group relative bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:shadow-md hover:border-sky-300 dark:hover:border-sky-700 transition duration-200 flex flex-col justify-between"
                  >
                    {/* Top Row: Meta Tags & Date */}
                    <div>
                      <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/80 px-2.5 py-1 rounded-lg">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            {formatTanggalIndo(item.tanggal)}
                          </span>
                          {item.cabang && (
                            <span className="text-[10px] font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded-md border border-sky-100 dark:border-sky-900/50">
                              {item.cabang}
                            </span>
                          )}
                        </div>

                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${badgeStyle.badgeColor} ${badgeStyle.border}`}>
                          {badgeStyle.badge}
                        </span>
                      </div>

                      {/* Subject & Sub-topic */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-base font-black text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition">
                            {item.mata_pelajaran || 'Mata Pelajaran'}
                          </h4>
                          {item.jenjang_studi && (
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md">
                              {item.jenjang_studi}
                            </span>
                          )}
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
                          <div className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                            <span className="text-slate-400 font-semibold">Materi / Soal: </span>
                            <strong className="text-slate-900 dark:text-slate-100 font-bold">{item.sub_bab_kode_soal || item.sub_bab || 'Evaluasi Pembelajaran'}</strong>
                          </div>
                          {(item.nama_pengajar || item.kode_pengajar) && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <User className="h-3 w-3 text-slate-400" />
                              <span>Pengajar: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{item.nama_pengajar || '-'}{item.kode_pengajar ? ` (${item.kode_pengajar})` : ''}</strong></span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Score Card Footer */}
                    <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase">Skor Perolehan:</span>
                        <div className="w-16 bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${numScore >= 75 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                            style={{ width: `${Math.min(100, Math.max(0, numScore))}%` }}
                          />
                        </div>
                      </div>

                      <div className={`flex items-baseline gap-1 px-3.5 py-1.5 rounded-xl border font-black ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border} shadow-2xs`}>
                        <span className="text-xl leading-none">{formatScore(item.nilai)}</span>
                        <span className="text-[10px] opacity-70 font-semibold">/ 100</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredEvaluasi.length === 0 && (
                <div className="col-span-full bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-3xl p-12 text-center space-y-3">
                  <BookOpen className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Tidak ada data evaluasi belajar</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    {searchQuery ? 'Tidak ada hasil yang cocok dengan kata kunci pencarian Anda.' : 'Belum ada catatan nilai evaluasi belajar harian untuk siswa ini.'}
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Table View */
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-xs font-black uppercase text-slate-400 tracking-wider">
                      <th className="py-3.5 px-4">Tanggal</th>
                      <th className="py-3.5 px-4">Mata Pelajaran</th>
                      <th className="py-3.5 px-4">Materi / Sub-Bab</th>
                      <th className="py-3.5 px-4">Tutor</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-right">Nilai</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs font-medium">
                    {filteredEvaluasi.map((item, idx) => {
                      const numScore = Number(item.nilai) || 0;
                      const badgeStyle = getScoreBadge(numScore);

                      return (
                        <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-750 transition">
                          <td className="py-3.5 px-4 font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {formatTanggalIndo(item.tanggal)}
                          </td>
                          <td className="py-3.5 px-4 font-black text-slate-900 dark:text-slate-100">
                            {item.mata_pelajaran}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                            {item.sub_bab_kode_soal || item.sub_bab || '-'}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {item.nama_pengajar || item.kode_pengajar || '-'}
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${badgeStyle.badgeColor}`}>
                              {badgeStyle.badge}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap font-black">
                            <span className={`inline-block px-2.5 py-1 rounded-lg ${badgeStyle.bg} ${badgeStyle.text} border ${badgeStyle.border}`}>
                              {formatScore(item.nilai)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 7. CONTENT SUB-TAB 2: NILAI STANDAR / BULANAN */}
      {activeSubTab === 'standar' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">
              Rekapitulasi Nilai Standar & Bulanan ({filteredStandar.length})
            </h3>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Ujian Berkala & Penilaian Rapor</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Penilaian Penilaian Tengah Semester (PTS), Akhir Semester (PAS), dan Tes Bulanan</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-xs font-black uppercase text-slate-400 tracking-wider">
                    <th className="py-3.5 px-5">Tanggal</th>
                    <th className="py-3.5 px-5">Mata Pelajaran</th>
                    <th className="py-3.5 px-5">Jenis Evaluasi / Ujian</th>
                    <th className="py-3.5 px-5 text-center">Tingkat Capaian</th>
                    <th className="py-3.5 px-5 text-right">Nilai Akhir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs font-medium">
                  {filteredStandar.map((item, idx) => {
                    const numScore = Number(item.nilai) || 0;
                    const badgeStyle = getScoreBadge(numScore);

                    return (
                      <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-750 transition">
                        <td className="py-4 px-5 font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {formatTanggalIndo(item.tanggal)}
                        </td>
                        <td className="py-4 px-5 font-black text-slate-900 dark:text-slate-100 text-sm">
                          {item.mata_pelajaran}
                        </td>
                        <td className="py-4 px-5 whitespace-nowrap">
                          <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/80 px-2.5 py-1 rounded-lg text-xs font-black">
                            {item.jenis_tes}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${badgeStyle.badgeColor}`}>
                              {badgeStyle.badge}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-5 text-right whitespace-nowrap">
                          <span className={`inline-block text-base font-black px-3 py-1 rounded-xl ${badgeStyle.bg} ${badgeStyle.text} border ${badgeStyle.border} shadow-2xs`}>
                            {formatScore(item.nilai)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredStandar.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500 dark:text-slate-400 italic">
                        Belum ada data nilai standar atau nilai bulanan terdaftar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 8. CONTENT SUB-TAB 3: SIMULASI UTBK / SNBT */}
      {activeSubTab === 'snbt' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">
              Hasil Try Out & Simulasi UTBK SNBT ({filteredSnbt.length})
            </h3>
          </div>

          {filteredSnbt.map((item, idx) => {
            const subCount = Object.keys(item.subjects).length;

            return (
              <div
                key={idx}
                className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm p-5 sm:p-7 space-y-6 hover:border-slate-300 transition"
              >
                {/* Header of UTBK Card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-700/80 pb-5 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[10px] font-black uppercase px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <Flame className="h-3 w-3 text-rose-500" />
                        SNBT - UTBK
                      </span>
                      <span className="text-xs text-slate-400 font-bold flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatTanggalIndo(item.tanggal)}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                      {item.jenis_tes}
                    </h3>
                  </div>

                  {/* Summary Scores Pill */}
                  <div className="flex items-center gap-3">
                    <div className="text-center bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-800/80 p-3 rounded-2xl min-w-[100px]">
                      <span className="text-[10px] font-extrabold text-sky-600 dark:text-sky-400 uppercase tracking-wider block">Rata-rata</span>
                      <div className="text-xl font-black text-sky-800 dark:text-sky-200 mt-0.5">{formatScore(item.rerata)}</div>
                    </div>
                    <div className="text-center bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/80 p-3 rounded-2xl min-w-[100px]">
                      <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Skor Total</span>
                      <div className="text-xl font-black text-emerald-800 dark:text-emerald-200 mt-0.5">{formatScore(item.total)}</div>
                    </div>
                  </div>
                </div>

                {/* Subtests Breakdown */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                      Rincian Sub-Tes Potensi Kognitif & Literasi
                    </h4>
                    <span className="text-[11px] font-bold text-slate-500">{subCount} Sub-tes</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                    {subCount > 0 ? (
                      Object.entries(item.subjects).map(([subject, score], sIdx) => {
                        const parsed = Number(score) || 0;
                        const isHigh = parsed >= 600 || parsed >= 75;

                        return (
                          <div
                            key={sIdx}
                            className="bg-slate-50 dark:bg-slate-900/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-center flex flex-col justify-between hover:bg-slate-100/70 transition"
                          >
                            <div className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase leading-snug line-clamp-2 h-7" title={subject}>
                              {subject}
                            </div>
                            <div className={`text-base font-black mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 ${
                              isHigh ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'
                            }`}>
                              {formatScore(score)}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="col-span-full text-center text-slate-400 text-xs italic py-4">
                        Belum ada rincian sub-tes untuk simulasi ini.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredSnbt.length === 0 && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-3xl p-12 text-center space-y-3">
              <Flame className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Belum ada riwayat hasil simulasi UTBK</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Hasil Try Out dan simulasi UTBK SNBT siswa akan otomatis muncul di sini setelah pelaksanaan tes.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
