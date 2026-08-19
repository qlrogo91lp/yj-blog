import { create } from 'zustand';
import { generateSlug } from '@/lib/slugify';

type EditorMode = 'wysiwyg' | 'markdown';
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

type State = {
  postId: number | null;
  title: string;
  content: string;
  contentFormat: 'markdown' | 'html';
  categoryId: number | null;
  seriesId: number | null;
  tagIds: number[];
  slug: string;
  excerpt: string;
  metaTitle: string;
  isGeneratingExcerpt: boolean;
  thumbnailUrl: string | null;
  status: 'draft' | 'published';
  publishedAt: Date | null;
  mode: EditorMode;
  saveStatus: SaveStatus;
  lastSavedAt: Date | null;
  changeCount: number;
  savedChangeCount: number;
};

type Action = {
  setPostId: (id: number) => void;
  setTitle: (title: string) => void;
  setContent: (content: string) => void;
  setContentFormat: (format: 'markdown' | 'html') => void;
  setCategoryId: (id: number | null) => void;
  setSeriesId: (id: number | null) => void;
  setTagIds: (ids: number[]) => void;
  setSlug: (slug: string) => void;
  setExcerpt: (excerpt: string) => void;
  setMetaTitle: (metaTitle: string) => void;
  setIsGeneratingExcerpt: (isGeneratingExcerpt: boolean) => void;
  setThumbnailUrl: (url: string | null) => void;
  setStatus: (status: 'draft' | 'published') => void;
  setPublishedAt: (date: Date | null) => void;
  setMode: (mode: EditorMode) => void;
  setSaveStatus: (status: SaveStatus) => void;
  setLastSavedAt: (date: Date) => void;
  reset: () => void;
  initializePost: (data: {
    postId: number;
    title: string;
    content: string;
    contentFormat: 'markdown' | 'html';
    categoryId: number | null;
    seriesId: number | null;
    tagIds: number[];
    slug: string;
    excerpt: string;
    metaTitle: string;
    thumbnailUrl: string | null;
    status: 'draft' | 'published';
    publishedAt: Date | null;
  }) => void;
  submitPost: (status: 'draft' | 'published') => Promise<
    { success: true; slug: string } | { success: false; error: string }
  >;
};

export const selectIsDirty = (s: { changeCount: number; savedChangeCount: number }) =>
  s.changeCount !== s.savedChangeCount;

export const useNewPostStore = create<State & Action>((set, get) => ({
  postId: null,
  title: '',
  content: '',
  contentFormat: 'html',
  categoryId: null,
  seriesId: null,
  tagIds: [],
  slug: '',
  excerpt: '',
  metaTitle: '',
  isGeneratingExcerpt: false,
  thumbnailUrl: null,
  status: 'draft',
  publishedAt: null,

  mode: 'wysiwyg',
  saveStatus: 'idle',
  lastSavedAt: null,
  changeCount: 0,
  savedChangeCount: 0,

  setPostId: (postId) => set({ postId }),
  setTitle: (title) => set((s) => ({ title, changeCount: s.changeCount + 1 })),
  setContent: (content) => set((s) => ({ content, changeCount: s.changeCount + 1 })),
  setContentFormat: (contentFormat) =>
    set((s) => ({ contentFormat, changeCount: s.changeCount + 1 })),
  setCategoryId: (categoryId) => set((s) => ({ categoryId, changeCount: s.changeCount + 1 })),
  setSeriesId: (seriesId) => set((s) => ({ seriesId, changeCount: s.changeCount + 1 })),
  setTagIds: (tagIds) => set((s) => ({ tagIds, changeCount: s.changeCount + 1 })),
  setSlug: (slug) => set((s) => ({ slug, changeCount: s.changeCount + 1 })),
  setExcerpt: (excerpt) => set((s) => ({ excerpt, changeCount: s.changeCount + 1 })),
  setMetaTitle: (metaTitle) => set((s) => ({ metaTitle, changeCount: s.changeCount + 1 })),
  setIsGeneratingExcerpt: (isGeneratingExcerpt) =>
    set({ isGeneratingExcerpt }),
  setThumbnailUrl: (thumbnailUrl) =>
    set((s) => ({ thumbnailUrl, changeCount: s.changeCount + 1 })),
  setStatus: (status) => set({ status }),
  setPublishedAt: (publishedAt) => set({ publishedAt }),
  setMode: (mode) => set({ mode }),
  setSaveStatus: (saveStatus) => set({ saveStatus }),
  setLastSavedAt: (lastSavedAt) => set({ lastSavedAt }),
  reset: () =>
    set({
      postId: null,
      title: '',
      content: '',
      contentFormat: 'html',
      categoryId: null,
      seriesId: null,
      tagIds: [],
      slug: '',
      excerpt: '',
      metaTitle: '',
      isGeneratingExcerpt: false,
      thumbnailUrl: null,
      status: 'draft',
      publishedAt: null,
      mode: 'wysiwyg',
      saveStatus: 'idle',
      lastSavedAt: null,
      changeCount: 0,
      savedChangeCount: 0,
    }),
  initializePost: (data) =>
    set({
      ...data,
      mode: data.contentFormat === 'markdown' ? 'markdown' : 'wysiwyg',
      isGeneratingExcerpt: false,
      saveStatus: 'idle',
      lastSavedAt: null,
      changeCount: 0,
      savedChangeCount: 0,
    }),
  submitPost: async (status) => {
    // 이미 저장이 진행 중이면 새 요청을 받지 않는다 — 자동저장과 수동 저장/발행이
    // 동시에 서버로 나가 발행 글이 임시저장으로 되돌아가는 레이스를 막는 단일 관문.
    if (get().saveStatus === 'saving') {
      return { success: false, error: '이미 저장 중입니다' };
    }

    // 동적 import: save-post.ts는 'use server' 파일로 db/index.ts(neon 호출)를 정적 참조하면
    // DATABASE_URL 없는 Vitest 환경에서 스토어 import만으로도 크래시난다.
    const { savePost } = await import('./_services/save-post');
    const state = get();
    const changeCountAtStart = state.changeCount;
    const slug = state.slug || generateSlug(state.title);

    set({ saveStatus: 'saving' });

    const result = await savePost({
      postId: state.postId,
      title: state.title,
      slug,
      content: state.content,
      contentFormat: state.contentFormat,
      excerpt: state.excerpt,
      metaTitle: state.metaTitle,
      categoryId: state.categoryId,
      seriesId: state.seriesId,
      tagIds: state.tagIds,
      thumbnailUrl: state.thumbnailUrl,
      status,
    });

    if (result.success) {
      set({
        postId: result.postId,
        slug,
        status: result.status,
        publishedAt: result.publishedAt,
        savedChangeCount: changeCountAtStart,
        saveStatus: 'saved',
        lastSavedAt: new Date(),
      });
      return { success: true, slug };
    } else {
      set({ saveStatus: 'error' });
      return { success: false, error: result.error };
    }
  },
}));
