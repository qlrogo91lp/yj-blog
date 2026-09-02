import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { addAdminReply } from '../_services/add-admin-reply';
import { CommentReplyFormAction } from './comment-reply-form.action';

vi.mock('../_services/add-admin-reply', () => ({
  addAdminReply: vi.fn(),
}));

describe('CommentReplyFormAction', () => {
  beforeEach(() => {
    vi.mocked(addAdminReply).mockReset();
  });

  it('내용을 비우고 제출하면 검증 에러를 보여주고 액션을 호출하지 않는다', async () => {
    render(
      <CommentReplyFormAction
        postId={1}
        postSlug="p"
        parentId={2}
        onSuccess={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: '답글 등록' }));

    expect(await screen.findByText('답글을 입력해주세요')).toBeInTheDocument();
    expect(addAdminReply).not.toHaveBeenCalled();
  });

  it('성공하면 addAdminReply를 호출하고 onSuccess를 부른다', async () => {
    vi.mocked(addAdminReply).mockResolvedValue({ success: true });
    const onSuccess = vi.fn();
    render(
      <CommentReplyFormAction
        postId={1}
        postSlug="p"
        parentId={2}
        onSuccess={onSuccess}
      />
    );
    fireEvent.change(screen.getByPlaceholderText('답글을 입력하세요'), {
      target: { value: '답글 내용' },
    });
    fireEvent.click(screen.getByRole('button', { name: '답글 등록' }));

    await waitFor(() =>
      expect(addAdminReply).toHaveBeenCalledWith(1, 'p', 2, {
        content: '답글 내용',
      })
    );
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });

  it('실패하면 폼 안에 에러 메시지를 보여준다', async () => {
    vi.mocked(addAdminReply).mockResolvedValue({
      success: false,
      error: '실패했습니다',
    });
    render(
      <CommentReplyFormAction
        postId={1}
        postSlug="p"
        parentId={2}
        onSuccess={vi.fn()}
      />
    );
    fireEvent.change(screen.getByPlaceholderText('답글을 입력하세요'), {
      target: { value: '답글 내용' },
    });
    fireEvent.click(screen.getByRole('button', { name: '답글 등록' }));

    expect(await screen.findByText('실패했습니다')).toBeInTheDocument();
  });
});
