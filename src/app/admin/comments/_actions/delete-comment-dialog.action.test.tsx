import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { removeComment } from '../_services/remove-comment';
import { DeleteCommentDialogAction } from './delete-comment-dialog.action';

vi.mock('../_services/remove-comment', () => ({
  removeComment: vi.fn(),
}));

describe('DeleteCommentDialogAction', () => {
  beforeEach(() => {
    vi.mocked(removeComment).mockReset();
  });

  it('삭제 버튼을 누르면 확인 다이얼로그가 뜬다', () => {
    render(<DeleteCommentDialogAction commentId={1} />);
    fireEvent.click(screen.getByRole('button', { name: '삭제' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('삭제를 확정하면 removeComment(commentId)를 호출하고 다이얼로그를 닫는다', async () => {
    vi.mocked(removeComment).mockResolvedValue({ success: true });
    render(<DeleteCommentDialogAction commentId={1} />);
    fireEvent.click(screen.getByRole('button', { name: '삭제' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: '삭제' }));

    await waitFor(() => expect(removeComment).toHaveBeenCalledWith(1));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
  });

  it('실패하면 다이얼로그 안에 에러 메시지를 보여준다', async () => {
    vi.mocked(removeComment).mockResolvedValue({
      success: false,
      error: '삭제 실패',
    });
    render(<DeleteCommentDialogAction commentId={1} />);
    fireEvent.click(screen.getByRole('button', { name: '삭제' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: '삭제' }));

    expect(await screen.findByText('삭제 실패')).toBeInTheDocument();
  });
});
