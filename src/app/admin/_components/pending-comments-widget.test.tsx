import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PendingCommentsWidget } from './pending-comments-widget';

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const comments = [
  {
    id: 1,
    content: '스탠드 높이 조절 범위가 어느 정도인가요?',
    postTitle: 'DELL 리뷰',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
];

describe('PendingCommentsWidget', () => {
  it('제목과 개수를 렌더한다', () => {
    render(<PendingCommentsWidget comments={comments} />);

    expect(screen.getByText('새 댓글')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('본문을 인용부호로 감싸 보여준다', () => {
    render(<PendingCommentsWidget comments={comments} />);
    expect(
      screen.getByText('"스탠드 높이 조절 범위가 어느 정도인가요?"')
    ).toBeInTheDocument();
  });

  it('글 제목과 상대시각을 함께 보여준다', () => {
    render(<PendingCommentsWidget comments={comments} />);
    expect(screen.getByText(/DELL 리뷰 ·/)).toBeInTheDocument();
  });

  it('답변 대기 댓글이 없으면 빈 상태를 보여준다', () => {
    render(<PendingCommentsWidget comments={[]} />);
    expect(screen.getByText('답변 대기 댓글이 없습니다.')).toBeInTheDocument();
  });
});
