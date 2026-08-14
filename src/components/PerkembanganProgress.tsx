import React, { useMemo } from 'react';

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

  const ProgressBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className={`text-sm font-bold ${color.replace('bg-', 'text-')}`}>{Math.round(value)}%</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2.5">
        <div className={`${color} h-2.5 rounded-full`} style={{ width: `${value}%` }}></div>
      </div>
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-1 h-6 bg-violet-500 rounded-full"></div>
        <h3 className="text-base font-bold text-slate-900">Perkembangan Belajar</h3>
      </div>
      <ProgressBar label="Rata-rata Penguasaan" value={averages.penguasaan} color="bg-violet-600" />
      <ProgressBar label="Rata-rata Penjelasan" value={averages.penjelasan} color="bg-sky-600" />
      <ProgressBar label="Rata-rata Kondisi" value={averages.kondisi} color="bg-emerald-600" />
    </div>
  );
};
