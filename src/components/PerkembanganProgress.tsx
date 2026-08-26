import React, { useMemo } from 'react';
import { Target, TrendingUp, Sparkles, Activity } from 'lucide-react';

interface PerkembanganProgressProps {
  data: any[];
}

export const PerkembanganProgress: React.FC<PerkembanganProgressProps> = ({ data }) => {
  const averages = useMemo(() => {
    if (data.length === 0) return { penguasaan: 0, penjelasan: 0, kondisi: 0 };
    
    const sums = data.reduce((acc, item) => ({
      penguasaan: acc.penguasaan + (item.penguasaan || 0),
      penjelasan: acc.penjelasan + (item.penjelasan || 0),
      kondisi: acc.kondisi + (item.kondisi || 0),
    }), { penguasaan: 0, penjelasan: 0, kondisi: 0 });

    return {
      penguasaan: sums.penguasaan / data.length,
      penjelasan: sums.penjelasan / data.length,
      kondisi: sums.kondisi / data.length,
    };
  }, [data]);

  const ProgressBar = ({ label, value, color, badgeBg }: { label: string; value: number; color: string; badgeBg: string }) => {
    const rounded = Math.round(value);
    return (
      <div className="space-y-2 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{label}</span>
          <span className={`text-xs font-black px-2.5 py-0.5 rounded-lg ${badgeBg}`}>
            {rounded}%
          </span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
          <div className={`${color} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${Math.min(100, Math.max(0, rounded))}%` }}></div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <ProgressBar 
        label="Rata-rata Penguasaan Materi" 
        value={averages.penguasaan} 
        color="bg-violet-600" 
        badgeBg="bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800"
      />
      <ProgressBar 
        label="Rata-rata Kejelasan Penjelasan" 
        value={averages.penjelasan} 
        color="bg-sky-600" 
        badgeBg="bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800"
      />
      <ProgressBar 
        label="Rata-rata Kondisi & Pemahaman" 
        value={averages.kondisi} 
        color="bg-emerald-600" 
        badgeBg="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
      />
    </div>
  );
};
