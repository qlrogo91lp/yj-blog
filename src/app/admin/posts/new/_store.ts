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

  setPostId: (postId) => set({ postId }),
  setTitle: (title) => set({ title }),
  setContent: (content) => set({ content }),
  setContentFormat: (contentFormat) => set({ contentFormat }),
  setCategoryId: (categoryId) => set({ categoryId }),
  setSeriesId: (seriesId) => set({ seriesId }),
  setTagIds: (tagIds) => set({ tagIds }),
  setSlug: (slug) => set({ slug }),
  setExcerpt: (excerpt) => set({ excerpt }),
  setMetaTitle: (metaTitle) => set({ metaTitle }),
  setIsGeneratingExcerpt: (isGeneratingExcerpt) =>
    set({ isGeneratingExcerpt }),
  setThumbnailUrl: (thumbnailUrl) => set({ thumbnailUrl }),
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
    }),
  initializePost: (data) =>
    set({
      ...data,
      mode: data.contentFormat === 'markdown' ? 'markdown' : 'wysiwyg',
      isGeneratingExcerpt: false,
      saveStatus: 'idle',
      lastSavedAt: null,
    }),
  submitPost: async (status) => {
    // 동적 import: save-post.ts는 'use server' 파일로 db/index.ts(neon 호출)를 정적 참조하면
    // DATABASE_URL 없는 Vitest 환경에서 스토어 import만으로도 크래시난다.
    const { savePost } = await import('./_services/save-post');
    const state = get();
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
      publishedAt: state.publishedAt,
    });

    if (result.success) {
      set({
        postId: result.postId,
        slug,
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
