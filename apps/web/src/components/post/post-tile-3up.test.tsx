import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PostWithCategory } from '@/types';
import { PostTile3up } from './post-tile-3up';

vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

const mockPost = {
  id: 2,
  title: '세 번째 카드',
  slug: 'third-card',
  content: '본문',
  contentFormat: 'markdown',
  excerpt: null,
  thumbnailUrl: null,
  status: 'published' as const,
  views: 0,
  categoryId: null,
  seriesId: null,
  metaTitle: null,
  category: null,
  publishedAt: new Date('2024-02-20'),
  createdAt: new Date('2024-02-20'),
  updatedAt: new Date('2024-02-20'),
} as unknown as PostWithCategory;

describe('PostTile3up', () => {
  it('제목을 글 상세 링크로 렌더링한다', () => {
    render(<PostTile3up post={mockPost} />);
    expect(screen.getByRole('link', { name: '세 번째 카드' })).toHaveAttribute('href', '/posts/third-card');
  });
});
