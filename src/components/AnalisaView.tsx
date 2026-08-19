import React, { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Sparkles, 
  Loader2, 
  RefreshCw, 
  Bot, 
  CheckCircle2, 
  AlertTriangle, 
  Lightbulb, 
  Search, 
  BookOpen, 
  Award, 
  TrendingUp, 
  TrendingDown,
  Target, 
  Brain,
  ShieldCheck,
  Flame,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Attendance, LearningProgress, NilaiEvaluasi, OutsideService } from '../types';

interface AnalisaViewProps {
  attendanceRecords: Attendance[];
  learningProgress: LearningProgress[];
  nilaiEvaluasi: NilaiEvaluasi[];
  outsideServices: OutsideService[];
}

interface SubjectDiagnostics {
  subject: string;
  avgGrade: number | null;
  attendanceRate: number | null;
  pAvg: number;
  jAvg: number;
  kAvg: number;
  overallMastery: number;
  progressCount: number;
  serviceCount: number;
  status: 'Unggul' | 'Stabil' | 'Perlu Perhatian';
  gradeTrend: 'Meningkat' | 'Menurun' | 'Stabil' | 'Belum Ada Data';
  kelebihan: string[];
  kekurangan: string[];
  saran: string[];
  recentGrades: NilaiEvaluasi[];
  latestProgress: LearningProgress | null;
}

