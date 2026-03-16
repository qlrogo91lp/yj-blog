'use client'

import type { Category } from '@/types'
import { useNewPostStore } from '../_store'
import { useAutoSave } from '../_hooks/use-auto-save'
import { EditorProvider } from './editor-context'
import { TitleInput } from './title-input'
import { CategorySelector } from './category-selector'
import { EditorToolbar } from './editor-toolbar'
import { WysiwygEditor } from './wysiwyg-editor'
import { MarkdownEditor } from './markdown-editor'
import { BottomBar } from './bottom-bar'

type Props = {
  categories: Category[]
}

export function NewPostPageClient({ categories }: Props) {
  const mode = useNewPostStore((s) => s.mode)

  useAutoSave()

  return (
    <EditorProvider>
      <div className="flex flex-1 flex-col">
        <EditorToolbar />
        <div className="flex-1 mx-auto w-full max-w-4xl px-6 py-6">
          <CategorySelector categories={categories} />
          <TitleInput />
          <div className="mt-4 flex-1">
            {mode === 'wysiwyg' ? <WysiwygEditor /> : <MarkdownEditor />}
          </div>
        </div>
        <BottomBar />
      </div>
    </EditorProvider>
  )
}
