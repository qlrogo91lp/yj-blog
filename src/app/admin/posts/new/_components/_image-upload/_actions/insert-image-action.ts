import type { Editor } from '@tiptap/react'

export function insertImage(editor: Editor, url: string) {
  editor.chain().focus().setImage({ src: url }).run()
}
