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
import { uploadImage } from '../_actions/upload-image-action'

type Props = {
  editor: Editor | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImageUploadDialog({ editor, open, onOpenChange }: Props) {
  const [url, setUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const result = await uploadImage(formData)
      if (result.url) {
        setUrl(result.url)
      }
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editor || !url) return

    editor.chain().focus().setImage({ src: url }).run()
    setUrl('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>이미지 삽입</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>파일 업로드</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="image-url">또는 URL 직접 입력</Label>
              <Input
                id="image-url"
                placeholder="https://example.com/image.png"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!url || isUploading}>
              {isUploading ? '업로드 중...' : '삽입'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
