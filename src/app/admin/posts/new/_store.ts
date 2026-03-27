import { create } from 'zustand';

type EditorMode = 'wysiwyg' | 'markdown';
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

type State = {
  postId: number | null;
  title: string;
  content: string;
  contentFormat: 'markdown' | 'html';
  categoryId: number | null;
  slug: string;
  excerpt: string;
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
  setSlug: (slug: string) => void;
  setExcerpt: (excerpt: string) => void;
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
    slug: string;
    excerpt: string;
    thumbnailUrl: string | null;
    status: 'draft' | 'published';
    publishedAt: Date | null;
  }) => void;
};

export const useNewPostStore = create<State & Action>((set) => ({
  postId: null,
  title: '',
  content: '',
  contentFormat: 'html',
  categoryId: null,
  slug: '',
  excerpt: '',
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
  setSlug: (slug) => set({ slug }),
  setExcerpt: (excerpt) => set({ excerpt }),
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
      slug: '',
      excerpt: '',
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
      saveStatus: 'idle',
      lastSavedAt: null,
    }),
}));
