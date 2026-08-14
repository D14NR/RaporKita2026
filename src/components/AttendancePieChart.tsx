import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface AttendancePieChartProps {
  data: any[];
}

const COLORS = {
  'Hadir': '#10b981',
  'Izin': '#f59e0b',
  'Alpha': '#ef4444',
  'Sakit': '#8b5cf6'
};

export const AttendancePieChart: React.FC<AttendancePieChartProps> = ({ data }) => {
  const chartData = useMemo(() => {
    const counts: Record<string, number> = { 'Hadir': 0, 'Izin': 0, 'Alpha': 0, 'Sakit': 0 };
    data.forEach(item => {
      if (counts.hasOwnProperty(item.status)) {
        counts[item.status]++;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [data]);

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
