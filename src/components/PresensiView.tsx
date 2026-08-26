import React, { useState, useMemo } from 'react';
import {
  ClipboardList,
  CheckCircle,
  HeartHandshake,
  AlertCircle,
  Search,
  Calendar,
  Activity,
  Award,
  CheckCircle2,
  FileText,
  Clock,
  Filter
} from 'lucide-react';
import { Attendance, Student, DataSiswa } from '../types';
import { formatTanggalIndo, parseDateSafe } from '../lib/dateUtils';
import { AttendancePieChart } from './AttendancePieChart';

interface PresensiViewProps {
  currentStudent: DataSiswa | Student | null;
  attendanceRecords: Attendance[];
  availableAttendanceMonths: { value: string; label: string }[];
  attendanceMonthFilter: string;
  setAttendanceMonthFilter: (val: string) => void;
}

export const PresensiView: React.FC<PresensiViewProps> = ({
  currentStudent,
  attendanceRecords,
  availableAttendanceMonths,
  attendanceMonthFilter,
  setAttendanceMonthFilter
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [showChart, setShowChart] = useState(true);

  const studentName = (currentStudent as DataSiswa)?.nama || (currentStudent as Student)?.name || 'Siswa';
  const studentNis = (currentStudent as DataSiswa)?.nis || (currentStudent as Student)?.id || '-';
  const studentJenjang = (currentStudent as DataSiswa)?.jenjang_studi || (currentStudent as Student)?.class || '';
  const studentKelompok = (currentStudent as DataSiswa)?.kelompok_kelas || '';

  // Stats calculation
  const stats = useMemo(() => {
    const total = attendanceRecords.length;
    if (total === 0) {
      return { hadir: 0, sakit: 0, izin: 0, alpa: 0, total: 0, attendanceRate: 0 };
    }
    const hadir = attendanceRecords.filter(r => r.status === 'Hadir').length;
    const sakit = attendanceRecords.filter(r => r.status === 'Sakit').length;
    const izin = attendanceRecords.filter(r => r.status === 'Izin').length;
    const alpa = attendanceRecords.filter(r => r.status === 'Alpa').length;
    const rate = Math.round((hadir / total) * 100);

    return { hadir, sakit, izin, alpa, total, attendanceRate: rate };
  }, [attendanceRecords]);

  // Subjects list for filter
  const subjectsList = useMemo(() => {
    const set = new Set<string>();
    attendanceRecords.forEach(r => { if (r.subject) set.add(r.subject); });
    return Array.from(set).sort();
  }, [attendanceRecords]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return attendanceRecords.filter(item => {
      const matchesStatus = selectedStatus === 'ALL' || item.status === selectedStatus;
      const matchesSubject = selectedSubject === 'ALL' || item.subject === selectedSubject;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q ||
        (item.subject && item.subject.toLowerCase().includes(q)) ||
        (item.notes && item.notes.toLowerCase().includes(q)) ||
        (item.date && item.date.toLowerCase().includes(q));
      return matchesStatus && matchesSubject && matchesQuery;
    });
  }, [attendanceRecords, selectedStatus, selectedSubject, searchQuery]);

  return (
    <div id="view-presensi-modern" className="space-y-6">
      
      {/* 1. Header Banner & Profile */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-48 h-48 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold text-emerald-200">
              <ClipboardList className="h-3.5 w-3.5 text-emerald-300" />
              Log Kehadiran & Rekap Presensi Siswa
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Riwayat Presensi KBM
            </h2>
            <p className="text-sm text-slate-300 max-w-xl font-normal leading-relaxed">
              Pemantauan kehadiran harian siswa secara real-time pada setiap sesi pembelajaran reguler maupun tambahan.
            </p>
          </div>

          {/* Quick Profile Tag */}
          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 shrink-0">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center font-black text-base text-white shadow-md">
              {studentName ? studentName.charAt(0) : 'S'}
            </div>
            <div>
              <div className="text-xs font-bold text-white leading-snug">{studentName}</div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span>NIS: {studentNis}</span>
                <span>•</span>
                <span className="text-emerald-300 font-semibold">{studentKelompok || studentJenjang || 'Reguler'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Bento Grid KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mt-6 pt-6 border-t border-white/10">
          {/* Hadir */}
          <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 flex flex-col justify-between hover:bg-white/10 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Hadir</span>
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300">
                <CheckCircle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-emerald-300">{stats.hadir}</span>
                <span className="text-[11px] text-slate-400 font-medium">Hari</span>
              </div>
              <div className="mt-1 text-[10px] text-emerald-200/80 font-medium">
                Kehadiran tervalidasi
              </div>
            </div>
          </div>

          {/* Sakit */}
          <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 flex flex-col justify-between hover:bg-white/10 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Sakit</span>
              <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-300">
                <HeartHandshake className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-sky-300">{stats.sakit}</span>
                <span className="text-[11px] text-slate-400 font-medium">Hari</span>
              </div>
              <div className="mt-1 text-[10px] text-slate-300 font-medium">
                Dengan surat keterangan
              </div>
            </div>
          </div>

          {/* Izin */}
          <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 flex flex-col justify-between hover:bg-white/10 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Izin</span>
              <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300">
                <ClipboardList className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-amber-300">{stats.izin}</span>
                <span className="text-[11px] text-slate-400 font-medium">Hari</span>
              </div>
              <div className="mt-1 text-[10px] text-slate-300 font-medium">
                Izin berhalangan
              </div>
            </div>
          </div>

          {/* Alpa */}
          <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 flex flex-col justify-between hover:bg-white/10 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Alpa / Tanpa Keterangan</span>
              <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300">
                <AlertCircle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-rose-300">{stats.alpa}</span>
                <span className="text-[11px] text-slate-400 font-medium">Hari</span>
              </div>
              <div className="mt-1 text-[10px] text-rose-200/80 font-medium">
                Tanpa keterangan resmi
              </div>
            </div>
          </div>

          {/* Rate Kehadiran */}
          <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 flex flex-col justify-between hover:bg-white/10 transition col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Rasio Kehadiran</span>
              <div className="p-1.5 rounded-lg bg-teal-500/20 text-teal-300">
                <Activity className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-teal-300">{stats.attendanceRate}%</span>
                <span className="text-[11px] text-slate-400 font-medium">Total</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-teal-400 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${stats.attendanceRate}%` }}
                />
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
            placeholder="Cari mata pelajaran, tanggal, atau catatan guru..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {availableAttendanceMonths.length > 0 && (
            <select
              value={attendanceMonthFilter}
              onChange={(e) => setAttendanceMonthFilter(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="all">Semua Bulan</option>
              {availableAttendanceMonths.map(month => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
          )}

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            <option value="ALL">Semua Status</option>
            <option value="Hadir">Hadir</option>
            <option value="Sakit">Sakit</option>
            <option value="Izin">Izin</option>
            <option value="Alpa">Alpa</option>
          </select>

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            <option value="ALL">Semua Mata Pelajaran</option>
            {subjectsList.map((sub, sIdx) => (
              <option key={sIdx} value={sub}>{sub}</option>
            ))}
          </select>

          <button
            onClick={() => setShowChart(!showChart)}
            className={`text-xs font-bold px-3 py-2.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer ${
              showChart 
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>{showChart ? 'Grafik Aktif' : 'Grafik'}</span>
          </button>
        </div>
      </div>

      {/* 4. Attendance Pie Chart Section */}
      {showChart && attendanceRecords.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs p-5 sm:p-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-700/60 mb-5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
                Grafik Komposisi Kehadiran Siswa
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Distribusi persentase kehadiran, sakit, izin, dan alpa
              </p>
            </div>
          </div>

          <AttendancePieChart data={filteredRecords} />
        </div>
      )}

      {/* 5. Records Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
              Log Presensi Detail ({filteredRecords.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Riwayat presensi harian per sesi bimbingan
            </p>
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs font-bold text-emerald-600 hover:underline"
            >
              Reset Pencarian
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700/80 text-slate-400 font-bold text-[11px] uppercase tracking-wider">
                <th className="py-4 px-6">Tanggal</th>
                <th className="py-4 px-6">Mata Pelajaran</th>
                <th className="py-4 px-6 text-center">Status Kehadiran</th>
                <th className="py-4 px-6">Catatan Guru</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 bg-white dark:bg-slate-800">
              {filteredRecords.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition duration-150">
                  <td className="py-4 px-6 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap text-xs">
                    {formatTanggalIndo(item.date, { withDayName: true })}
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                      {item.subject || 'Seluruh Kelas'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`inline-flex items-center justify-center px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${
                      item.status === 'Hadir' 
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' 
                        : item.status === 'Sakit'
                        ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800'
                        : item.status === 'Izin'
                        ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                        : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-slate-600 dark:text-slate-300 text-xs">
                    {item.notes ? (
                      <span className="italic">"{item.notes}"</span>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600 not-italic">-</span>
                    )}
                  </td>
                </tr>
              ))}

              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-full">
                        <ClipboardList className="h-8 w-8 text-slate-400" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Tidak ada data presensi</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        {searchQuery ? 'Tidak ada hasil yang cocok dengan kata kunci pencarian Anda.' : 'Belum ada catatan presensi terdaftar untuk periode ini.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
