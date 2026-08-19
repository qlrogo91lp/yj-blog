import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./_services/save-post', () => ({
  savePost: vi.fn(),
}));

import { savePost } from './_services/save-post';
import { selectIsDirty, useNewPostStore } from './_store';

describe('useNewPostStore dirty 추적', () => {
  beforeEach(() => {
    useNewPostStore.getState().reset();
  });

  it('초기 상태는 dirty가 아니다', () => {
    expect(selectIsDirty(useNewPostStore.getState())).toBe(false);
  });

  it('사용자 편집 setter는 dirty로 만든다', () => {
    const s = useNewPostStore.getState();
    s.setTitle('제목');
    expect(selectIsDirty(useNewPostStore.getState())).toBe(true);
  });

  it.each([
    ['setContent', (s: ReturnType<typeof useNewPostStore.getState>) => s.setContent('<p>a</p>')],
    ['setContentFormat', (s: ReturnType<typeof useNewPostStore.getState>) => s.setContentFormat('markdown')],
    ['setCategoryId', (s: ReturnType<typeof useNewPostStore.getState>) => s.setCategoryId(1)],
    ['setSeriesId', (s: ReturnType<typeof useNewPostStore.getState>) => s.setSeriesId(1)],
    ['setTagIds', (s: ReturnType<typeof useNewPostStore.getState>) => s.setTagIds([1])],
    ['setSlug', (s: ReturnType<typeof useNewPostStore.getState>) => s.setSlug('x')],
    ['setExcerpt', (s: ReturnType<typeof useNewPostStore.getState>) => s.setExcerpt('x')],
    ['setMetaTitle', (s: ReturnType<typeof useNewPostStore.getState>) => s.setMetaTitle('x')],
    ['setThumbnailUrl', (s: ReturnType<typeof useNewPostStore.getState>) => s.setThumbnailUrl('u')],
  ])('%s 호출은 changeCount를 1 올린다', (_name, call) => {
    const before = useNewPostStore.getState().changeCount;
    call(useNewPostStore.getState());
    expect(useNewPostStore.getState().changeCount).toBe(before + 1);
  });

  it.each([
    ['setPostId', (s: ReturnType<typeof useNewPostStore.getState>) => s.setPostId(1)],
    ['setStatus', (s: ReturnType<typeof useNewPostStore.getState>) => s.setStatus('published')],
    ['setPublishedAt', (s: ReturnType<typeof useNewPostStore.getState>) => s.setPublishedAt(new Date())],
    ['setMode', (s: ReturnType<typeof useNewPostStore.getState>) => s.setMode('markdown')],
    ['setSaveStatus', (s: ReturnType<typeof useNewPostStore.getState>) => s.setSaveStatus('saving')],
    ['setLastSavedAt', (s: ReturnType<typeof useNewPostStore.getState>) => s.setLastSavedAt(new Date())],
    ['setIsGeneratingExcerpt', (s: ReturnType<typeof useNewPostStore.getState>) => s.setIsGeneratingExcerpt(true)],
  ])('%s 호출은 changeCount를 올리지 않는다', (_name, call) => {
    const before = useNewPostStore.getState().changeCount;
    call(useNewPostStore.getState());
    expect(useNewPostStore.getState().changeCount).toBe(before);
  });

  it('initializePost 직후는 dirty가 아니다', () => {
    useNewPostStore.getState().setTitle('편집 중');
    useNewPostStore.getState().initializePost({
      postId: 1,
      title: '글',
      content: '<p>본문</p>',
      contentFormat: 'html',
      categoryId: null,
      seriesId: null,
      tagIds: [],
      slug: 'post',
      excerpt: '',
      metaTitle: '',
      thumbnailUrl: null,
      status: 'published',
      publishedAt: new Date('2026-01-01'),
    });
    expect(selectIsDirty(useNewPostStore.getState())).toBe(false);
  });

  it('reset 이후는 dirty가 아니다', () => {
    useNewPostStore.getState().setTitle('편집 중');
    useNewPostStore.getState().reset();
    expect(selectIsDirty(useNewPostStore.getState())).toBe(false);
  });
});

describe('useNewPostStore.submitPost', () => {
  beforeEach(() => {
    useNewPostStore.getState().reset();
    vi.mocked(savePost).mockReset();
  });

  it('성공 시 서버가 돌려준 status·publishedAt·postId를 스토어에 반영하고 dirty를 해제한다', async () => {
    const publishedAt = new Date('2026-08-19T10:00:00Z');
    vi.mocked(savePost).mockResolvedValue({
      success: true,
      postId: 42,
      status: 'published',
      publishedAt,
    });
    const s = useNewPostStore.getState();
    s.setTitle('제목');
    s.setContent('<p>본문</p>');
    expect(selectIsDirty(useNewPostStore.getState())).toBe(true);

    const result = await useNewPostStore.getState().submitPost('published');

    expect(result.success).toBe(true);
    const after = useNewPostStore.getState();
    expect(after.postId).toBe(42);
    expect(after.status).toBe('published');
    expect(after.publishedAt).toEqual(publishedAt);
    expect(after.saveStatus).toBe('saved');
    expect(selectIsDirty(after)).toBe(false);
  });

  it('저장 중에 추가 편집이 있었으면 저장 성공 후에도 dirty가 유지된다', async () => {
    let resolveSave: (v: Awaited<ReturnType<typeof savePost>>) => void = () => {};
    vi.mocked(savePost).mockImplementation(
      () => new Promise((resolve) => { resolveSave = resolve; }),
    );
    const s = useNewPostStore.getState();
    s.setTitle('제목');
    s.setContent('<p>본문</p>');

    const pending = useNewPostStore.getState().submitPost('draft');
    // submitPost 내부는 'use server' 파일의 동적 import(DATABASE_URL 크래시 회피용)를
    // 거친 뒤에야 savePost를 호출한다 — 즉 최소 1 microtask tick 이후다.
    // savePost가 실제로 호출된(=resolveSave가 교체된) 시점까지 기다린 뒤 중간 편집을 넣는다.
    await vi.waitFor(() => expect(savePost).toHaveBeenCalled());
    useNewPostStore.getState().setTitle('저장 중 수정');
    resolveSave({ success: true, postId: 1, status: 'draft', publishedAt: null });
    await pending;

    expect(selectIsDirty(useNewPostStore.getState())).toBe(true);
  });

  it('publishedAt을 서버로 보내지 않는다', async () => {
    vi.mocked(savePost).mockResolvedValue({
      success: true, postId: 1, status: 'draft', publishedAt: null,
    });
    useNewPostStore.getState().setTitle('제목');
    useNewPostStore.getState().setContent('<p>본문</p>');
    await useNewPostStore.getState().submitPost('draft');
    const arg = vi.mocked(savePost).mock.calls[0][0];
    expect('publishedAt' in arg).toBe(false);
  });

  it('실패 시 saveStatus가 error가 되고 dirty는 유지된다', async () => {
    vi.mocked(savePost).mockResolvedValue({ success: false, error: '저장에 실패했습니다' });
    useNewPostStore.getState().setTitle('제목');
    useNewPostStore.getState().setContent('<p>본문</p>');
    const result = await useNewPostStore.getState().submitPost('draft');
    expect(result.success).toBe(false);
    expect(useNewPostStore.getState().saveStatus).toBe('error');
    expect(selectIsDirty(useNewPostStore.getState())).toBe(true);
  });
});
