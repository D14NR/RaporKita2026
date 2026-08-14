import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface GradeTrendChartProps {
  data: any[];
  xKey: string;
  yKey: string;
  seriesKey: string;
}

export const GradeTrendChart: React.FC<GradeTrendChartProps> = ({ data, xKey, yKey, seriesKey }) => {
  const chartData = useMemo(() => {
    // Group by xKey
    const grouped: Record<string, any> = {};
    
    data.forEach(item => {
      const xValue = item[xKey];
      if (!grouped[xValue]) {
        grouped[xValue] = { [xKey]: xValue };
      }
      grouped[xValue][item[seriesKey]] = item[yKey];
    });

    return Object.values(grouped).sort((a, b) => new Date(a[xKey]).getTime() - new Date(b[xKey]).getTime());
  }, [data, xKey, yKey, seriesKey]);

  const series = useMemo(() => Array.from(new Set(data.map(item => item[seriesKey]))), [data, seriesKey]);
  const colors = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899'];

  if (data.length === 0) return <div className="text-center py-10 text-slate-500 text-xs">Belum ada data untuk ditampilkan.</div>;

  return (
    <div className="h-80 w-full bg-slate-50 p-4 rounded-xl">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey={xKey} tick={{ fontSize: 10 }} />
          <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} />
          <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '12px' }} />
          <Legend wrapperStyle={{ fontSize: '10px' }} />
          {series.map((s, index) => (
            <Line
              key={s}
              type="monotone"
              dataKey={s}
              name={s}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
