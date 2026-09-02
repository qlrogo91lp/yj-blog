import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { CommentWithReplies } from '@/types';
import { CommentItemAction } from './comment-item.action';

// comment-form.action / delete-comment-dialog.action은 Server Action(_services)을
// import하고 있어 실제 모듈을 그대로 불러오면 DATABASE_URL 없이 db/index.ts가
// 즉시 실패한다. 이 테스트는 isAuthor 뱃지 렌더링만 검증하므로 mock으로 대체한다.
vi.mock('./comment-form.action', () => ({
  CommentFormAction: () => null,
}));
vi.mock('./delete-comment-dialog.action', () => ({
  DeleteCommentDialogAction: () => null,
}));

function makeComment(
  overrides: Partial<CommentWithReplies> = {}
): CommentWithReplies {
  return {
    id: 1,
    postId: 1,
    parentId: null,
    authorName: '홍길동',
    email: null,
    passwordHash: 'hash',
    content: '댓글 내용',
    isDeleted: false,
    isAuthor: false,
    createdAt: new Date('2026-08-20T00:00:00Z'),
    updatedAt: new Date('2026-08-20T00:00:00Z'),
    replies: [],
    ...overrides,
  };
}

describe('CommentItemAction', () => {
  it('isAuthor가 true면 작성자 뱃지를 렌더한다', () => {
    render(
      <CommentItemAction
        comment={makeComment({ isAuthor: true })}
        postSlug="my-post"
      />
    );
    expect(screen.getByText('작성자')).toBeInTheDocument();
  });

  it('isAuthor가 false면 작성자 뱃지를 렌더하지 않는다', () => {
    render(
      <CommentItemAction
        comment={makeComment({ isAuthor: false })}
        postSlug="my-post"
      />
    );
    expect(screen.queryByText('작성자')).not.toBeInTheDocument();
  });
});
