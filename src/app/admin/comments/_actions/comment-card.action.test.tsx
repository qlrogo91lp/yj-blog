import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { AdminCommentThread, Comment } from '@/types';
import { CommentCardAction } from './comment-card.action';

vi.mock('./comment-reply-form.action', () => ({
  CommentReplyFormAction: () => <div data-testid="reply-form" />,
}));
vi.mock('./delete-comment-dialog.action', () => ({
  DeleteCommentDialogAction: ({ commentId }: { commentId: number }) => (
    <button>삭제-{commentId}</button>
  ),
}));
vi.mock('../_components/comment-reply-row', () => ({
  CommentReplyRow: ({ reply }: { reply: Comment }) => (
    <div data-testid={`reply-${reply.id}`}>{reply.content}</div>
  ),
}));

function makeThread(
  overrides: Partial<AdminCommentThread> = {}
): AdminCommentThread {
  return {
    id: 1,
    postId: 10,
    parentId: null,
    authorName: '홍길동',
    email: null,
    passwordHash: 'hash',
    content: '댓글 내용',
    isDeleted: false,
    isAuthor: false,
    createdAt: new Date('2026-08-20T00:00:00Z'),
    updatedAt: new Date('2026-08-20T00:00:00Z'),
    postTitle: '테스트 글',
    postSlug: 'test-post',
    replies: [],
    ...overrides,
  };
}

function makeReply(overrides: Partial<Comment> = {}): Comment {
  return {
    id: 2,
    postId: 10,
    parentId: 1,
    authorName: '운영자',
    email: null,
    passwordHash: 'hash',
    content: '답글',
    isDeleted: false,
    isAuthor: true,
    createdAt: new Date('2026-08-20T00:00:00Z'),
    updatedAt: new Date('2026-08-20T00:00:00Z'),
    ...overrides,
  };
}

describe('CommentCardAction', () => {
  it('답변이 없으면 답변 대기 뱃지를 보여준다', () => {
    render(<CommentCardAction thread={makeThread()} />);
    expect(screen.getByText('답변 대기')).toBeInTheDocument();
  });

  it('관리자 답글이 있으면 답변 완료 뱃지를 보여준다', () => {
    render(
      <CommentCardAction thread={makeThread({ replies: [makeReply()] })} />
    );
    expect(screen.getByText('답변 완료')).toBeInTheDocument();
  });

  it('답글 버튼을 누르면 답글 폼이 열리고 다시 누르면 닫힌다', () => {
    render(<CommentCardAction thread={makeThread()} />);
    expect(screen.queryByTestId('reply-form')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '답글' }));
    expect(screen.getByTestId('reply-form')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(screen.queryByTestId('reply-form')).not.toBeInTheDocument();
  });

  it('삭제된 댓글이면 내용 대신 안내 문구를 보여주고 답글 버튼을 숨긴다', () => {
    render(<CommentCardAction thread={makeThread({ isDeleted: true })} />);
    expect(screen.getByText('삭제된 댓글입니다.')).toBeInTheDocument();
    expect(screen.queryByText('댓글 내용')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '답글' })
    ).not.toBeInTheDocument();
  });

  it('답글 목록을 렌더한다', () => {
    render(
      <CommentCardAction
        thread={makeThread({ replies: [makeReply({ id: 3 })] })}
      />
    );
    expect(screen.getByTestId('reply-3')).toBeInTheDocument();
  });

  it('답글이 있어도 isAuthor가 false면 답변 대기 뱃지를 보여준다', () => {
    render(
      <CommentCardAction
        thread={makeThread({ replies: [makeReply({ isAuthor: false })] })}
      />
    );
    expect(screen.getByText('답변 대기')).toBeInTheDocument();
    expect(screen.queryByText('답변 완료')).not.toBeInTheDocument();
  });

  it('삭제된 댓글이어도 답글은 렌더한다', () => {
    render(
      <CommentCardAction
        thread={makeThread({
          isDeleted: true,
          replies: [makeReply({ id: 4 })],
        })}
      />
    );
    expect(screen.getByText('삭제된 댓글입니다.')).toBeInTheDocument();
    expect(screen.getByTestId('reply-4')).toBeInTheDocument();
  });
});
