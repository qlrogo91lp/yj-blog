import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PostWithCategory } from '@/types';
import { postColumns } from './columns';

vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

const base = {
  id: 1,
  title: '글 제목',
  slug: 'my-post',
  content: '',
  contentFormat: 'html',
  excerpt: null,
  thumbnailUrl: null,
  status: 'published',
  views: 0,
  categoryId: null,
  seriesId: null,
  metaTitle: null,
  metaDescription: null,
  publishedAt: new Date('2026-01-01'),
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  category: null,
} as unknown as PostWithCategory;

function renderTitleCell(post: PostWithCategory) {
  const column = postColumns[0];
  const cell = column.cell as (ctx: { getValue: () => unknown; row: { original: PostWithCategory } }) => React.ReactNode;
  render(<>{cell({ getValue: () => post.title, row: { original: post } })}</>);
}

describe('postColumns 제목 셀', () => {
  it('발행 글은 공개 페이지로 링크한다', () => {
    renderTitleCell(base);
    expect(screen.getByRole('link', { name: '글 제목' })).toHaveAttribute('href', '/posts/my-post');
  });

  it('draft 글은 편집 페이지로 링크한다', () => {
    renderTitleCell({ ...base, status: 'draft' });
    expect(screen.getByRole('link', { name: '글 제목' })).toHaveAttribute('href', '/admin/posts/1/edit');
  });

  it('제목이 비어 있으면 "(제목 없음)"으로 표시한다', () => {
    renderTitleCell({ ...base, title: '', status: 'draft' });
    expect(screen.getByRole('link', { name: '(제목 없음)' })).toBeInTheDocument();
  });
});
