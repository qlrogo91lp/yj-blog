import type { Editor } from '@tiptap/react'

export function submitLink(editor: Editor, url: string) {
  editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}
