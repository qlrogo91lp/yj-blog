import type { Editor } from '@tiptap/react'

export function removeLink(editor: Editor) {
  editor.chain().focus().unsetLink().run()
}
