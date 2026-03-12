'use client'

import { useEffect } from 'react'
import type { Post, Category } from '@/types'
import { useNewPostStore } from '../../../new/_store'
import { EditorProvider } from '../../../new/_components/editor-context'
import { TitleInput } from '../../../new/_components/title-input'
import { CategorySelector } from '../../../new/_components/category-selector'
import { EditorToolbar } from '../../../new/_components/editor-toolbar'
import { WysiwygEditor } from '../../../new/_components/wysiwyg-editor'
import { MarkdownEditor } from '../../../new/_components/markdown-editor'
import { BottomBar } from '../../../new/_components/bottom-bar'

type Props = {
  post: Post
  categories: Category[]
}

export function EditPostPageClient({ post, categories }: Props) {
  const mode = useNewPostStore((s) => s.mode)

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
