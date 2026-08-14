import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ServiceBarChartProps {
  data: any[];
}

export const ServiceBarChart: React.FC<ServiceBarChartProps> = ({ data }) => {
  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(item => {
      counts[item.mata_pelajaran] = (counts[item.mata_pelajaran] || 0) + 1;
    });
    return Object.entries(counts).map(([service, count]) => ({ service, count }));
  }, [data]);

  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="service" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#8b5cf6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
