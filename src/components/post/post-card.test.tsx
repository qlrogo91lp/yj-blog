import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PostWithCategory } from '@/types';
import { PostCard } from './post-card';

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

const mockPost: PostWithCategory = {
  id: 1,
  title: '테스트 글 제목',
  slug: 'test-post',
  content: '본문 내용',
  contentFormat: 'markdown',
  excerpt: '요약 내용',
  thumbnailUrl: null,
  status: 'published',
  views: 0,
  categoryId: 1,
  seriesId: null,
  metaTitle: null,
  metaDescription: null,
  publishedAt: new Date('2024-01-15'),
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
  category: {
    id: 1,
    name: '개발',
    slug: 'dev',
    description: null,
    createdAt: new Date('2024-01-01'),
  },
};

describe('PostCard', () => {
  it('제목을 렌더링한다', () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText('테스트 글 제목')).toBeInTheDocument();
  });

  it('카테고리 badge를 렌더링한다', () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText('개발')).toBeInTheDocument();
  });

  it('제목 링크는 /posts/[slug]로 연결된다', () => {
    render(<PostCard post={mockPost} />);
    const titleLink = screen.getByRole('link', { name: mockPost.title });
    expect(titleLink).toHaveAttribute('href', `/posts/${mockPost.slug}`);
  });

  it('카테고리 뱃지는 /categories/[slug]로 링크된다', () => {
    render(<PostCard post={mockPost} />);
    const categoryLink = screen.getByRole('link', { name: mockPost.category!.name });
    expect(categoryLink).toHaveAttribute('href', `/categories/${mockPost.category!.slug}`);
  });

  it('category가 null이면 카테고리 링크를 렌더링하지 않는다', () => {
    render(<PostCard post={{ ...mockPost, category: null }} />);
    expect(screen.queryByText('개발')).not.toBeInTheDocument();
  });

  it('publishedAt이 null이면 날짜를 렌더링하지 않는다', () => {
    render(<PostCard post={{ ...mockPost, publishedAt: null }} />);
    expect(screen.queryByText('15 Jan 2024')).not.toBeInTheDocument();
  });
});
