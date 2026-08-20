import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { editPostStatus } from '../_services/edit-post-status';
import { PostStatusToggleAction } from './post-status-toggle.action';

vi.mock('../_services/edit-post-status', () => ({
  editPostStatus: vi.fn(async () => ({ success: true })),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

describe('PostStatusToggleAction', () => {
  beforeEach(() => {
    vi.mocked(editPostStatus).mockClear();
    vi.mocked(editPostStatus).mockResolvedValue({ success: true });
  });

  it('발행 글은 켜진 스위치와 "발행 중" 라벨을 보여준다', () => {
    render(<PostStatusToggleAction postId={1} status="published" />);

    expect(screen.getByRole('switch')).toHaveAttribute('data-state', 'checked');
    expect(screen.getByText('발행 중')).toBeInTheDocument();
  });

  it('임시저장 글은 꺼진 스위치와 "비공개" 라벨을 보여준다', () => {
    render(<PostStatusToggleAction postId={1} status="draft" />);

    expect(screen.getByRole('switch')).toHaveAttribute(
      'data-state',
      'unchecked'
    );
    expect(screen.getByText('비공개')).toBeInTheDocument();
  });

  it('켜면 published로 서버 액션을 호출한다', async () => {
    render(<PostStatusToggleAction postId={7} status="draft" />);

    fireEvent.click(screen.getByRole('switch'));

    await waitFor(() =>
      expect(editPostStatus).toHaveBeenCalledWith(7, 'published')
    );
  });

  it('끄면 draft로 서버 액션을 호출한다', async () => {
    render(<PostStatusToggleAction postId={7} status="published" />);

    fireEvent.click(screen.getByRole('switch'));

    await waitFor(() =>
      expect(editPostStatus).toHaveBeenCalledWith(7, 'draft')
    );
  });
});
