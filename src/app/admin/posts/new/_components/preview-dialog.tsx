'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useNewPostStore } from '../_store'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PreviewDialog({ open, onOpenChange }: Props) {
  const title = useNewPostStore((s) => s.title)
  const content = useNewPostStore((s) => s.content)
  const contentFormat = useNewPostStore((s) => s.contentFormat)

  // 마크다운 모드일 때는 간단한 HTML 변환 (미리보기 용도)
  // 실제 렌더링은 서버사이드에서 unified로 처리됨
  const html = contentFormat === 'html'
    ? content
    : `<pre style="white-space: pre-wrap; font-family: var(--font-geist-mono);">${escapeHtml(content)}</pre>`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>미리보기</DialogTitle>
        </DialogHeader>
        <article className="mt-4">
          <h1 className="text-3xl font-bold mb-6">{title || '제목 없음'}</h1>
          <div
            className="prose prose-neutral dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </article>
      </DialogContent>
    </Dialog>
  )
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
