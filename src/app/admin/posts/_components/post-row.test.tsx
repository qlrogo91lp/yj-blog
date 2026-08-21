import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { AdminPostRow } from '@/types';
import { PostRow } from './post-row';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

vi.mock('../_actions/post-status-toggle.action', () => ({
  PostStatusToggleAction: ({ status }: { status: string }) => (
    <div data-testid="status-toggle">{status}</div>
  ),
}));

vi.mock('../_actions/post-actions-cell.action', () => ({
  PostActionsCellAction: () => <div data-testid="post-actions" />,
}));

const publishedPost = {
  id: 1,
  title: 'DELL S2725QC 모니터 리뷰',
  slug: 'dell-s2725qc',
  content: '본문',
  contentFormat: 'html',
  excerpt: '4K 27인치 USB-C 모니터를 두 달 써보고 남기는 기록.',
  thumbnailUrl: 'https://example.com/thumb.jpg',
  status: 'published',
  views: 1204,
  categoryId: 1,
  seriesId: null,
  metaTitle: null,
  metaDescription: null,
  publishedAt: new Date('2026-04-20'),
  createdAt: new Date('2026-04-20'),
  updatedAt: new Date('2026-04-20'),
  category: {
    id: 1,
    name: '리뷰',
    slug: 'review',
    description: null,
    createdAt: new Date(),
  },
  commentCount: 3,
  tagNames: ['4k모니터', 'dell'],
} as unknown as AdminPostRow;

const draftPost = {
  ...publishedPost,
  id: 2,
  title: '키보드 배열 바꾸고 3개월',
  status: 'draft',
  thumbnailUrl: null,
  publishedAt: null,
  views: 0,
  commentCount: 0,
  tagNames: [],
  content: 'a'.repeat(320),
} as unknown as AdminPostRow;

describe('PostRow', () => {
  it('발행 글의 제목·카테고리·메타를 렌더한다', () => {
    render(<PostRow post={publishedPost} />);

    expect(
      screen.getByRole('link', { name: 'DELL S2725QC 모니터 리뷰' })
    ).toHaveAttribute('href', '/posts/dell-s2725qc');
    expect(screen.getByText('리뷰')).toBeInTheDocument();
    expect(screen.getByText(/조회 1,204/)).toBeInTheDocument();
    expect(screen.getByText(/댓글 3/)).toBeInTheDocument();
    expect(screen.getByText(/#4k모니터/)).toBeInTheDocument();
  });

  it('발행 글은 썸네일을 렌더한다', () => {
    render(<PostRow post={publishedPost} />);
    expect(screen.getByRole('img')).toHaveAttribute(
      'src',
      'https://example.com/thumb.jpg'
    );
  });

  it('임시저장 글은 제목이 편집 화면을 가리키고 임시저장 뱃지를 단다', () => {
    render(<PostRow post={draftPost} />);

    expect(
      screen.getByRole('link', { name: '키보드 배열 바꾸고 3개월' })
    ).toHaveAttribute('href', '/admin/posts/2/edit');
    expect(screen.getByText('임시저장')).toBeInTheDocument();
  });

  it('임시저장 글은 본문 길이와 자동 저장 시각을 보여준다', () => {
    render(<PostRow post={draftPost} />);
    expect(screen.getByText(/본문 320자/)).toBeInTheDocument();
  });

  it('썸네일이 없으면 플레이스홀더를 보여준다', () => {
    render(<PostRow post={draftPost} />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('썸네일 없음')).toBeInTheDocument();
  });

  it('제목이 비어 있으면 (제목 없음)으로 표시한다', () => {
    render(<PostRow post={{ ...draftPost, title: '' } as AdminPostRow} />);
    expect(
      screen.getByRole('link', { name: '(제목 없음)' })
    ).toBeInTheDocument();
  });

  it('발행 상태 토글을 렌더한다', () => {
    render(<PostRow post={publishedPost} />);
    expect(screen.getByTestId('status-toggle')).toHaveTextContent('published');
  });
});
