import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Post } from '@/types';
import EditPostPage from './page';

// next/navigation — notFound/redirect는 호출 여부만 확인하면 되므로 no-op으로 대체
vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(async () => ({ userId: 'user_test' })),
}));

vi.mock('@/db/queries/categories', () => ({
  getCategories: vi.fn(async () => []),
}));

vi.mock('@/db/queries/series', () => ({
  selectSeriesList: vi.fn(async () => []),
}));

vi.mock('@/db/queries/tags', () => ({
  getAllTags: vi.fn(async () => []),
  selectTagsByPostId: vi.fn(async () => []),
}));

const selectPostById = vi.fn();
vi.mock('@/db/queries/posts', () => ({
  selectPostById: (...args: unknown[]) => selectPostById(...args),
}));

const markdownToHtml = vi.fn(async (markdown: string) => `<p>변환됨: ${markdown}</p>`);
vi.mock('@/lib/markdown', () => ({
  markdownToHtml: (...args: [string]) => markdownToHtml(...args),
}));

// PostInitHandler에 전달되는 props를 검증하기 위해 캡처용 mock으로 대체
const postInitHandlerSpy = vi.fn();
vi.mock('./_handlers/post-init.handler', () => ({
  PostInitHandler: (props: unknown) => {
    postInitHandlerSpy(props);
    return null;
  },
}));

// 나머지 하위 컴포넌트는 렌더링 결과와 무관하므로 단순 stub으로 대체
vi.mock('../../new/_components/bottom-bar', () => ({
  BottomBar: () => null,
}));
vi.mock('../../new/_actions/editor-toolbar.action', () => ({
  EditorToolbarAction: () => null,
}));
vi.mock('../../new/_actions/category-selector.action', () => ({
  CategorySelectorAction: () => null,
}));
vi.mock('../../new/_actions/series-selector.action', () => ({
  SeriesSelectorAction: () => null,
}));
vi.mock('../../new/_actions/tag-selector.action', () => ({
  TagSelectorAction: () => null,
}));
vi.mock('../../new/_actions/title-input.action', () => ({
  TitleInputAction: () => null,
}));
vi.mock('../../new/_actions/thumbnail-upload.action', () => ({
  ThumbnailUploadAction: () => null,
}));
vi.mock('../../new/_actions/seo-section.action', () => ({
  SeoSectionAction: () => null,
}));
vi.mock('../../new/_actions/wysiwyg-editor.action', () => ({
  WysiwygEditorAction: () => null,
}));
vi.mock('../../new/_providers/editor.provider', () => ({
  EditorProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('../../new/_providers/auto-save.provider', () => ({
  AutoSaveProvider: () => null,
}));

function buildPost(overrides: Partial<Post>): Post {
  return {
    id: 1,
    title: '제목',
    slug: 'post-slug',
    content: '원본 내용',
    contentFormat: 'html',
    excerpt: null,
    thumbnailUrl: null,
    status: 'draft',
    views: 0,
    categoryId: null,
    seriesId: null,
    metaTitle: null,
    metaDescription: null,
    publishedAt: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  } as Post;
}

describe('EditPostPage — contentFormat에 따른 마크다운→HTML 변환 분기', () => {
  beforeEach(() => {
    postInitHandlerSpy.mockClear();
    markdownToHtml.mockClear();
    selectPostById.mockReset();
  });

  it('contentFormat이 markdown이면 markdownToHtml로 변환한 결과를 PostInitHandler에 전달한다', async () => {
    const post = buildPost({ contentFormat: 'markdown', content: '# 마크다운 본문' });
    selectPostById.mockResolvedValue(post);

    const ui = await EditPostPage({ params: Promise.resolve({ id: '1' }) });
    render(ui);

    expect(markdownToHtml).toHaveBeenCalledWith('# 마크다운 본문');
    expect(postInitHandlerSpy).toHaveBeenCalledTimes(1);
    const props = postInitHandlerSpy.mock.calls[0][0];
    expect(props.content).toBe('<p>변환됨: # 마크다운 본문</p>');
    expect(props.post).toBe(post);
  });

  it('contentFormat이 html이면 markdownToHtml을 호출하지 않고 content를 그대로 전달한다', async () => {
    const post = buildPost({ contentFormat: 'html', content: '<p>HTML 본문</p>' });
    selectPostById.mockResolvedValue(post);

    const ui = await EditPostPage({ params: Promise.resolve({ id: '1' }) });
    render(ui);

    expect(markdownToHtml).not.toHaveBeenCalled();
    expect(postInitHandlerSpy).toHaveBeenCalledTimes(1);
    const props = postInitHandlerSpy.mock.calls[0][0];
    expect(props.content).toBe('<p>HTML 본문</p>');
  });
});
