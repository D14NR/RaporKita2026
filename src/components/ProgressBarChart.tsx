import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ProgressBarChartProps {
  data: any[];
}

export const ProgressBarChart: React.FC<ProgressBarChartProps> = ({ data }) => {
  const chartData = useMemo(() => {
    const metrics: Record<string, { pSum: number, jSum: number, kSum: number, count: number }> = {};
    data.forEach(item => {
      const subject = item.subject;
      if (!metrics[subject]) metrics[subject] = { pSum: 0, jSum: 0, kSum: 0, count: 0 };
      metrics[subject].pSum += item.penguasaan || 0;
      metrics[subject].jSum += item.penjelasan || 0;
      metrics[subject].kSum += item.kondisi || 0;
      metrics[subject].count += 1;
    });
    return Object.entries(metrics).map(([subject, { pSum, jSum, kSum, count }]) => ({
      subject,
      penguasaan: pSum / count,
      penjelasan: jSum / count,
      kondisi: kSum / count
    }));
  }, [data]);

  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="subject" />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Legend />
          <Bar dataKey="penguasaan" fill="#0ea5e9" name="Penguasaan" />
          <Bar dataKey="penjelasan" fill="#10b981" name="Penjelasan" />
          <Bar dataKey="kondisi" fill="#f59e0b" name="Kondisi" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
