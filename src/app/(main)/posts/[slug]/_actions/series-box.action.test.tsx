import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { SeriesPostItem } from '@/types';
import { SeriesBoxAction } from './series-box.action';

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

const posts: SeriesPostItem[] = [1, 2, 3].map((id) => ({
  id,
  title: `${id}화 제목`,
  slug: `post-${id}`,
  publishedAt: new Date('2026-07-01'),
}));

describe('SeriesBoxAction', () => {
  it('시리즈 이름 링크와 현재 위치(2 / 3)를 표시한다', () => {
    render(
      <SeriesBoxAction
        name="Ralli 개발기"
        slug="ralli-dev"
        posts={posts}
        currentPostId={2}
      />
    );
    expect(screen.getByRole('link', { name: 'Ralli 개발기' })).toHaveAttribute(
      'href',
      '/series/ralli-dev'
    );
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('기본은 접힌 상태 — 회차 목록이 보이지 않는다', () => {
    render(
      <SeriesBoxAction
        name="Ralli 개발기"
        slug="ralli-dev"
        posts={posts}
        currentPostId={2}
      />
    );
    expect(screen.queryByText('1화 제목')).not.toBeInTheDocument();
  });

  it('펼치면 전체 회차가 보이고, 현재 글은 링크가 아닌 하이라이트다', () => {
    render(
      <SeriesBoxAction
        name="Ralli 개발기"
        slug="ralli-dev"
        posts={posts}
        currentPostId={2}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: '목록 펼치기' }));

    expect(screen.getByRole('link', { name: '1화 제목' })).toHaveAttribute(
      'href',
      '/posts/post-1'
    );
    expect(screen.getByRole('link', { name: '3화 제목' })).toHaveAttribute(
      'href',
      '/posts/post-3'
    );
    // 현재 글은 링크가 아니다
    expect(
      screen.queryByRole('link', { name: '2화 제목' })
    ).not.toBeInTheDocument();
    expect(screen.getByText('2화 제목')).toBeInTheDocument();
  });

  it('펼친 뒤 다시 접을 수 있다', () => {
    render(
      <SeriesBoxAction
        name="Ralli 개발기"
        slug="ralli-dev"
        posts={posts}
        currentPostId={2}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: '목록 펼치기' }));
    fireEvent.click(screen.getByRole('button', { name: '목록 접기' }));
    expect(screen.queryByText('1화 제목')).not.toBeInTheDocument();
  });
});
