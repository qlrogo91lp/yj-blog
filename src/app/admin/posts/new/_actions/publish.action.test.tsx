import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('../_services/save-post', () => ({ savePost: vi.fn() }));

import { toast } from 'sonner';
import { savePost } from '../_services/save-post';
import { useNewPostStore } from '../_store';
import { PublishAction } from './publish.action';

describe('PublishAction', () => {
  beforeEach(() => {
    useNewPostStore.getState().reset();
    useNewPostStore.getState().setTitle('제목');
    useNewPostStore.getState().setContent('<p>본문</p>');
    vi.mocked(savePost).mockReset();
    push.mockReset();
    vi.mocked(toast.error).mockReset();
  });

  it('성공하면 상세 페이지로 이동한다', async () => {
    vi.mocked(savePost).mockResolvedValue({
      success: true, postId: 1, status: 'published', publishedAt: new Date(),
    });
    useNewPostStore.getState().setSlug('my-post');
    render(<PublishAction />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '완료' }));
    });
    expect(push).toHaveBeenCalledWith('/posts/my-post');
  });

  it('실패하면 toast.error로 사유를 보여주고 이동하지 않는다', async () => {
    vi.mocked(savePost).mockResolvedValue({ success: false, error: '이미 사용 중인 slug입니다' });
    render(<PublishAction />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '완료' }));
    });
    expect(toast.error).toHaveBeenCalledWith('이미 사용 중인 slug입니다');
    expect(push).not.toHaveBeenCalled();
  });
});
