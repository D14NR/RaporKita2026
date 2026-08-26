import React, { useMemo } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { roundScore, formatScore } from '../lib/formatUtils';

interface GradeRadarChartProps {
  data: any[];
}

export const GradeRadarChart: React.FC<GradeRadarChartProps> = ({ data }) => {
  const chartData = useMemo(() => {
    const averages: Record<string, { total: number, count: number }> = {};
    data.forEach(item => {
      if (!averages[item.mata_pelajaran]) averages[item.mata_pelajaran] = { total: 0, count: 0 };
      averages[item.mata_pelajaran].total += Number(item.nilai) || 0;
      averages[item.mata_pelajaran].count += 1;
    });
    return Object.entries(averages).map(([subject, { total, count }]) => ({
      subject,
      avg: roundScore(total / (count || 1))
    }));
  }, [data]);

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" />
          <PolarRadiusAxis angle={30} domain={[0, 100]} />
          <Radar name="Nilai" dataKey="avg" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
          <Tooltip formatter={(value: any) => [formatScore(value), 'Rata-rata']} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
