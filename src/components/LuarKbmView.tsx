import React, { useState, useMemo } from 'react';
import {
  HeartHandshake,
  CalendarDays,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Sparkles,
  UserCheck,
  BookOpen,
  PieChart as PieChartIcon,
  GraduationCap,
  PlusCircle,
  XCircle,
  MessageSquareQuote,
  Activity,
  Layers
} from 'lucide-react';
import { DataSiswa, Student, PermintaanPelayanan, OutsideService } from '../types';
import { formatTanggalIndo } from '../lib/dateUtils';
import { ServicePieChart } from './ServicePieChart';

interface LuarKbmViewProps {
  currentStudent: DataSiswa | Student | null;
  permintaanPelayanan: PermintaanPelayanan[];
  outsideServices: OutsideService[];
  showChartLuarKbm: boolean;
  setShowChartLuarKbm: (show: boolean) => void;
  setIsBookingModalOpen: (open: boolean) => void;
  setIsOutsideServiceModalOpen: (open: boolean) => void;
}

export const LuarKbmView: React.FC<LuarKbmViewProps> = ({
  currentStudent,
  permintaanPelayanan,
  outsideServices,
  showChartLuarKbm,
  setShowChartLuarKbm,
  setIsBookingModalOpen,
  setIsOutsideServiceModalOpen
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'ALL' | 'REQUESTS' | 'COMPLETED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED'>('ALL');

  const studentName = (currentStudent as DataSiswa)?.nama || (currentStudent as Student)?.name || 'Siswa';
  const studentCabang = (currentStudent as DataSiswa)?.cabang || 'Semarang 2';
  const studentJenjang = (currentStudent as DataSiswa)?.jenjang_studi || (currentStudent as Student)?.class || 'SMA';

  // KPI calculations
  const stats = useMemo(() => {
    const totalRequests = permintaanPelayanan.length;
    let approvedCount = 0;
    let pendingCount = 0;
    let rejectedCount = 0;

    permintaanPelayanan.forEach(item => {
      const statusStr = (item.status || 'Menunggu').toLowerCase();
      if (statusStr.includes('setuju') || statusStr.includes('acc')) {
        approvedCount += 1;
      } else if (statusStr.includes('tolak') || statusStr.includes('batal')) {
        rejectedCount += 1;
      } else {
        pendingCount += 1;
      }
    });

    const totalCompleted = outsideServices.length;

    return {
      totalRequests,
      approvedCount,
      pendingCount,
      rejectedCount,
      totalCompleted
    };
  }, [permintaanPelayanan, outsideServices]);

  // Filtered Requests
  const filteredRequests = useMemo(() => {
    return permintaanPelayanan.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const mapel = (item.mata_pelajaran || '').toLowerCase();
      const teacher = (item.nama_pengajar || item.pengajar || '').toLowerCase();
      const keperluan = (item.keperluan || '').toLowerCase();
      const dateStr = (item.tanggal_pengajuan || item.tanggal || '').toLowerCase();

      const matchesSearch = !q || mapel.includes(q) || teacher.includes(q) || keperluan.includes(q) || dateStr.includes(q);
      if (!matchesSearch) return false;

      const statusStr = (item.status || 'Menunggu').toLowerCase();
      const isApproved = statusStr.includes('setuju') || statusStr.includes('acc');
      const isRejected = statusStr.includes('tolak') || statusStr.includes('batal');
      const isPending = !isApproved && !isRejected;

      if (statusFilter === 'APPROVED') return isApproved;
      if (statusFilter === 'PENDING') return isPending;
      if (statusFilter === 'REJECTED') return isRejected;

      return true;
    });
  }, [permintaanPelayanan, searchQuery, statusFilter]);

  // Filtered Completed Services
  const filteredCompleted = useMemo(() => {
    return outsideServices.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const mapel = (item.mata_pelajaran || '').toLowerCase();
      const teacher = (item.nama_pengajar || item.pengajar || '').toLowerCase();
      const materi = (item.materi_sub_bab || '').toLowerCase();
      const dateStr = (item.tanggal || '').toLowerCase();

      return !q || mapel.includes(q) || teacher.includes(q) || materi.includes(q) || dateStr.includes(q);
    });
  }, [outsideServices, searchQuery]);

  return (
    <div id="view-luar-kbm-modern" className="space-y-6">
      
      {/* 1. Header Banner & Actions */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-10 w-56 h-56 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold text-teal-200">
              <HeartHandshake className="h-3.5 w-3.5 text-teal-300" />
              Layanan Tambahan & Konsultasi Akademik
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Pelayanan di Luar KBM
            </h2>
            <p className="text-sm text-slate-300 font-normal leading-relaxed">
              Fasilitas reservasi jadwal bimbingan khusus, konseling kepribadian, pembinaan karakter, konsultasi karir, dan pencatatan presensi layanan siswa.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={() => setIsBookingModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-lg shadow-indigo-600/30 border border-indigo-400/30 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <CalendarDays className="h-4 w-4" />
              <span>+ Reservasi Jadwal</span>
            </button>
            <button
              onClick={() => setIsOutsideServiceModalOpen(true)}
              className="bg-teal-600 hover:bg-teal-500 active:scale-98 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-lg shadow-teal-600/30 border border-teal-400/30 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <HeartHandshake className="h-4 w-4" />
              <span>+ Presensi Layanan</span>
            </button>
          </div>
        </div>

        {/* 2. Bento Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-white/10">
          {/* Total Permintaan */}
          <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 hover:bg-white/10 transition">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-xs font-semibold">Total Permintaan</span>
              <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300">
                <CalendarDays className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-white">{stats.totalRequests}</span>
              <span className="text-[11px] text-slate-400 font-medium">Pengajuan</span>
            </div>
          </div>

          {/* Disetujui */}
          <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 hover:bg-white/10 transition">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-xs font-semibold">Disetujui (ACC)</span>
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300">
                <CheckCircle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-emerald-300">{stats.approvedCount}</span>
              <span className="text-[11px] text-emerald-200/80 font-medium">Jadwal</span>
            </div>
          </div>

          {/* Menunggu */}
          <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 hover:bg-white/10 transition">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-xs font-semibold">Menunggu Approval</span>
              <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-amber-300">{stats.pendingCount}</span>
              <span className="text-[11px] text-amber-200/80 font-medium">Proses</span>
            </div>
          </div>

          {/* Terlaksana */}
          <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 hover:bg-white/10 transition">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-xs font-semibold">Layanan Terlaksana</span>
              <div className="p-1.5 rounded-lg bg-teal-500/20 text-teal-300">
                <UserCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-teal-300">{stats.totalCompleted}</span>
              <span className="text-[11px] text-teal-200/80 font-medium">Sesi</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Toolbar: Search, Sub-tab Navigation & Chart Toggle */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Main Navigation Sub-tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/80 overflow-x-auto">
            <button
              onClick={() => setActiveSubTab('ALL')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'ALL'
                  ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              Semua Layanan ({stats.totalRequests + stats.totalCompleted})
            </button>
            <button
              onClick={() => setActiveSubTab('REQUESTS')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'REQUESTS'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Permintaan & Reservasi ({stats.totalRequests})
            </button>
            <button
              onClick={() => setActiveSubTab('COMPLETED')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'COMPLETED'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Riwayat Terlaksana ({stats.totalCompleted})
            </button>
          </div>

          {/* Right Action: Chart Toggle */}
          <button
            onClick={() => setShowChartLuarKbm(!showChartLuarKbm)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer border ${
              showChartLuarKbm
                ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800'
                : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            <PieChartIcon className="h-4 w-4 text-teal-500" />
            <span>{showChartLuarKbm ? 'Sembunyikan Grafik' : 'Visualisasi Grafik'}</span>
          </button>
        </div>

        {/* Filter & Search Controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-700/60">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari mata pelajaran, pengajar, keperluan, atau materi..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
            />
          </div>

          {(activeSubTab === 'ALL' || activeSubTab === 'REQUESTS') && (
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700 overflow-x-auto">
              <span className="text-[10px] font-bold text-slate-400 px-2 uppercase">Status:</span>
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  statusFilter === 'ALL' ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setStatusFilter('APPROVED')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  statusFilter === 'APPROVED' ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 shadow-xs' : 'text-slate-500 hover:text-emerald-600'
                }`}
              >
                Disetujui
              </button>
              <button
                onClick={() => setStatusFilter('PENDING')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  statusFilter === 'PENDING' ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 shadow-xs' : 'text-slate-500 hover:text-amber-600'
                }`}
              >
                Menunggu
              </button>
              <button
                onClick={() => setStatusFilter('REJECTED')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  statusFilter === 'REJECTED' ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 shadow-xs' : 'text-slate-500 hover:text-rose-600'
                }`}
              >
                Ditolak
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. Collapsible Service Pie Chart */}
      {showChartLuarKbm && (
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs transition-all animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400">
                <PieChartIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Analisis Distribusi Layanan</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Perbandingan frekuensi mata pelajaran & jenis konsultasi terlaksana</p>
              </div>
            </div>
          </div>
          <ServicePieChart data={outsideServices} />
        </div>
      )}

      {/* 5. Main Content Area */}

      {/* SECTION A: PERMINTAAN & RESERVASI JADWAL */}
      {(activeSubTab === 'ALL' || activeSubTab === 'REQUESTS') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">
                Status Permintaan & Reservasi ({filteredRequests.length})
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            {filteredRequests.map((item, idx) => {
              const statusStr = (item.status || 'Menunggu').toLowerCase();
              const isApproved = statusStr.includes('setuju') || statusStr.includes('acc');
              const isRejected = statusStr.includes('tolak') || statusStr.includes('batal');
              const bookingDate = item.tanggal_pengajuan || item.tanggal || '';
              const bookingTeacher = item.nama_pengajar || item.pengajar || 'Pengajar';

              return (
                <div
                  key={item.id || idx}
                  className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 p-5 rounded-3xl shadow-xs hover:shadow-md transition duration-200 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 text-[10px] font-black uppercase px-3 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800">
                          {item.mata_pelajaran}
                        </span>
                        {bookingDate && (
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            Rencana: {formatTanggalIndo(bookingDate, { withDayName: true })}
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                        {item.keperluan || 'Pengajuan Jadwal Bimbingan / Konsultasi'}
                      </h4>

                      <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400 flex-wrap">
                        <span>Pengajar Diharapkan: <strong className="text-slate-800 dark:text-slate-200">{bookingTeacher}</strong></span>
                        {item.cabang && (
                          <>
                            <span>•</span>
                            <span>Cabang: <strong className="text-slate-800 dark:text-slate-200">{item.cabang}</strong></span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0 self-start">
                      {isApproved ? (
                        <span className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-black px-3.5 py-1.5 rounded-xl inline-flex items-center gap-1.5 shadow-2xs">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          Disetujui
                        </span>
                      ) : isRejected ? (
                        <span className="bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[11px] font-black px-3.5 py-1.5 rounded-xl inline-flex items-center gap-1.5">
                          <XCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                          Ditolak
                        </span>
                      ) : (
                        <span className="bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-black px-3.5 py-1.5 rounded-xl inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 animate-spin text-amber-600 dark:text-amber-400" />
                          Menunggu Approval
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Approved Schedule Box */}
                  {(item.tanggal_disetujui || item.jam_disetujui) && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/80 rounded-2xl text-xs text-emerald-900 dark:text-emerald-200 font-bold flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 shrink-0">
                        <CheckCircle className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-black text-emerald-700 dark:text-emerald-400 block mb-0.5">JADWAL FINAL DISETUJUI</span>
                        <span>
                          Tanggal: <strong>{formatTanggalIndo(item.tanggal_disetujui || bookingDate || item.tanggal || '', { withDayName: true })}</strong>
                          {item.jam_disetujui && ` • Waktu: ${item.jam_disetujui} WIB`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredRequests.length === 0 && (
              <div className="py-12 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-3xl text-center p-6 space-y-3">
                <div className="p-3.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 mx-auto w-fit">
                  <CalendarDays className="h-7 w-7" />
                </div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Tidak Ada Permintaan Layanan</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  {searchQuery ? 'Tidak ada permintaan yang sesuai pencarian Anda.' : 'Belum ada pengajuan reservasi layanan bimbingan atau konsultasi.'}
                </p>
                <button
                  onClick={() => setIsBookingModalOpen(true)}
                  className="mt-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  Buat Reservasi Baru
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION B: RIWAYAT LAYANAN TERLAKSANA */}
      {(activeSubTab === 'ALL' || activeSubTab === 'COMPLETED') && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">
                Riwayat Layanan Terlaksana ({filteredCompleted.length})
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            {filteredCompleted.map((item, idx) => (
              <div
                key={item.id || idx}
                className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 p-5 rounded-3xl shadow-xs hover:shadow-md transition duration-200 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 text-[10px] font-black uppercase px-3 py-1 rounded-lg border border-teal-200 dark:border-teal-800">
                        {item.mata_pelajaran || 'Layanan Luar KBM'}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                        {formatTanggalIndo(item.tanggal, { withDayName: true })}
                      </span>
                      {item.durasi && (
                        <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1">
                          <Clock className="h-3 w-3 text-slate-400" />
                          {item.durasi}
                        </span>
                      )}
                    </div>

                    {item.materi_sub_bab && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-700/60 flex items-start gap-2.5">
                        <MessageSquareQuote className="h-4 w-4 text-teal-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed italic">
                          "{item.materi_sub_bab}"
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400 flex-wrap">
                      <span>Pengajar / Petugas: <strong className="text-slate-800 dark:text-slate-200">{item.nama_pengajar || item.pengajar || '-'}</strong></span>
                      {item.cabang && (
                        <>
                          <span>•</span>
                          <span>Cabang: <strong className="text-slate-800 dark:text-slate-200">{item.cabang}</strong></span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 self-start">
                    <span className="bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-[10px] font-black px-3 py-1.5 rounded-xl inline-flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-sky-500" />
                      Terlaksana
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {filteredCompleted.length === 0 && (
              <div className="py-12 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-3xl text-center p-6 space-y-3">
                <div className="p-3.5 rounded-full bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 mx-auto w-fit">
                  <HeartHandshake className="h-7 w-7" />
                </div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Belum Ada Riwayat Layanan Terlaksana</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  {searchQuery ? 'Tidak ada riwayat yang sesuai pencarian Anda.' : 'Pencatatan presensi atau bimbingan luar KBM yang telah selesai akan tampil di sini.'}
                </p>
                <button
                  onClick={() => setIsOutsideServiceModalOpen(true)}
                  className="mt-2 text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  Isi Presensi Layanan
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
