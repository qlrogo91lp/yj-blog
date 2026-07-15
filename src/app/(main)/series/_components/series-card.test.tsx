import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { SeriesWithMeta } from '@/types';
import { SeriesCard } from './series-card';

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

vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    className,
  }: {
    src: string;
    alt: string;
    className?: string;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} />
  ),
}));

const baseSeries: SeriesWithMeta = {
  id: 1,
  name: 'Ralli 개발기',
  slug: 'ralli-dev',
  description: 'Ralli 앱을 만들며 기록한 개발 일지',
  createdAt: new Date('2026-07-01'),
  postCount: 3,
  thumbnailUrl: 'https://example.com/thumb.jpg',
  lastPublishedAt: new Date('2026-07-10'),
};

describe('SeriesCard', () => {
  it('이름·설명·글 수·업데이트일을 렌더링하고 상세로 링크한다', () => {
    render(<SeriesCard series={baseSeries} />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/series/ralli-dev');
    expect(screen.getByText('Ralli 개발기')).toBeInTheDocument();
    expect(
      screen.getByText('Ralli 앱을 만들며 기록한 개발 일지')
    ).toBeInTheDocument();
    expect(screen.getByText(/3개의 글/)).toBeInTheDocument();
    expect(screen.getByText(/2026년 7월 10일 업데이트/)).toBeInTheDocument();
  });

  it('썸네일이 있으면 이미지를 렌더링한다', () => {
    render(<SeriesCard series={baseSeries} />);
    expect(screen.getByRole('img', { name: 'Ralli 개발기' })).toHaveAttribute(
      'src',
      'https://example.com/thumb.jpg'
    );
  });

  it('썸네일이 없으면 이미지 없이 텍스트 카드로 렌더링한다', () => {
    render(<SeriesCard series={{ ...baseSeries, thumbnailUrl: null }} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('Ralli 개발기')).toBeInTheDocument();
  });

  it('설명이 없으면 설명 영역을 렌더링하지 않는다', () => {
    render(<SeriesCard series={{ ...baseSeries, description: null }} />);
    expect(
      screen.queryByText('Ralli 앱을 만들며 기록한 개발 일지')
    ).not.toBeInTheDocument();
  });
});