export const AnalisaView: React.FC<AnalisaViewProps> = ({ 
  attendanceRecords, 
  learningProgress, 
  nilaiEvaluasi, 
  outsideServices 
}) => {
  const [recommendations, setRecommendations] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Unggul' | 'Stabil' | 'Perlu Perhatian'>('ALL');
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const response = await fetch("/api/analisa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendanceRecords, learningProgress, nilaiEvaluasi, outsideServices }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengambil analisa AI');
      }

      setRecommendations(data.recommendation || 'Tidak ada rekomendasi yang dihasilkan.');
    } catch (err: any) {
      console.error('Error fetching AI analysis:', err);
      setErrorMsg(err.message || 'Gagal memproses analisa AI. Silakan coba beberapa saat lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const analysisData = useMemo<SubjectDiagnostics[]>(() => {
    const subjects = new Set([
      ...attendanceRecords.map(r => r.subject || 'Umum'),
      ...learningProgress.map(r => r.subject),
      ...nilaiEvaluasi.map(r => r.mata_pelajaran),
      ...outsideServices.map(r => r.mata_pelajaran || 'Umum')
    ]);

    const results: SubjectDiagnostics[] = [];

    subjects.forEach(subject => {
      if (!subject || subject.trim() === '') return;

      const attendance = attendanceRecords.filter(r => (r.subject || 'Umum').toLowerCase() === subject.toLowerCase());
      const progress = learningProgress.filter(r => r.subject.toLowerCase() === subject.toLowerCase());
      const grades = nilaiEvaluasi.filter(r => r.mata_pelajaran.toLowerCase() === subject.toLowerCase());
      const services = outsideServices.filter(r => (r.mata_pelajaran || 'Umum').toLowerCase() === subject.toLowerCase());

      const avgGrade = grades.length > 0 
        ? grades.reduce((acc, curr) => acc + Number(curr.nilai), 0) / grades.length 
        : null;
      
      const attendanceRate = attendance.length > 0
        ? (attendance.filter(r => r.status === 'Hadir').length / attendance.length) * 100
        : null;

      const pAvg = progress.length > 0 ? progress.reduce((acc, curr) => acc + (curr.penguasaan || 0), 0) / progress.length : 0;
      const jAvg = progress.length > 0 ? progress.reduce((acc, curr) => acc + (curr.penjelasan || 0), 0) / progress.length : 0;
      const kAvg = progress.length > 0 ? progress.reduce((acc, curr) => acc + (curr.kondisi || 0), 0) / progress.length : 0;

      const overallMastery = progress.length > 0 ? (pAvg + jAvg + kAvg) / 3 : (avgGrade || 0);

      // Determine Status
      let status: 'Unggul' | 'Stabil' | 'Perlu Perhatian' = 'Stabil';
      if ((avgGrade !== null && avgGrade >= 85) || overallMastery >= 85) {
        status = 'Unggul';
      } else if ((avgGrade !== null && avgGrade < 70) || overallMastery < 70 || (attendanceRate !== null && attendanceRate < 75)) {
        status = 'Perlu Perhatian';
      }

      // Compute Kelebihan (Strengths)
      const kelebihan: string[] = [];
      if (attendanceRate !== null && attendanceRate >= 90) {
        kelebihan.push(`Kehadiran sangat baik (${attendanceRate.toFixed(0)}%)`);
      }
      if (avgGrade !== null && avgGrade >= 80) {
        kelebihan.push(`Nilai rata-rata evaluasi tinggi (${avgGrade.toFixed(1)})`);
      }
      if (pAvg >= 80) {
        kelebihan.push(`Tingkat penguasaan materi sangat baik (${pAvg.toFixed(0)}%)`);
      }
      if (services.length > 0) {
        kelebihan.push(`Aktif mengikuti ${services.length} sesi Layanan Luar KBM/Konsultasi`);
      }
      if (kelebihan.length === 0) {
        kelebihan.push('Secara konsisten mengikuti kegiatan belajar mengajar');
      }

      // Compute Kekurangan (Weaknesses)
      const kekurangan: string[] = [];
      if (attendanceRate !== null && attendanceRate < 80) {
        kekurangan.push(`Tingkat kehadiran perlu ditingkatkan (${attendanceRate.toFixed(0)}%)`);
      }
      if (avgGrade !== null && avgGrade < 75) {
        kekurangan.push(`Rata-rata nilai evaluasi masih di bawah target (${avgGrade.toFixed(1)})`);
      }
      if (pAvg > 0 && pAvg < 70) {
        kekurangan.push(`Penguasaan konsep dasar perlu diperdalam (${pAvg.toFixed(0)}%)`);
      }
      if (kAvg > 0 && kAvg < 70) {
        kekurangan.push(`Kondisi fokus dan keaktifan saat KBM perlu ditingkatkan`);
      }
      if (kekurangan.length === 0) {
        kekurangan.push('Perlu menjaga kestabilan performa agar tidak mengalami penurunan');
      }

      // Compute Saran & Recommendations
      const saran: string[] = [];
      if (avgGrade !== null && avgGrade < 75) {
        saran.push('Perbanyak latihan soal mandiri & pelajari ulang pembahasan tryout.');
      }
      if (services.length === 0 && (avgGrade === null || avgGrade < 80)) {
        saran.push('Manfaatkan fitur Layanan Luar KBM untuk konsultasi privat dengan pengajar.');
      }
      if (jAvg > 0 && jAvg < 75) {
        saran.push('Aktif bertanya saat sesi diskusi jika ada penjelasan pengajar yang kurang jelas.');
      }
      if (saran.length === 0) {
        saran.push('Pertahankan prestasi dan coba tantangan soal tingkat tinggi (HOTS).');
      }

      // Calculate Grade Trend
      let gradeTrend: 'Meningkat' | 'Menurun' | 'Stabil' | 'Belum Ada Data' = 'Belum Ada Data';
      if (grades.length >= 2) {
        const sortedAsc = [...grades].sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
        const lastVal = Number(sortedAsc[sortedAsc.length - 1].nilai);
        const prevVal = Number(sortedAsc[sortedAsc.length - 2].nilai);
        if (lastVal > prevVal) gradeTrend = 'Meningkat';
        else if (lastVal < prevVal) gradeTrend = 'Menurun';
        else gradeTrend = 'Stabil';
      } else if (grades.length === 1) {
        gradeTrend = 'Stabil';
      }

      // Recent Grades
      const recentGrades = [...grades].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()).slice(0, 3);
      const latestProgress = progress.length > 0 ? progress[progress.length - 1] : null;

      results.push({
        subject,
        avgGrade,
        attendanceRate,
        pAvg,
        jAvg,
        kAvg,
        overallMastery,
        progressCount: progress.length,
        serviceCount: services.length,
        status,
        gradeTrend,
        kelebihan,
        kekurangan,
        saran,
        recentGrades,
        latestProgress
      });
    });

    // Sort: Perlu Perhatian first, then Stabil, then Unggul
    const statusOrder = { 'Perlu Perhatian': 1, 'Stabil': 2, 'Unggul': 3 };
    return results.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
  }, [attendanceRecords, learningProgress, nilaiEvaluasi, outsideServices]);

  // Filtered subjects
  const filteredAnalysis = useMemo(() => {
    return analysisData.filter(item => {
      const matchesSearch = item.subject.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [analysisData, searchQuery, statusFilter]);

  // General Summary Metrics
  const summaryMetrics = useMemo(() => {
    const totalSubjects = analysisData.length;
    const unggulCount = analysisData.filter(d => d.status === 'Unggul').length;
    const perluPerhatianCount = analysisData.filter(d => d.status === 'Perlu Perhatian').length;
    const avgOverallGrade = analysisData.reduce((acc, curr) => acc + (curr.avgGrade || 0), 0) / (analysisData.filter(d => d.avgGrade !== null).length || 1);

    return {
      totalSubjects,
      unggulCount,
      perluPerhatianCount,
      avgOverallGrade: avgOverallGrade ? avgOverallGrade.toFixed(1) : '-'
    };
  }, [analysisData]);

  return (
    <div className="space-y-8">
      {/* Top Banner Stat Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 rounded-xl shrink-0">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Total Mapel</span>
            <span className="text-lg font-black text-slate-900 dark:text-slate-100">{summaryMetrics.totalSubjects} Mapel</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Mapel Unggul</span>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{summaryMetrics.unggulCount} Mapel</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 rounded-xl shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Perlu Perhatian</span>
            <span className="text-lg font-black text-rose-600 dark:text-rose-400">{summaryMetrics.perluPerhatianCount} Mapel</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Rata-rata Nilai</span>
            <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{summaryMetrics.avgOverallGrade}</span>
          </div>
        </div>
      </div>

      {/* AI Recommendation Banner & Trigger */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs transition-colors space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-2xl shrink-0 border border-indigo-100 dark:border-indigo-800/80">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 leading-tight">
                Laporan Analisa & Rekomendasi AI Gemini
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Evaluasi mendalam per mata pelajaran, kelebihan, kekurangan, dan strategi perbaikan otomatis
              </p>
            </div>
          </div>

          <button
            onClick={fetchRecommendations}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white text-xs font-black shadow-md shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 shrink-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Sedang Menganalisa...</span>
              </>
            ) : recommendations ? (
              <>
                <RefreshCw className="h-4 w-4" />
                <span>Analisa Ulang AI</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span>Analisa dengan AI</span>
              </>
            )}
          </button>
        </div>

        {/* Content Box */}
        {isLoading ? (
          <div className="py-10 text-center space-y-3">
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Sparkles className="h-6 w-6 animate-spin" />
            </div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Gemini AI sedang menyusun analisis mendalam per mata pelajaran...
            </p>
            <p className="text-[11px] text-slate-400">Meneliti nilai, presensi, kelebihan, dan saran perbaikan</p>
          </div>
        ) : errorMsg ? (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-2xl text-xs text-rose-700 dark:text-rose-300 font-bold text-center">
            {errorMsg}
          </div>
        ) : recommendations ? (
          <div className="prose prose-slate dark:prose-invert prose-sm sm:prose-base max-w-none prose-headings:font-bold prose-p:leading-relaxed prose-li:my-1 prose-headings:text-slate-900 dark:prose-headings:text-slate-100 prose-a:text-sky-600">
            <ReactMarkdown>{recommendations}</ReactMarkdown>
          </div>
        ) : (
          <div className="py-8 px-4 bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700/80 rounded-2xl text-center space-y-2">
            <Sparkles className="h-8 w-8 text-indigo-500 mx-auto opacity-70" />
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Laporan Konsultasi AI Belum Dihasilkan
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Klik tombol <strong className="text-indigo-600 dark:text-indigo-400">"Analisa dengan AI"</strong> untuk meng-generate laporan komprehensif lengkap dengan analisa per mapel, kelebihan, kekurangan, dan saran tindakan.
            </p>
          </div>
        )}
      </div>

      {/* Interactive Per-Subject Academic Analysis Cards */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Brain className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Analisa Akademik per Mata Pelajaran
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Rincian kelebihan, kekurangan, saran perbaikan, serta statistik penguasaan materi per mapel
            </p>
          </div>

          {/* Search & Status Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder="Cari mapel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              {(['ALL', 'Unggul', 'Stabil', 'Perlu Perhatian'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                    statusFilter === st
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {st === 'ALL' ? 'Semua' : st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredAnalysis.length === 0 ? (
          <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500">
            Tidak ada data mata pelajaran yang cocok dengan kriteria pencarian/filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredAnalysis.map((data, idx) => {
              const isExpanded = expandedSubject === data.subject;

              return (
                <div 
                  key={idx} 
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs overflow-hidden transition-all duration-200 flex flex-col justify-between"
                >
                  {/* Card Header */}
                  <div className="p-5 border-b border-slate-100 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold">
                          <BookOpen className="h-5 w-5" />
                        </div>
                        <h3 className="text-base font-black text-slate-900 dark:text-slate-100">{data.subject}</h3>
                      </div>

                      {/* Status Badge */}
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase flex items-center gap-1 ${
                        data.status === 'Unggul'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : data.status === 'Perlu Perhatian'
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          : 'bg-sky-50 text-sky-700 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                      }`}>
                        {data.status === 'Unggul' && <Award className="h-3 w-3" />}
                        {data.status === 'Perlu Perhatian' && <AlertTriangle className="h-3 w-3" />}
                        {data.status === 'Stabil' && <ShieldCheck className="h-3 w-3" />}
                        {data.status}
                      </span>
                    </div>

                    {/* Stats Metric Cards */}
                    <div className="grid grid-cols-4 gap-2 text-xs pt-1">
                      <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl text-center flex flex-col justify-between">
                        <span className="block text-slate-400 font-bold text-[10px] uppercase">Rata Nilai</span>
                        <div className="flex items-center justify-center gap-1 my-0.5">
                          <span className="text-sm font-black text-slate-900 dark:text-slate-100">{data.avgGrade ? data.avgGrade.toFixed(1) : '-'}</span>
                          {data.gradeTrend === 'Meningkat' && <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />}
                          {data.gradeTrend === 'Menurun' && <TrendingDown className="h-3.5 w-3.5 text-rose-500" />}
                        </div>
                        <span className={`text-[9px] font-extrabold ${
                          data.gradeTrend === 'Meningkat' ? 'text-emerald-600 dark:text-emerald-400' : data.gradeTrend === 'Menurun' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'
                        }`}>
                          {data.gradeTrend}
                        </span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl text-center flex flex-col justify-between">
                        <span className="block text-slate-400 font-bold text-[10px] uppercase">Kehadiran</span>
                        <span className="text-sm font-black text-slate-900 dark:text-slate-100 my-0.5">{data.attendanceRate ? `${data.attendanceRate.toFixed(0)}%` : '-'}</span>
                        <span className="text-[9px] font-bold text-slate-400">Kehadiran KBM</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl text-center flex flex-col justify-between">
                        <span className="block text-slate-400 font-bold text-[10px] uppercase">Jml Progress</span>
                        <span className="text-sm font-black text-slate-900 dark:text-slate-100 my-0.5">{data.progressCount} Sesi</span>
                        <span className="text-[9px] font-bold text-slate-400">Catatan Guru</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl text-center flex flex-col justify-between">
                        <span className="block text-slate-400 font-bold text-[10px] uppercase">Layanan Luar</span>
                        <span className="text-sm font-black text-slate-900 dark:text-slate-100 my-0.5">{data.serviceCount} Sesi</span>
                        <span className="text-[9px] font-bold text-slate-400">Konsultasi</span>
                      </div>
                    </div>

                    {/* Progress Bar & Mastery */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-600 dark:text-slate-400">Tingkat Penguasaan & Pemahaman</span>
                        <span className="font-black text-indigo-600 dark:text-indigo-400">{data.overallMastery.toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 rounded-full ${
                            data.overallMastery >= 80 ? 'bg-emerald-500' : data.overallMastery >= 65 ? 'bg-indigo-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(5, data.overallMastery))}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card Body: Kelebihan, Kekurangan & Saran */}
                  <div className="p-5 space-y-4 text-xs">
                    {/* Kelebihan */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 font-black text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>Kelebihan & Keunggulan</span>
                      </div>
                      <ul className="space-y-1 pl-5 list-disc text-slate-600 dark:text-slate-300">
                        {data.kelebihan.map((item, kIdx) => (
                          <li key={kIdx}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Kekurangan */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 font-black text-amber-700 dark:text-amber-400">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span>Kekurangan & Area Perbaikan</span>
                      </div>
                      <ul className="space-y-1 pl-5 list-disc text-slate-600 dark:text-slate-300">
                        {data.kekurangan.map((item, kkIdx) => (
                          <li key={kkIdx}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Saran */}
                    <div className="space-y-1.5 bg-indigo-50/50 dark:bg-indigo-950/30 p-3 rounded-xl border border-indigo-100/80 dark:border-indigo-900/40">
                      <div className="flex items-center gap-1.5 font-black text-indigo-700 dark:text-indigo-300">
                        <Lightbulb className="h-4 w-4 text-amber-500 shrink-0" />
                        <span>Saran & Langkah Tindakan</span>
                      </div>
                      <ul className="space-y-1 pl-5 list-disc text-slate-700 dark:text-slate-200">
                        {data.saran.map((item, sIdx) => (
                          <li key={sIdx}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Expandable History Detail */}
                    {isExpanded && (
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3 animate-fadeIn">
                        {data.recentGrades.length > 0 && (
                          <div>
                            <span className="font-extrabold text-slate-500 text-[11px] block mb-1">Riwayat Evaluasi Terakhir:</span>
                            <div className="space-y-1">
                              {data.recentGrades.map((g, gIdx) => (
                                <div key={gIdx} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/40 px-2.5 py-1.5 rounded-lg text-[11px]">
                                  <span className="text-slate-600 dark:text-slate-300 font-medium">{g.sub_bab_kode_soal || 'Evaluasi'}</span>
                                  <span className="font-black text-indigo-600 dark:text-indigo-400">{g.nilai}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {data.latestProgress && (
                          <div>
                            <span className="font-extrabold text-slate-500 text-[11px] block mb-1">Catatan Perkembangan Terakhir:</span>
                            <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                              <p><strong className="text-slate-700 dark:text-slate-200">Judul Progress:</strong> {data.latestProgress.progress_title || '-'}</p>
                              {data.latestProgress.notes && (
                                <p><strong className="text-slate-700 dark:text-slate-200">Catatan Pengajar:</strong> {data.latestProgress.notes}</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Footer Toggle */}
                  <div className="p-3 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 text-center">
                    <button
                      onClick={() => setExpandedSubject(isExpanded ? null : data.subject)}
                      className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      {isExpanded ? (
                        <>
                          <span>Tutup Rincian Riwayat</span>
                          <ChevronUp className="h-3.5 w-3.5" />
                        </>
                      ) : (
                        <>
                          <span>Lihat Rincian Riwayat Evaluation</span>
                          <ChevronDown className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
