import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PostWithCategory } from '@/types';
import { PostTile2up } from './post-tile-2up';

vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

const mockPost = {
  id: 1,
  title: '테스트 글 제목',
  slug: 'test-post',
  content: '본문',
  contentFormat: 'markdown',
  excerpt: '요약',
  thumbnailUrl: 'https://example.com/t.jpg',
  status: 'published' as const,
  views: 0,
  categoryId: 1,
  seriesId: null,
  metaTitle: null,
  category: { id: 1, name: '개발', slug: 'dev' },
  publishedAt: new Date('2024-01-15'),
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
} as unknown as PostWithCategory;

describe('PostTile2up', () => {
  it('제목을 글 상세 링크로 렌더링한다', () => {
    render(<PostTile2up post={mockPost} />);
    const link = screen.getByRole('link', { name: '테스트 글 제목' });
    expect(link).toHaveAttribute('href', '/posts/test-post');
  });

  it('카테고리를 렌더링한다', () => {
    render(<PostTile2up post={mockPost} />);
    expect(screen.getByRole('link', { name: '개발' })).toHaveAttribute('href', '/categories/dev');
  });

  it('썸네일 alt에 제목을 사용한다', () => {
    render(<PostTile2up post={mockPost} />);
    expect(screen.getByAltText('테스트 글 제목')).toBeInTheDocument();
  });
});
