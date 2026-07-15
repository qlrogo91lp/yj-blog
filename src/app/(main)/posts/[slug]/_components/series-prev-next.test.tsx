import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { SeriesPostItem } from '@/types';
import { SeriesPrevNext } from './series-prev-next';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

const post = (id: number): SeriesPostItem => ({
  id,
  title: `${id}화 제목`,
  slug: `post-${id}`,
  publishedAt: new Date('2026-07-01'),
});

describe('SeriesPrevNext', () => {
  it('중간 화: 이전·다음 카드를 모두 렌더링한다', () => {
    render(<SeriesPrevNext prev={post(1)} next={post(3)} />);
    expect(screen.getByText('이전 글')).toBeInTheDocument();
    expect(screen.getByText('다음 글')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /1화 제목/ })).toHaveAttribute(
      'href',
      '/posts/post-1'
    );
    expect(screen.getByRole('link', { name: /3화 제목/ })).toHaveAttribute(
      'href',
      '/posts/post-3'
    );
  });

  it('첫 화: 이전 카드는 없고 다음 카드만 있다', () => {
    render(<SeriesPrevNext prev={null} next={post(2)} />);
    expect(screen.queryByText('이전 글')).not.toBeInTheDocument();
    expect(screen.getByText('다음 글')).toBeInTheDocument();
  });

  it('마지막 화: 다음 카드는 없고 이전 카드만 있다', () => {
    render(<SeriesPrevNext prev={post(6)} next={null} />);
    expect(screen.getByText('이전 글')).toBeInTheDocument();
    expect(screen.queryByText('다음 글')).not.toBeInTheDocument();
  });

  it('이전·다음이 모두 없으면 아무것도 렌더링하지 않는다', () => {
    const { container } = render(<SeriesPrevNext prev={null} next={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
