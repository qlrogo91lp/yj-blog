import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { savePost } from '../_services/save-post';
import { useNewPostStore } from '../_store';
import { AutoSaveProvider } from './auto-save.provider';

vi.mock('../_services/save-post', () => ({
  savePost: vi.fn(),
}));

const intervalMs = 30000;

describe('AutoSaveProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useNewPostStore.getState().reset();
    vi.mocked(savePost).mockReset();
    vi.mocked(savePost).mockResolvedValue({
      success: true,
      postId: 1,
      status: 'draft',
      publishedAt: null,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('제목·본문을 입력하고 30초가 지나면 현재 status로 저장한다', async () => {
    render(<AutoSaveProvider />);
    act(() => {
      useNewPostStore.getState().setTitle('제목');
      useNewPostStore.getState().setContent('<p>본문</p>');
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(intervalMs);
    });
    expect(savePost).toHaveBeenCalledTimes(1);
    expect(vi.mocked(savePost).mock.calls[0][0].status).toBe('draft');
  });

  it('dirty가 아니면(initializePost 직후) 저장하지 않는다', async () => {
    render(<AutoSaveProvider />);
    act(() => {
      useNewPostStore.getState().initializePost({
        postId: 7,
        title: '기존 글',
        content: '<p>본문</p>',
        categoryId: null,
        seriesId: null,
        tagIds: [],
        slug: 'existing',
        excerpt: '',
        metaTitle: '',
        thumbnailUrl: null,
        status: 'published',
        publishedAt: new Date('2026-01-01'),
      });
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(intervalMs * 2);
    });
    expect(savePost).not.toHaveBeenCalled();
  });

  it('제목만 있고 본문이 비어 있으면 저장하지 않는다', async () => {
    render(<AutoSaveProvider />);
    act(() => {
      useNewPostStore.getState().setTitle('제목만');
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(intervalMs * 2);
    });
    expect(savePost).not.toHaveBeenCalled();
  });

  it('카테고리만 바꿔도(제목·본문이 있으면) 자동저장된다', async () => {
    act(() => {
      useNewPostStore.getState().initializePost({
        postId: 7,
        title: '기존 글',
        content: '<p>본문</p>',
        categoryId: null,
        seriesId: null,
        tagIds: [],
        slug: 'existing',
        excerpt: '',
        metaTitle: '',
        thumbnailUrl: null,
        status: 'published',
        publishedAt: new Date('2026-01-01'),
      });
    });
    render(<AutoSaveProvider />);
    act(() => {
      useNewPostStore.getState().setCategoryId(3);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(intervalMs);
    });
    expect(savePost).toHaveBeenCalledTimes(1);
    expect(vi.mocked(savePost).mock.calls[0][0].status).toBe('published');
    expect(vi.mocked(savePost).mock.calls[0][0].categoryId).toBe(3);
  });

  it('연속 편집 중에는 마지막 편집 기준으로 30초를 다시 센다', async () => {
    render(<AutoSaveProvider />);
    act(() => {
      useNewPostStore.getState().setTitle('제목');
      useNewPostStore.getState().setContent('<p>a</p>');
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(intervalMs - 1000);
    });
    act(() => {
      useNewPostStore.getState().setContent('<p>ab</p>');
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(intervalMs - 1000);
    });
    expect(savePost).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(savePost).toHaveBeenCalledTimes(1);
  });

  it('dirty일 때 beforeunload를 preventDefault한다', () => {
    render(<AutoSaveProvider />);
    act(() => {
      useNewPostStore.getState().setTitle('제목');
    });
    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it('dirty가 아니면 beforeunload를 막지 않는다', () => {
    render(<AutoSaveProvider />);
    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it('수동 저장이 진행 중이면 자동저장 타이머가 겹쳐 호출되지 않는다', async () => {
    let resolveSave: (
      v: Awaited<ReturnType<typeof savePost>>
    ) => void = () => {};
    vi.mocked(savePost).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        })
    );
    render(<AutoSaveProvider />);
    act(() => {
      useNewPostStore.getState().setTitle('제목');
      useNewPostStore.getState().setContent('<p>본문</p>');
    });

    // 사용자가 발행 버튼 등을 눌러 수동 저장이 진행 중인 상태를 만든다.
    // submitPost는 'use server' 파일을 동적 import한 뒤에야 savePost를 호출하므로
    // (fake timer 환경에서 vi.waitFor 대신) 0ms advance로 대기 중인 microtask를 흘려보낸다.
    let manualSave: Promise<{ success: boolean }>;
    act(() => {
      manualSave = useNewPostStore.getState().submitPost('published');
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    // 자동저장 타이머가 30초를 넘겨도 저장이 진행 중이면 추가로 호출하지 않는다.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(intervalMs);
    });
    expect(savePost).toHaveBeenCalledTimes(1);

    resolveSave({
      success: true,
      postId: 1,
      status: 'published',
      publishedAt: new Date(),
    });
    await act(async () => {
      await manualSave;
    });
  });
});
