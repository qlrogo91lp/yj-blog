import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { AdminSeriesItem } from '@/types';
import { SeriesStackItem } from './series-stack-item';

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('./series-actions-cell', () => ({
  SeriesActionsCell: () => <div data-testid="series-actions" />,
}));

const series = {
  id: 1,
  name: '블로그 만들기',
  slug: 'building-blog',
  description: 'Next.js로 블로그를 처음부터 만드는 기록',
  status: 'ongoing',
  createdAt: new Date('2026-04-01'),
  posts: [
    {
      id: 11,
      title: 'Next.js 15 App Router 이전기',
      publishedAt: new Date('2026-04-14'),
      status: 'published',
    },
    {
      id: 12,
      title: '배포와 이미지 최적화',
      publishedAt: null,
      status: 'draft',
    },
  ],
} as AdminSeriesItem;

describe('SeriesStackItem', () => {
  it('이름·설명·편수를 렌더한다', () => {
    render(
      <SeriesStackItem series={series} isExpanded={false} onToggle={vi.fn()} />
    );

    expect(screen.getByText('블로그 만들기')).toBeInTheDocument();
    expect(screen.getByText(/2편/)).toBeInTheDocument();
  });

  it('연재 중 뱃지를 보여준다', () => {
    render(
      <SeriesStackItem series={series} isExpanded={false} onToggle={vi.fn()} />
    );
    expect(screen.getByText('연재 중')).toBeInTheDocument();
  });

  it('완결이면 완결 뱃지를 보여준다', () => {
    render(
      <SeriesStackItem
        series={{ ...series, status: 'completed' }}
        isExpanded={false}
        onToggle={vi.fn()}
      />
    );
    expect(screen.getByText('완결')).toBeInTheDocument();
  });

  it('접힌 상태에서는 회차 목록을 렌더하지 않는다', () => {
    render(
      <SeriesStackItem series={series} isExpanded={false} onToggle={vi.fn()} />
    );
    expect(
      screen.queryByText('Next.js 15 App Router 이전기')
    ).not.toBeInTheDocument();
  });

  it('펼친 상태에서는 회차와 글 추가 링크를 렌더한다', () => {
    render(
      <SeriesStackItem series={series} isExpanded onToggle={vi.fn()} />
    );

    expect(screen.getByText('Next.js 15 App Router 이전기')).toBeInTheDocument();
    expect(screen.getByText('임시저장')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /이 시리즈에 글 추가/ })
    ).toHaveAttribute('href', '/admin/posts/new');
  });

  it('토글 버튼을 누르면 onToggle이 호출된다', () => {
    const onToggle = vi.fn();
    render(
      <SeriesStackItem series={series} isExpanded={false} onToggle={onToggle} />
    );

    fireEvent.click(screen.getByRole('button', { name: /블로그 만들기/ }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('드래그 핸들을 렌더하지 않는다', () => {
    const { container } = render(
      <SeriesStackItem series={series} isExpanded onToggle={vi.fn()} />
    );
    expect(container.querySelector('[data-drag-handle]')).not.toBeInTheDocument();
  });
});
