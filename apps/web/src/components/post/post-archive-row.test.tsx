import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PostWithCategory } from '@/types';
import { PostArchiveRow } from './post-archive-row';

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
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}));

const mockPost = {
  id: 4,
  title: '아카이브 항목',
  slug: 'archive-item',
  content: '본문',
  contentFormat: 'markdown',
  excerpt: '요약',
  thumbnailUrl: null,
  status: 'published' as const,
  views: 0,
  categoryId: 1,
  seriesId: null,
  metaTitle: null,
  category: { id: 1, name: '메모', slug: 'memo' },
  publishedAt: new Date('2024-04-01'),
  createdAt: new Date('2024-04-01'),
  updatedAt: new Date('2024-04-01'),
} as unknown as PostWithCategory;

describe('PostArchiveRow', () => {
  it('제목을 글 상세 링크로 렌더링한다', () => {
    render(<PostArchiveRow post={mockPost} />);
    expect(screen.getByRole('link', { name: '아카이브 항목' })).toHaveAttribute(
      'href',
      '/posts/archive-item'
    );
  });

  it('카테고리명을 표시한다', () => {
    render(<PostArchiveRow post={mockPost} />);
    expect(screen.getByText('메모')).toBeInTheDocument();
  });
});
