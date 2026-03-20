'use client'

import { useEffect } from 'react'
import type { Post, Category } from '@/types'
import { useNewPostStore } from '../../../new/_store'
import { useAutoSave } from '../../../new/_hooks/use-auto-save'
import { EditorProvider } from '../../../new/_providers/editor-provider'
import { TitleInputAction } from '../../../new/_actions/title-input-action'
import { CategorySelectorAction } from '../../../new/_actions/category-selector-action'
import { EditorToolbarAction } from '../../../new/_actions/editor-toolbar-action'
import { WysiwygEditorAction } from '../../../new/_actions/wysiwyg-editor-action'
import { MarkdownEditorAction } from '../../../new/_actions/markdown-editor-action'
import { BottomBar } from '../../../new/_components/bottom-bar'

type Props = {
  post: Post
  categories: Category[]
}

export function EditPostPageAction({ post, categories }: Props) {
  const mode = useNewPostStore((s) => s.mode)

  useAutoSave()

  useEffect(() => {
    useNewPostStore.getState().initializePost({
      postId: post.id,
      title: post.title,
      content: post.content,
      contentFormat: post.contentFormat as 'markdown' | 'html',
      categoryId: post.categoryId,
      slug: post.slug,
      excerpt: post.excerpt ?? '',
      status: post.status,
      publishedAt: post.publishedAt,
    })

    return () => {
      useNewPostStore.getState().reset()
    }
  }, [post])

  return (
    <EditorProvider>
      <div className="flex flex-1 flex-col">
        <EditorToolbarAction />
        <div className="flex-1 mx-auto w-full max-w-4xl px-6 py-6">
          <CategorySelectorAction categories={categories} />
          <TitleInputAction />
          <div className="mt-4 flex-1">
            {mode === 'wysiwyg' ? <WysiwygEditorAction /> : <MarkdownEditorAction />}
          </div>
        </div>
        <BottomBar />
      </div>
    </EditorProvider>
  )
}
