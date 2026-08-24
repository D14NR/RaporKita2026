import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle, FileText, ChevronRight, Volume2, VolumeX, Sparkles, X } from 'lucide-react';
import { RegularSchedule, AdditionalSchedule, DataSiswa } from '../types';
import { getScheduleTimeStatus, ScheduleTimeStatus } from '../lib/dateUtils';

interface ActiveScheduleAlertProps {
  regularSchedules: RegularSchedule[];
  additionalSchedules: AdditionalSchedule[];
  currentStudent: DataSiswa | null;
  onOpenLeaveModal: (scheduleData?: {
    subject?: string;
    date?: string;
    time?: string;
    teacher?: string;
    kelas?: string;
  }) => void;
  onNavigateTab: (tab: string) => void;
}

export const ActiveScheduleAlert: React.FC<ActiveScheduleAlertProps> = ({
  regularSchedules,
  additionalSchedules,
  currentStudent,
  onOpenLeaveModal,
  onNavigateTab,
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [alertTriggered, setAlertTriggered] = useState<boolean>(false);

  // Live timer tick every 1 second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Combine schedules
  const allSchedules = [
    ...regularSchedules.map(s => ({ ...s, isKhusus: false })),
    ...additionalSchedules.map(s => ({ ...s, isKhusus: true }))
  ];

  // Calculate time status for each schedule
  const activeSchedules: { item: typeof allSchedules[0]; status: ScheduleTimeStatus }[] = [];
  const upcomingSchedules: { item: typeof allSchedules[0]; status: ScheduleTimeStatus }[] = [];

  const effectiveMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

  allSchedules.forEach(item => {
    const status = getScheduleTimeStatus(item, effectiveMinutes);
    if (status.isActiveNow) {
      activeSchedules.push({ item, status });
    } else if (status.isUpcomingSoon) {
      upcomingSchedules.push({ item, status });
    }
  });

  // Sound chime trigger when active schedule detected
  useEffect(() => {
    if (activeSchedules.length > 0 && !alertTriggered && soundEnabled) {
      setAlertTriggered(true);
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3); // A5
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
      } catch (e) {
        // AudioContext disabled or blocked by browser policy
      }
    } else if (activeSchedules.length === 0) {
      setAlertTriggered(false);
    }
  }, [activeSchedules.length, alertTriggered, soundEnabled]);

  // If user dismissed, show compact status
  if (isDismissed) {
    return (
      <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          <span>Alert Jadwal Di-minimize ({activeSchedules.length} KBM Aktif)</span>
        </div>
        <button
          onClick={() => setIsDismissed(false)}
          className="text-sky-600 dark:text-sky-400 font-bold hover:underline cursor-pointer"
        >
          Tampilkan Alert
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Live Time Bar */}
      <div className="flex items-center justify-between gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-2xl text-xs shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 font-mono bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-700">
            <Clock className="h-3.5 w-3.5 text-sky-400 animate-pulse" />
            <span className="font-bold text-sky-300">
              {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
            </span>
          </div>
          <span className="text-slate-400 text-[11px] hidden sm:inline">
            Status Waktu Realtime Dashboard
          </span>
        </div>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer flex items-center gap-1.5 text-[11px]"
          title={soundEnabled ? "Audio Alert Aktif" : "Audio Alert Muted"}
        >
          {soundEnabled ? <Volume2 className="h-3.5 w-3.5 text-emerald-400" /> : <VolumeX className="h-3.5 w-3.5 text-slate-500" />}
          <span className="hidden sm:inline text-slate-400">{soundEnabled ? 'Suara Aktif' : 'Mute'}</span>
        </button>
      </div>

      {/* ACTIVE SCHEDULE BANNERS */}
      {activeSchedules.length > 0 ? (
        activeSchedules.map(({ item, status }, idx) => {
          const totalDuration = (status.endMin || 0) - (status.startMin || 0);
          const elapsed = totalDuration - status.minutesRemaining;
          const progressPercent = totalDuration > 0 ? Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100))) : 50;

          return (
            <div
              key={`active-${idx}`}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-700 text-white p-5 shadow-lg shadow-emerald-500/10 border border-emerald-400/30 animate-in fade-in slide-in-from-top-3 duration-300"
            >
              {/* Background ambient pattern */}
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-start justify-between gap-4 relative z-10">
                <div className="flex-1 min-w-0">
                  {/* Badge */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 bg-emerald-500/30 backdrop-blur-md text-emerald-100 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-300/40 uppercase tracking-wider">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-300"></span>
                      </span>
                      LIVE • KBM Sedang Berlangsung Saat Ini
                    </span>

                    {item.isKhusus && (
                      <span className="bg-indigo-500/30 backdrop-blur-md text-indigo-100 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-300/30">
                        Kelas Khusus
                      </span>
                    )}
                  </div>

                  {/* Title & Teacher */}
                  <h3 className="text-lg sm:text-xl font-black text-white leading-tight drop-shadow-xs">
                    {item.subject}
                  </h3>
                  <p className="text-xs text-emerald-100/90 font-medium mt-1 flex items-center gap-2">
                    <span>Pengajar: <strong className="text-white">{item.teacher || 'Tim Akademik'}</strong></span>
                    {item.kelas && (
                      <>
                        <span>•</span>
                        <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold text-white">
                          Kelas {item.kelas}
                        </span>
                      </>
                    )}
                  </p>

                  {/* Time & Remaining minutes */}
                  <div className="mt-3 flex items-center gap-3 text-xs flex-wrap">
                    <div className="bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-1.5 font-mono font-bold">
                      <Clock className="h-3.5 w-3.5 text-emerald-300" />
                      <span>{item.time_start} - {item.time_end} WIB</span>
                    </div>

                    <div className="bg-amber-400/20 backdrop-blur-sm text-amber-200 px-3 py-1.5 rounded-xl border border-amber-300/30 font-extrabold flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-spin-slow" />
                      <span>Sisa Waktu: {status.minutesRemaining} Menit</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3.5 max-w-md">
                    <div className="flex justify-between text-[10px] font-bold text-emerald-100/80 mb-1">
                      <span>Progres Waktu KBM</span>
                      <span>{progressPercent}% Terlewati</span>
                    </div>
                    <div className="w-full bg-black/20 rounded-full h-2 overflow-hidden p-0.5 border border-white/10">
                      <div
                        className="bg-gradient-to-r from-emerald-300 to-sky-300 h-full rounded-full transition-all duration-500 shadow-xs"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Top Action buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setIsDismissed(true)}
                    className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
                    title="Sembunyikan Alert"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Action buttons footer */}
              <div className="mt-4 pt-3.5 border-t border-white/15 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] text-emerald-100/80 italic">
                  *Silakan hadir di kelas atau kumpulkan izin jika berhalangan.
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenLeaveModal({
                      subject: item.subject,
                      date: item.tanggal || undefined,
                      time: `${item.time_start} - ${item.time_end}`,
                      teacher: item.teacher,
                      kelas: item.kelas || currentStudent?.kelompok_kelas
                    })}
                    className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-black text-xs px-3.5 py-2 rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <FileText className="h-3.5 w-3.5 text-slate-900" />
                    Permohonan Izin / Sakit
                  </button>

                  <button
                    onClick={() => onNavigateTab(item.isKhusus ? 'kbm-tambahan' : 'kbm-reguler')}
                    className="bg-white/20 hover:bg-white/30 text-white font-bold text-xs px-3.5 py-2 rounded-xl backdrop-blur-md border border-white/20 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Detail Jadwal</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })
      ) : upcomingSchedules.length > 0 ? (
        upcomingSchedules.map(({ item, status }, idx) => (
          <div
            key={`upcoming-${idx}`}
            className="rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white p-4 shadow-md border border-amber-300/30 animate-in fade-in slide-in-from-top-2"
          >
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2.5 rounded-xl shrink-0">
                  <AlertTriangle className="h-5 w-5 text-amber-100" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black bg-black/20 text-amber-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Mulai Dalam {status.minutesUntilStart} Menit
                    </span>
                    <span className="text-xs font-extrabold text-white">{item.time_start} WIB</span>
                  </div>
                  <h4 className="text-sm font-black text-white mt-0.5">
                    {item.subject} <span className="font-normal text-amber-100">({item.teacher})</span>
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenLeaveModal({
                    subject: item.subject,
                    date: item.tanggal || undefined,
                    time: `${item.time_start} - ${item.time_end}`,
                    teacher: item.teacher,
                    kelas: item.kelas || currentStudent?.kelompok_kelas
                  })}
                  className="bg-white text-slate-900 hover:bg-amber-50 font-black text-xs px-3 py-1.5 rounded-xl transition cursor-pointer"
                >
                  Izin / Sakit
                </button>
                <button
                  onClick={() => onNavigateTab(item.isKhusus ? 'kbm-tambahan' : 'kbm-reguler')}
                  className="bg-black/20 hover:bg-black/30 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition cursor-pointer"
                >
                  Lihat Jadwal
                </button>
              </div>
            </div>
          </div>
        ))
      ) : (
        /* No active KBM schedule right now */
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2.5">
            <div className="bg-sky-50 dark:bg-sky-950/60 p-2 rounded-xl text-sky-600 dark:text-sky-400 shrink-0">
              <CheckCircle className="h-4 w-4" />
            </div>
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-200">
                Tidak ada KBM yang berlangsung saat ini
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Sistem otomatis memberikan alert saat jam KBM dimulai.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
