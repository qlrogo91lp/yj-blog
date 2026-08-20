import { describe, expect, it } from 'vitest';
import { buildChartData } from './stats-chart';

const data = [
  { date: '2026-08-15', views: 10, visitors: 5, previousViews: 8, previousVisitors: 4 },
  { date: '2026-08-16', views: 20, visitors: 9, previousViews: 12, previousVisitors: 6 },
];

describe('buildChartData', () => {
  it('날짜를 M/d 라벨로 바꾼다', () => {
    expect(buildChartData(data, false)[0].label).toBe('8/15');
  });

  it('showPrevious가 false면 직전 기간 값을 빼고 넘긴다', () => {
    const result = buildChartData(data, false);
    expect(result[0]).not.toHaveProperty('previousViews');
    expect(result[0].views).toBe(10);
  });

  it('showPrevious가 true면 직전 기간 값을 유지한다', () => {
    const result = buildChartData(data, true);
    expect(result[0].previousViews).toBe(8);
    expect(result[0].previousVisitors).toBe(4);
  });

  it('직전 기간 값이 없으면 0으로 채운다', () => {
    const result = buildChartData(
      [{ date: '2026-08-15', views: 10, visitors: 5 }],
      true
    );
    expect(result[0].previousViews).toBe(0);
    expect(result[0].previousVisitors).toBe(0);
  });
});
