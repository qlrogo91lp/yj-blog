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

type ChartDatum = {
  date: string;
  views: number;
  visitors: number;
  previousViews?: number;
  previousVisitors?: number;
};

type Props = {
  data: ChartDatum[];
  /** 직전 기간 계열을 함께 그린다. 기본 false. */
  showPrevious?: boolean;
};

const VIEWS_COLOR = '#ef4444'; // red-500
const VISITORS_COLOR = '#a1a1aa'; // zinc-400
const PREVIOUS_COLOR = '#d4d4d8'; // zinc-300 — 직전 기간은 흐린 점선

type ChartDataPoint = {
  date: string;
  views: number;
  visitors: number;
  label: string;
  previousViews?: number;
  previousVisitors?: number;
};

export function buildChartData(data: ChartDatum[], showPrevious: boolean): ChartDataPoint[] {
  return data.map((d) => {
    const base = {
      date: d.date,
      views: d.views,
      visitors: d.visitors,
      label: format(parseISO(d.date), 'M/d'),
    };

    if (!showPrevious) return base;

    return {
      ...base,
      previousViews: d.previousViews ?? 0,
      previousVisitors: d.previousVisitors ?? 0,
    };
  });
}

export function StatsChart({ data, showPrevious = false }: Props) {
  const chartData = buildChartData(data, showPrevious);

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={400}>
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
          {showPrevious && (
            <>
              <Line
                type="monotone"
                dataKey="previousViews"
                name="직전 기간 조회수"
                stroke={PREVIOUS_COLOR}
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
                activeDot={false}
              />
              <Line
                type="monotone"
                dataKey="previousVisitors"
                name="직전 기간 방문자"
                stroke={PREVIOUS_COLOR}
                strokeWidth={1}
                strokeDasharray="2 4"
                dot={false}
                activeDot={false}
              />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
