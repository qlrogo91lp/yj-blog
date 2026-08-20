import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Comment } from '@/types';
import { CommentReplyRow } from './comment-reply-row';

vi.mock('../_actions/delete-comment-dialog.action', () => ({
  DeleteCommentDialogAction: ({ commentId }: { commentId: number }) => (
    <button>삭제-{commentId}</button>
  ),
}));

function makeReply(overrides: Partial<Comment> = {}): Comment {
  return {
    id: 2,
    postId: 1,
    parentId: 1,
    authorName: '운영자블로그',
    email: null,
    passwordHash: 'hash',
    content: '답글 내용',
    isDeleted: false,
    isAuthor: true,
    createdAt: new Date('2026-08-20T00:00:00Z'),
    updatedAt: new Date('2026-08-20T00:00:00Z'),
    ...overrides,
  };
}

describe('CommentReplyRow', () => {
  it('isAuthor면 작성자 뱃지와 내용을 렌더한다', () => {
    render(<CommentReplyRow reply={makeReply()} />);
    expect(screen.getByText('작성자')).toBeInTheDocument();
    expect(screen.getByText('답글 내용')).toBeInTheDocument();
    expect(screen.getByText('삭제-2')).toBeInTheDocument();
  });

  it('삭제된 답글이면 안내 문구만 보여주고 삭제 버튼을 숨긴다', () => {
    render(<CommentReplyRow reply={makeReply({ isDeleted: true })} />);
    expect(screen.getByText('삭제된 댓글입니다.')).toBeInTheDocument();
    expect(screen.queryByText('답글 내용')).not.toBeInTheDocument();
    expect(screen.queryByText('삭제-2')).not.toBeInTheDocument();
  });
});
