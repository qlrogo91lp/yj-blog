'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useNewPostStore } from '../_store'
import { submitPost } from '../_services/submit-post'

export function PublishAction() {
  const router = useRouter()
  const title = useNewPostStore((s) => s.title)
  const content = useNewPostStore((s) => s.content)
  const saveStatus = useNewPostStore((s) => s.saveStatus)

  const handleClick = async () => {
    const result = await submitPost('published')
    if (result.success) {
      router.push(`/posts/${result.slug}`)
    }
  }

  return (
    <Button
      size="sm"
      onClick={handleClick}
      disabled={saveStatus === 'saving' || !title || !content}
    >
      완료
    </Button>
  )
}
