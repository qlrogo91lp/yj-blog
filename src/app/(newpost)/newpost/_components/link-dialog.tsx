'use client'

import { useState } from 'react'
import type { Editor } from '@tiptap/react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

type Props = {
  editor: Editor | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LinkDialog({ editor, open, onOpenChange }: Props) {
  const [url, setUrl] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editor || !url) return

    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: url })
      .run()

    setUrl('')
    onOpenChange(false)
  }

  const handleRemove = () => {
    if (!editor) return
    editor.chain().focus().unsetLink().run()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>링크 삽입</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            {editor?.isActive('link') && (
              <Button type="button" variant="outline" onClick={handleRemove}>
                링크 제거
              </Button>
            )}
            <Button type="submit">삽입</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
