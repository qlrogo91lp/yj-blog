'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Eye, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNewPostStore } from '../_store'
import { submitPost } from '../_actions/submit-post-action'
import { useAutoSave } from '../_hooks/use-auto-save'
import { PreviewDialog } from './preview-dialog'

export function BottomBar() {
  const router = useRouter()
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const title = useNewPostStore((s) => s.title)
  const content = useNewPostStore((s) => s.content)
  const saveStatus = useNewPostStore((s) => s.saveStatus)
  const lastSavedAt = useNewPostStore((s) => s.lastSavedAt)

  useAutoSave()

  const handleDraft = async () => {
    await submitPost('draft')
  }

  const handlePublish = async () => {
    const result = await submitPost('published')
    if (result.success) {
      router.push(`/posts/${result.slug}`)
    }
  }

  return (
    <>
      <div className="sticky bottom-0 z-10 border-t bg-background px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setIsPreviewOpen(true)}>
            <Eye className="h-4 w-4 mr-1" />
            미리보기
          </Button>
          <span className="text-xs text-muted-foreground">
            {saveStatus === 'saving' && '저장 중...'}
            {saveStatus === 'saved' && lastSavedAt && (
              <>자동 저장 완료 {format(lastSavedAt, 'HH:mm:ss', { locale: ko })}</>
            )}
            {saveStatus === 'error' && '저장 실패'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDraft}
            disabled={saveStatus === 'saving'}
          >
            <Save className="h-4 w-4 mr-1" />
            임시저장
          </Button>
          <Button
            size="sm"
            onClick={handlePublish}
            disabled={saveStatus === 'saving' || !title || !content}
          >
            완료
          </Button>
        </div>
      </div>

      <PreviewDialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen} />
    </>
  )
}
