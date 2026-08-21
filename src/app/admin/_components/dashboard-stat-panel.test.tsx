import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DashboardStatPanel } from './dashboard-stat-panel';

vi.mock('./stats-chart', () => ({
  StatsChart: ({ showPrevious }: { showPrevious?: boolean }) => (
    <div data-testid="chart">{showPrevious ? 'with-previous' : 'plain'}</div>
  ),
}));

const props = {
  visitors: 1842,
  views: 3104,
  externalCount: 179,
  previousVisitors: 1644,
  daily: [{ date: '2026-08-15', views: 10, visitors: 5, previousViews: 8, previousVisitors: 4 }],
};

describe('DashboardStatPanel', () => {
  it('방문·페이지뷰·외부 유입 3지표를 렌더한다', () => {
    render(<DashboardStatPanel {...props} />);

    expect(screen.getByText('방문')).toBeInTheDocument();
    expect(screen.getByText('1,842')).toBeInTheDocument();
    expect(screen.getByText('페이지뷰')).toBeInTheDocument();
    expect(screen.getByText('3,104')).toBeInTheDocument();
    expect(screen.getByText('외부 유입')).toBeInTheDocument();
    expect(screen.getByText('179')).toBeInTheDocument();
  });

  it('방문에 직전 기간 대비 증감을 표시한다', () => {
    render(<DashboardStatPanel {...props} />);
    expect(screen.getByText('+12%')).toBeInTheDocument();
  });

  it('직전 기간 계열을 켠 차트를 렌더한다', () => {
    render(<DashboardStatPanel {...props} />);
    expect(screen.getByTestId('chart')).toHaveTextContent('with-previous');
  });

  it('데이터가 없으면 안내 문구를 보여준다', () => {
    render(<DashboardStatPanel {...props} daily={[]} />);
    expect(screen.getByText(/아직 통계 데이터가 없습니다/)).toBeInTheDocument();
  });
});
