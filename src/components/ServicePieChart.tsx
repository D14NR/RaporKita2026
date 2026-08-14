import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ServicePieChartProps {
  data: any[];
}

const COLORS = ['#10b981', '#f59e0b', '#8b5cf6', '#0ea5e9'];

export const ServicePieChart: React.FC<ServicePieChartProps> = ({ data }) => {
  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(item => {
      const subject = item.mata_pelajaran || 'Umum';
      counts[subject] = (counts[subject] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [data]);

  const total = chartData.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-1 h-6 bg-emerald-500 rounded-full"></div>
        <h3 className="text-base font-bold text-slate-900">Distribusi Durasi per Mapel</h3>
      </div>
      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => [`${value} layanan`, 'Jumlah']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
