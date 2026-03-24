import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PostWithCategory } from '@/types';
import { PostListViewHandler } from './post-list-view-handler';

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
    width,
    height,
    className,
  }: {
    src: string;
    alt: string;
    width: number;
    height: number;
    className?: string;
  }) => (
    <img src={src} alt={alt} width={width} height={height} className={className} />
  ),
}));

const basePost = {
  content: '내용',
  contentFormat: 'markdown',
  thumbnailUrl: null,
  status: 'published' as const,
  views: 0,
  categoryId: null,
  metaTitle: null,
  metaDescription: null,
  category: null,
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
};

const mockPosts: PostWithCategory[] = [
  {
    ...basePost,
    id: 1,
    title: '첫 번째 글',
    slug: 'first-post',
    excerpt: '요약1',
    publishedAt: new Date('2024-01-15'),
  },
  {
    ...basePost,
    id: 2,
    title: '두 번째 글',
    slug: 'second-post',
    excerpt: null,
    publishedAt: null,
  },
];

describe('PostListViewHandler', () => {
  it('posts가 빈 배열이면 빈 상태 메시지를 렌더링한다', () => {
    render(<PostListViewHandler posts={[]} viewType="card" />);
    expect(screen.getByText('아직 작성된 글이 없습니다.')).toBeInTheDocument();
  });

  it('viewType이 card이면 모든 글 제목이 보인다', () => {
    render(<PostListViewHandler posts={mockPosts} viewType="card" />);
    expect(screen.getByText('첫 번째 글')).toBeInTheDocument();
    expect(screen.getByText('두 번째 글')).toBeInTheDocument();
  });

  it('viewType이 list이면 모든 글 제목이 보인다', () => {
    render(<PostListViewHandler posts={mockPosts} viewType="list" />);
    expect(screen.getByText('첫 번째 글')).toBeInTheDocument();
    expect(screen.getByText('두 번째 글')).toBeInTheDocument();
  });

  it('viewType이 card이면 그리드 레이아웃으로 렌더링한다', () => {
    const { container } = render(
      <PostListViewHandler posts={mockPosts} viewType="card" />
    );
    expect(container.querySelector('.grid')).toBeInTheDocument();
  });

  it('viewType이 list이면 flex 컬럼 레이아웃으로 렌더링한다', () => {
    const { container } = render(
      <PostListViewHandler posts={mockPosts} viewType="list" />
    );
    expect(container.querySelector('.flex.flex-col')).toBeInTheDocument();
  });
});
