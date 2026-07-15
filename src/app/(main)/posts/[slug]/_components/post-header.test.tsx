import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PostWithCategoryAndTags } from '@/types';
import { PostHeader } from './post-header';

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

const mockPost: PostWithCategoryAndTags = {
  id: 1,
  title: 'AI가 기획·개발·디자인의 경계를 지운다면',
  slug: 'ai-boundary',
  content: '본문',
  contentFormat: 'markdown',
  excerpt: null,
  thumbnailUrl: null,
  status: 'published',
  views: 1234,
  categoryId: 1,
  seriesId: null,
  metaTitle: null,
  metaDescription: null,
  publishedAt: new Date('2026-06-12'),
  createdAt: new Date('2026-06-12'),
  updatedAt: new Date('2026-06-12'),
  category: {
    id: 1,
    name: 'essay',
    slug: 'essay',
    description: null,
    createdAt: new Date('2026-01-01'),
  },
  tags: [
    { id: 1, name: 'ai', slug: 'ai' },
    { id: 2, name: 'essay', slug: 'essay' },
  ],
};

describe('PostHeader', () => {
  it('제목·카테고리·태그·조회수를 렌더한다', () => {
    render(<PostHeader post={mockPost} />);
    expect(screen.getByRole('heading', { name: /AI가 기획/ })).toBeInTheDocument();
    expect(screen.getByText('essay')).toBeInTheDocument();
    expect(screen.getByText('#ai')).toBeInTheDocument();
    expect(screen.getByText(/1,234/)).toBeInTheDocument();
  });

  it('목록으로 돌아가는 링크를 렌더한다', () => {
    render(<PostHeader post={mockPost} />);
    expect(screen.getByRole('link', { name: /목록으로/i })).toHaveAttribute('href', '/posts');
  });

  it('작성자명을 표시하지 않는다', () => {
    render(<PostHeader post={mockPost} />);
    expect(screen.queryByText('yjlogs')).not.toBeInTheDocument();
  });

  it('publishedAt이 null이면 구분점이 표시되지 않는다', () => {
    render(<PostHeader post={{ ...mockPost, publishedAt: null }} />);
    expect(screen.getByText(/회 조회/)).toBeInTheDocument();
    expect(screen.queryByText('·')).not.toBeInTheDocument();
  });
});
