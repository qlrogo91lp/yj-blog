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
  /** 카드 배경 톤. 어두운 패널(예: bg-sidebar) 위에서는 'dark'로 그린다. 기본 'light'. */
  tone?: 'light' | 'dark';
};

const VIEWS_COLOR = '#ef4444'; // red-500

const CHROME_COLORS = {
  light: {
    grid: '#e5e7eb', // gray-200
    axisLine: '#e5e7eb', // gray-200
    tick: '#9ca3af', // gray-400
    tooltipBg: '#fff',
    tooltipBorder: '#e5e7eb',
    visitors: '#a1a1aa', // zinc-400
    previous: '#d4d4d8', // zinc-300 — 흰 카드 위에서 흐린 점선
  },
  dark: {
    grid: '#3f3f46', // zinc-700 — 차콜 패널 위에서 은은한 그리드
    axisLine: '#3f3f46', // zinc-700
    tick: '#a1a1aa', // zinc-400
    tooltipBg: '#27272a', // zinc-800
    tooltipBorder: '#3f3f46', // zinc-700
    visitors: '#d4d4d8', // zinc-300 — 차콜 위에서 대비를 유지
    previous: '#52525b', // zinc-600 — 현재 계열보다 어둡게 눌러 뒤로 보내야 함
  },
} as const;

type ChartDataPoint = {
  date: string;
  views: number;
  visitors: number;
  label: string;
  previousViews?: number;
  previousVisitors?: number;
};

export function buildChartData(
  data: ChartDatum[],
  showPrevious: boolean
): ChartDataPoint[] {
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

export function StatsChart({
  data,
  showPrevious = false,
  tone = 'light',
}: Props) {
  const chartData = buildChartData(data, showPrevious);
  const chrome = CHROME_COLORS[tone];

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={chrome.grid} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: chrome.tick }}
            tickLine={false}
            axisLine={{ stroke: chrome.axisLine }}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 12, fill: chrome.tick }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: chrome.tooltipBg,
              border: `1px solid ${chrome.tooltipBorder}`,
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
            stroke={chrome.visitors}
            strokeWidth={2}
            dot={{ r: 3, fill: chrome.visitors }}
            activeDot={{ r: 5 }}
          />
          {showPrevious && (
            <>
              <Line
                type="monotone"
                dataKey="previousViews"
                name="직전 기간 조회수"
                stroke={chrome.previous}
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
                activeDot={false}
              />
              <Line
                type="monotone"
                dataKey="previousVisitors"
                name="직전 기간 방문자"
                stroke={chrome.previous}
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
