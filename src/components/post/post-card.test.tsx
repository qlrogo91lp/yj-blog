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

  it('excerpt를 렌더링한다', () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText('요약 내용')).toBeInTheDocument();
  });

  it('publishedAt을 한국어 날짜 형식으로 렌더링한다', () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText('2024년 1월 15일')).toBeInTheDocument();
  });

  it('slug를 href로 사용하는 링크를 렌더링한다', () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/posts/test-post'
    );
  });

  it('category가 null이면 badge를 렌더링하지 않는다', () => {
    render(<PostCard post={{ ...mockPost, category: null }} />);
    expect(screen.queryByText('개발')).not.toBeInTheDocument();
  });

  it('excerpt가 null이면 렌더링하지 않는다', () => {
    render(<PostCard post={{ ...mockPost, excerpt: null }} />);
    expect(screen.queryByText('요약 내용')).not.toBeInTheDocument();
  });

  it('publishedAt이 null이면 날짜를 렌더링하지 않는다', () => {
    render(<PostCard post={{ ...mockPost, publishedAt: null }} />);
    expect(screen.queryByText('2024년 1월 15일')).not.toBeInTheDocument();
  });
});
