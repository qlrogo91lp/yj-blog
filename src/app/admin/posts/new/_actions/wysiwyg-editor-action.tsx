'use client';

import { useEffect, useRef } from 'react';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { Image } from '@tiptap/extension-image';
import { Link } from '@tiptap/extension-link';
import { Youtube } from '@tiptap/extension-youtube';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableRow } from '@tiptap/extension-table-row';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Underline } from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { useEditorContext } from '../_providers/editor-provider';
import { useNewPostStore } from '../_store';

export function WysiwygEditorAction() {
  const setContent = useNewPostStore((s) => s.setContent);
  const setContentFormat = useNewPostStore((s) => s.setContentFormat);
  const content = useNewPostStore((s) => s.content);
  const { setEditor } = useEditorContext();
  const isInitialMount = useRef(true);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: false,
        underline: false,
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }),
      Color,
      TextStyle,
      Link.configure({ openOnClick: false }),
      Image,
      Youtube.configure({
        nocookie: true,
        allowFullscreen: true,
        width: 640,
        height: 360,
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Placeholder.configure({ placeholder: '내용을 입력하세요...' }),
    ],
    content: content || '',
    editorProps: {
      attributes: {
        class:
          'prose prose-neutral dark:prose-invert max-w-none min-h-[500px] outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
      setContentFormat('html');
    },
  });

  // context에 editor 인스턴스 공유
  useEffect(() => {
    setEditor(editor);
    return () => setEditor(null);
  }, [editor, setEditor]);

  // content가 외부에서 변경되었을 때 (모드 전환 등) 에디터 내용 동기화
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '');
    }
  }, [content, editor]);

  return <EditorContent editor={editor} />;
}
