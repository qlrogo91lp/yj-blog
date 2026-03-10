'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Eye, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNewPostStore } from '../_store'
import { savePost } from '../_actions/save-post-action'
import { PreviewDialog } from './preview-dialog'

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/[가-힣]+/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    || `post-${Date.now()}`
}

export function BottomBar() {
  const router = useRouter()
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const store = useNewPostStore()
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSave = useCallback(async (status: 'draft' | 'published') => {
    const slug = store.slug || generateSlug(store.title)

    store.setSaveStatus('saving')
    const result = await savePost({
      postId: store.postId,
      title: store.title,
      slug,
      content: store.content,
      contentFormat: store.contentFormat,
      categoryId: store.categoryId,
      status,
    })

    if (result.success) {
      store.setPostId(result.postId)
      store.setSlug(slug)
      store.setSaveStatus('saved')
      store.setLastSavedAt(new Date())

      if (status === 'published') {
        router.push(`/posts/${slug}`)
      }
    } else {
      store.setSaveStatus('error')
    }
  }, [store, router])

  // 자동 저장 (30초 디바운스)
  useEffect(() => {
    if (!store.title && !store.content) return

    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current)
    }

    autoSaveTimer.current = setTimeout(() => {
      handleSave('draft')
    }, 30000)

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current)
      }
    }
  }, [store.title, store.content, handleSave])

  return (
    <>
      <div className="sticky bottom-0 z-10 border-t bg-background px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setIsPreviewOpen(true)}>
            <Eye className="h-4 w-4 mr-1" />
            미리보기
          </Button>
          <span className="text-xs text-muted-foreground">
            {store.saveStatus === 'saving' && '저장 중...'}
            {store.saveStatus === 'saved' && store.lastSavedAt && (
              <>자동 저장 완료 {format(store.lastSavedAt, 'HH:mm:ss', { locale: ko })}</>
            )}
            {store.saveStatus === 'error' && '저장 실패'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSave('draft')}
            disabled={store.saveStatus === 'saving'}
          >
            <Save className="h-4 w-4 mr-1" />
            임시저장
          </Button>
          <Button
            size="sm"
            onClick={() => handleSave('published')}
            disabled={store.saveStatus === 'saving' || !store.title || !store.content}
          >
            완료
          </Button>
        </div>
      </div>

      <PreviewDialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen} />
    </>
  )
}
