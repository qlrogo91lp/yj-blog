import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./_services/save-post', () => ({
  savePost: vi.fn(),
}));

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
