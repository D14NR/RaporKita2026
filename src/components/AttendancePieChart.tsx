import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface AttendancePieChartProps {
  stats: {
    hadir: number;
    izin: number;
    alpa: number;
    sakit: number;
  };
}

const COLORS = {
  'Hadir': '#10b981',
  'Izin': '#f59e0b',
  'Alpha': '#ef4444',
  'Sakit': '#8b5cf6'
};

export const AttendancePieChart: React.FC<AttendancePieChartProps> = ({ stats }) => {
  const chartData = useMemo(() => {
    return [
      { name: 'Hadir', value: stats.hadir },
      { name: 'Izin', value: stats.izin },
      { name: 'Alpha', value: stats.alpa },
      { name: 'Sakit', value: stats.sakit }
    ].filter(item => item.value > 0);
  }, [stats]);

  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#ccc'} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
