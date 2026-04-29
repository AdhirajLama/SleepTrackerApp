import React, { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const QUALITY_SCORE = { Poor: 1, Average: 2, Good: 3, Excellent: 4 };

const SleepChart = ({ data }) => {
  const chartData = useMemo(
    () =>
      (data || []).map((row) => ({
        ...row,
        qualityScore: QUALITY_SCORE[row.quality] ?? null,
      })),
    [data]
  );

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={chartData} margin={{ top: 20, right: 36, left: 8, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis
          yAxisId="hours"
          domain={[0, 24]}
          label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
        />
        <YAxis
          yAxisId="quality"
          orientation="right"
          domain={[1, 4]}
          ticks={[1, 2, 3, 4]}
          label={{ value: 'Quality (1–4)', angle: 90, position: 'insideRight' }}
        />
        <Tooltip
          formatter={(value, name) => {
            if (name === 'qualityScore') {
              const labels = { 1: 'Poor', 2: 'Average', 3: 'Good', 4: 'Excellent' };
              return [labels[value] != null ? `${labels[value]} (${value})` : value, 'Quality'];
            }
            return [value, name === 'hours' ? 'Hours slept' : name];
          }}
        />
        <Legend />
        <Line
          yAxisId="hours"
          type="monotone"
          dataKey="hours"
          name="Hours slept"
          stroke="#8884d8"
          dot={{ r: 4 }}
          activeDot={{ r: 8 }}
        />
        <Line
          yAxisId="quality"
          type="monotone"
          dataKey="qualityScore"
          name="Quality (1–4)"
          stroke="#82ca9d"
          dot={{ r: 4 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default SleepChart;
