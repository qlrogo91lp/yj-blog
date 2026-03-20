import { useEffect, useRef } from 'react'
import { useNewPostStore } from '../_store'
import { submitPost } from '../_services/submit-post'

export function useAutoSave(intervalMs = 30000) {
  const title = useNewPostStore((s) => s.title)
  const content = useNewPostStore((s) => s.content)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!title && !content) return

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(() => {
      submitPost('draft')
    }, intervalMs)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [title, content, intervalMs])
}
