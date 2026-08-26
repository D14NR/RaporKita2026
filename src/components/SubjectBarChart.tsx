import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { roundScore, formatScore } from '../lib/formatUtils';

interface SubjectBarChartProps {
  data: any[];
  title: string;
  xKey: string;
  yKey: string;
}

export const SubjectBarChart: React.FC<SubjectBarChartProps> = ({ data, title, xKey, yKey }) => {
  const chartData = useMemo(() => {
    const sums: Record<string, { total: number, count: number }> = {};
    data.forEach(item => {
      const xValue = item[xKey];
      const yValue = Number(item[yKey]);
      if (!sums[xValue]) sums[xValue] = { total: 0, count: 0 };
      sums[xValue].total += yValue;
      sums[xValue].count += 1;
    });
    return Object.entries(sums).map(([name, { total, count }]) => ({
      name,
      avg: roundScore(total / (count || 1))
    }));
  }, [data, xKey, yKey]);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
      </div>
      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip 
              formatter={(value: any) => [formatScore(value), 'Rata-rata Nilai']}
            />
            <Bar dataKey="avg" fill="#3b82f6" name="Rata-rata Nilai" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
