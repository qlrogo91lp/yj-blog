import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DashboardRankList } from './dashboard-rank-list';

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const items = [
  { id: 'a', label: 'DELL S2725QC 모니터 리뷰', value: 1204 },
  { id: 'b', label: 'Next.js 15 App Router 이전기', value: 842 },
];

describe('DashboardRankList', () => {
  it('제목과 항목을 순위와 함께 렌더한다', () => {
    render(<DashboardRankList title="인기 글" items={items} moreHref="/admin/statistics" />);

    expect(screen.getByText('인기 글')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('DELL S2725QC 모니터 리뷰')).toBeInTheDocument();
    expect(screen.getByText('1,204')).toBeInTheDocument();
  });

  it('더보기 링크를 렌더한다', () => {
    render(<DashboardRankList title="인기 글" items={items} moreHref="/admin/statistics" />);
    expect(screen.getByRole('link', { name: /더보기/ })).toHaveAttribute(
      'href',
      '/admin/statistics'
    );
  });

  it('percent 모드에서는 순위 대신 퍼센트 바를 보여준다', () => {
    const { container } = render(
      <DashboardRankList
        title="유입경로"
        variant="percent"
        items={[{ id: 'g', label: '구글 검색', value: 62 }]}
        moreHref="/admin/statistics/referrers"
      />
    );

    expect(screen.getByText('62%')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="rank-bar"]')).toBeInTheDocument();
  });

  it('항목이 없으면 빈 상태를 보여준다', () => {
    render(<DashboardRankList title="인기 글" items={[]} moreHref="/admin/statistics" />);
    expect(screen.getByText('아직 데이터가 없습니다.')).toBeInTheDocument();
  });
});
