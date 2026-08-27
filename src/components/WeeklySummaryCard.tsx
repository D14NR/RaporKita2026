import React, { useMemo } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { TrendingUp, Calendar, BookOpen, ChevronRight } from 'lucide-react';
import { Attendance, LearningProgress } from '../types';
import { parseDateSafe, formatTanggalIndo } from '../lib/dateUtils';

interface WeeklySummaryCardProps {
  attendanceRecords: Attendance[];
  learningProgress: LearningProgress[];
}

export const WeeklySummaryCard: React.FC<WeeklySummaryCardProps> = ({ 
  attendanceRecords, 
  learningProgress 
}) => {
  const weeklyData = useMemo(() => {
    const data = [];
    const now = new Date();
    
    // Generate last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('id-ID', { weekday: 'short' });
      
      // Filter attendance for this day
      const dayAttendance = attendanceRecords.filter(r => {
        const rd = parseDateSafe(r.date);
        return rd && rd.toISOString().split('T')[0] === dateStr;
      });
      
      // Filter progress for this day
      const dayProgress = learningProgress.filter(p => {
        const pd = parseDateSafe(p.date);
        return pd && pd.toISOString().split('T')[0] === dateStr;
      });
      
      const avgPerformance = dayProgress.length > 0 
        ? dayProgress.reduce((acc, curr) => acc + ((curr.penguasaan || 0) + (curr.penjelasan || 0) + (curr.kondisi || 0)) / 3, 0) / dayProgress.length
        : 0;
        
      const isPresent = dayAttendance.some(r => r.status === 'Hadir');
      const attendanceScore = isPresent ? 100 : 0;

      data.push({
        date: dateStr,
        day: dayName,
        displayDate: formatTanggalIndo(d, { shortMonth: true }),
        performance: Math.round(avgPerformance),
        attendance: attendanceScore,
        count: dayAttendance.length,
        hasAttendance: dayAttendance.length > 0
      });
    }
    return data;
  }, [attendanceRecords, learningProgress]);

  const stats = useMemo(() => {
    const presentDays = weeklyData.filter(d => d.attendance > 0).length;
    const avgPerf = weeklyData.reduce((acc, curr) => acc + curr.performance, 0) / (weeklyData.filter(d => d.performance > 0).length || 1);
    
    return {
      presentDays,
      avgPerformance: Math.round(avgPerf)
    };
  }, [weeklyData]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Attendance Trend */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
              <Calendar className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Presensi 7 Hari</h4>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Konsistensi Kehadiran</p>
            </div>
          </div>
          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{stats.presentDays}/7</span>
        </div>
        
        <div className="h-24 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <Bar dataKey="attendance" radius={[4, 4, 0, 0]}>
                {weeklyData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.attendance > 0 ? '#10b981' : entry.hasAttendance ? '#f43f5e' : '#e2e8f0'} 
                    fillOpacity={entry.attendance > 0 ? 1 : 0.3}
                  />
                ))}
              </Bar>
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white dark:bg-slate-800 p-2 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl text-[10px]">
                        <p className="font-bold text-slate-900 dark:text-white">{data.displayDate}</p>
                        <p className={data.attendance > 0 ? 'text-emerald-600 font-bold' : 'text-rose-500 font-bold'}>
                          {data.attendance > 0 ? 'Hadir' : data.hasAttendance ? 'Alpha/Izin' : 'Tidak ada jadwal'}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex justify-between items-center text-[10px] text-slate-400 font-medium">
          <span>7 Hari Terakhir</span>
          <span className="flex items-center gap-1 text-emerald-600">
            Terjaga <ChevronRight className="h-3 w-3" />
          </span>
        </div>
      </div>

      {/* Learning Performance Trend */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group col-span-1 md:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl">
              <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Tren Belajar</h4>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Perkembangan Kompetensi</p>
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">{stats.avgPerformance}%</span>
            <span className="text-[10px] font-bold text-slate-400">Rata-rata</span>
          </div>
        </div>

        <div className="h-24 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="colorPerf" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white dark:bg-slate-800 p-2 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl text-[10px]">
                        <p className="font-bold text-slate-900 dark:text-white">{data.displayDate}</p>
                        <p className="text-indigo-600 font-bold">Skor: {data.performance}%</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="monotone" 
                dataKey="performance" 
                stroke="#6366f1" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorPerf)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 flex justify-between items-center text-[10px] text-slate-400 font-medium">
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              <span>Aktif</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
              <span>Libur/Kosong</span>
            </div>
          </div>
          <button className="flex items-center gap-1 text-indigo-600 hover:underline">
            Detail Analisa <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
