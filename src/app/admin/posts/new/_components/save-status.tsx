'use client'

import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useNewPostStore } from '../_store'

export function SaveStatus() {
  const saveStatus = useNewPostStore((s) => s.saveStatus)
  const lastSavedAt = useNewPostStore((s) => s.lastSavedAt)

  return (
    <span className="text-xs text-muted-foreground">
      {saveStatus === 'saving' && '저장 중...'}
      {saveStatus === 'saved' && lastSavedAt && (
        <>
          자동 저장 완료 {format(lastSavedAt, 'HH:mm:ss', { locale: ko })}
        </>
      )}
      {saveStatus === 'error' && '저장 실패'}
    </span>
  )
}
