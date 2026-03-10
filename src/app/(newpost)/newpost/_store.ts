import { create } from 'zustand'

type EditorMode = 'wysiwyg' | 'markdown'
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface NewPostState {
  // 글 데이터
  postId: number | null
  title: string
  content: string
  contentFormat: 'markdown' | 'html'
  categoryId: number | null
  slug: string
  excerpt: string
  status: 'draft' | 'published'

  // 에디터 상태
  mode: EditorMode
  saveStatus: SaveStatus
  lastSavedAt: Date | null

  // 액션
  setPostId: (id: number) => void
  setTitle: (title: string) => void
  setContent: (content: string) => void
  setContentFormat: (format: 'markdown' | 'html') => void
  setCategoryId: (id: number | null) => void
  setSlug: (slug: string) => void
  setExcerpt: (excerpt: string) => void
  setStatus: (status: 'draft' | 'published') => void
  setMode: (mode: EditorMode) => void
  setSaveStatus: (status: SaveStatus) => void
  setLastSavedAt: (date: Date) => void
}

export const useNewPostStore = create<NewPostState>((set) => ({
  postId: null,
  title: '',
  content: '',
  contentFormat: 'html',
  categoryId: null,
  slug: '',
  excerpt: '',
  status: 'draft',

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
  setStatus: (status) => set({ status }),
  setMode: (mode) => set({ mode }),
  setSaveStatus: (saveStatus) => set({ saveStatus }),
  setLastSavedAt: (lastSavedAt) => set({ lastSavedAt }),
}))
