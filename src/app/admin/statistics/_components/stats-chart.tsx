'use client';

import { format, parseISO } from 'date-fns';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type Props = {
  data: { date: string; views: number; visitors: number }[];
};

const VIEWS_COLOR = '#ef4444'; // red-500
const VISITORS_COLOR = '#a1a1aa'; // zinc-400

export function StatsChart({ data }: Props) {
  const chartData = data.map((d) => ({
    ...d,
    label: format(parseISO(d.date), 'M/d'),
  }));

  return (
    <div className="h-100 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 12, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: 13,
            }}
            labelFormatter={(label) => label}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ fontSize: 13 }}
          />
          <Line
            type="monotone"
            dataKey="views"
            name="일간 조회수"
            stroke={VIEWS_COLOR}
            strokeWidth={2}
            dot={{ r: 3, fill: VIEWS_COLOR }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="visitors"
            name="일간 방문자"
            stroke={VISITORS_COLOR}
            strokeWidth={2}
            dot={{ r: 3, fill: VISITORS_COLOR }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
