import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PostWithCategory } from '@/types';
import { RecentPostsSection } from './recent-posts-section';

vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

const base = {
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
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
};

const posts = [
  { ...base, id: 1, title: '히어로 글', slug: 'hero', publishedAt: new Date('2024-03-01') },
  { ...base, id: 2, title: '두 번째 글', slug: 'second', publishedAt: new Date('2024-02-01') },
] as unknown as PostWithCategory[];

describe('RecentPostsSection', () => {
  it('글이 없으면 빈 상태 메시지를 렌더링한다', () => {
    render(<RecentPostsSection posts={[]} />);
    expect(screen.getByText('아직 작성된 글이 없습니다.')).toBeInTheDocument();
  });

  it('첫 글(히어로)과 나머지 글 제목이 모두 보인다', () => {
    render(<RecentPostsSection posts={posts} />);
    expect(screen.getByRole('link', { name: '히어로 글' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '두 번째 글' })).toBeInTheDocument();
  });
});
