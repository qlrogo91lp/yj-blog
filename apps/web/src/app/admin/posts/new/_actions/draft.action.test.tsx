import { act, fireEvent, render, screen } from '@testing-library/react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { savePost } from '../_services/save-post';
import { useNewPostStore } from '../_store';
import { DraftAction } from './draft.action';

vi.mock('../_services/save-post', () => ({
  savePost: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

describe('DraftAction', () => {
  beforeEach(() => {
    useNewPostStore.getState().reset();
    vi.mocked(savePost).mockReset();
    vi.mocked(savePost).mockResolvedValue({
      success: true,
      postId: 1,
      status: 'draft',
      publishedAt: null,
    });
  });

  it('draft 글에서는 "임시저장" 라벨이고 draft로 저장한다', async () => {
    render(<DraftAction />);
    const button = screen.getByRole('button', { name: /임시저장/ });
    await act(async () => {
      fireEvent.click(button);
    });
    expect(vi.mocked(savePost).mock.calls[0][0].status).toBe('draft');
  });

  it('published 글에서는 "저장" 라벨이고 published를 유지한 채 저장한다', async () => {
    vi.mocked(savePost).mockResolvedValue({
      success: true,
      postId: 1,
      status: 'published',
      publishedAt: new Date('2026-01-01'),
    });
    useNewPostStore.getState().setStatus('published');
    render(<DraftAction />);
    expect(
      screen.queryByRole('button', { name: /임시저장/ })
    ).not.toBeInTheDocument();
    const button = screen.getByRole('button', { name: /^저장$/ });
    await act(async () => {
      fireEvent.click(button);
    });
    expect(vi.mocked(savePost).mock.calls[0][0].status).toBe('published');
  });

  it('저장 중에는 비활성화된다', () => {
    useNewPostStore.getState().setSaveStatus('saving');
    render(<DraftAction />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('저장 실패 시 toast.error로 사유를 보여준다', async () => {
    vi.mocked(savePost).mockResolvedValue({
      success: false,
      error: '이미 사용 중인 slug입니다',
    });
    render(<DraftAction />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });
    expect(toast.error).toHaveBeenCalledWith('이미 사용 중인 slug입니다');
  });
});
