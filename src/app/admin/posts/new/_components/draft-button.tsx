'use client'

import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNewPostStore } from '../_store'
import { draftPost } from '../_actions/draft-action'

export function DraftButton() {
  const saveStatus = useNewPostStore((s) => s.saveStatus)

  const handleClick = async () => {
    await draftPost()
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={saveStatus === 'saving'}
    >
      <Save className="h-4 w-4 mr-1" />
      임시저장
    </Button>
  )
}
