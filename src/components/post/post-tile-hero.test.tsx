import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PostWithCategory } from '@/types';
import { PostTileHero } from './post-tile-hero';

vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

const mockPost = {
  id: 3,
  title: '히어로 글',
  slug: 'hero-post',
  content: '본문',
  contentFormat: 'markdown',
  excerpt: '요약',
  thumbnailUrl: 'https://example.com/hero.jpg',
  status: 'published' as const,
  views: 0,
  categoryId: 1,
  seriesId: null,
  metaTitle: null,
  metaDescription: null,
  category: { id: 1, name: '공지', slug: 'notice' },
  publishedAt: new Date('2024-03-10'),
  createdAt: new Date('2024-03-10'),
  updatedAt: new Date('2024-03-10'),
} as unknown as PostWithCategory;

describe('PostTileHero', () => {
  it('제목을 글 상세 링크로 렌더링한다', () => {
    render(<PostTileHero post={mockPost} />);
    expect(screen.getByRole('link', { name: '히어로 글' })).toHaveAttribute('href', '/posts/hero-post');
  });

  it('카테고리명을 표시한다', () => {
    render(<PostTileHero post={mockPost} />);
    expect(screen.getByText('공지')).toBeInTheDocument();
  });

  it('썸네일 alt에 제목을 사용한다', () => {
    render(<PostTileHero post={mockPost} />);
    expect(screen.getByAltText('히어로 글')).toBeInTheDocument();
  });
});
