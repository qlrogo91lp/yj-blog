import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useNewPostStore } from '../_store';
import { NewPostResetHandler } from './new-post-reset.handler';

vi.mock('../_services/save-post', () => ({
  savePost: vi.fn(),
}));

describe('NewPostResetHandler', () => {
  beforeEach(() => {
    useNewPostStore.getState().reset();
  });

  it('마운트 시에는 스토어를 건드리지 않는다', () => {
    useNewPostStore.getState().setTitle('업로드 중 생긴 초안');
    useNewPostStore.getState().setPostId(5);
    render(<NewPostResetHandler />);
    expect(useNewPostStore.getState().title).toBe('업로드 중 생긴 초안');
    expect(useNewPostStore.getState().postId).toBe(5);
  });

  it('언마운트 시 스토어를 reset한다', () => {
    const { unmount } = render(<NewPostResetHandler />);
    useNewPostStore.getState().setTitle('발행한 글');
    useNewPostStore.getState().setPostId(42);
    unmount();
    expect(useNewPostStore.getState().title).toBe('');
    expect(useNewPostStore.getState().postId).toBeNull();
  });
});
