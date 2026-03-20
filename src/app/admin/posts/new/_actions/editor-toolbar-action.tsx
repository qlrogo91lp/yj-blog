'use client'

import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Quote, Minus, Link as LinkIcon,
  ImageIcon, Heading1, Heading2, Heading3,
  Highlighter, Undo2, Redo2, Type,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useEditorContext } from '../_providers/editor-provider'
import { useNewPostStore } from '../_store'
import { LinkDialog } from '../_components/_link'
import { ImageUploadDialog } from '../_components/_image-upload'
import { TableInsertPopover } from '../_components/table-insert-popover'
import { ColorPicker } from '../_components/color-picker'
import { ToolbarButton } from '../_components/toolbar-button'
import { useState, useCallback, useEffect } from 'react'
import TurndownService from 'turndown'

function useForceUpdate() {
  const [, setState] = useState(0)
  return useCallback(() => setState((n) => n + 1), [])
}

export function EditorToolbarAction() {
  const { editor } = useEditorContext()
  const mode = useNewPostStore((s) => s.mode)
  const forceUpdate = useForceUpdate()

  // editor 내부 상태 변경(커서 이동, 서식 적용 등) 시 리렌더링 트리거
  useEffect(() => {
    if (!editor) return
    editor.on('transaction', forceUpdate)
    return () => {
      editor.off('transaction', forceUpdate)
    }
  }, [editor, forceUpdate])
  const setMode = useNewPostStore((s) => s.setMode)
  const content = useNewPostStore((s) => s.content)
  const setContent = useNewPostStore((s) => s.setContent)
  const setContentFormat = useNewPostStore((s) => s.setContentFormat)
  const [isLinkOpen, setIsLinkOpen] = useState(false)
  const [isImageOpen, setIsImageOpen] = useState(false)

  const handleModeChange = useCallback((newMode: string) => {
    if (newMode === mode) return

    if (newMode === 'markdown' && mode === 'wysiwyg') {
      // HTML → Markdown
      const turndown = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced',
      })
      const markdown = turndown.turndown(content || '')
      setContent(markdown)
      setContentFormat('markdown')
    }
    // markdown → wysiwyg: 마크다운을 HTML로 변환해서 TipTap에 넣음
    // content는 그대로 두고, WysiwygEditor가 마운트될 때 처리

    setMode(newMode as 'wysiwyg' | 'markdown')
  }, [mode, content, setContent, setContentFormat, setMode])

  if (mode === 'markdown') {
    return (
      <div className="sticky top-0 z-10 border-b bg-background px-4 py-2 flex items-center gap-2">
        <Select value={mode} onValueChange={handleModeChange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="wysiwyg">기본모드</SelectItem>
            <SelectItem value="markdown">마크다운</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground ml-2">
          마크다운 모드에서는 직접 마크다운 문법을 작성합니다
        </span>
      </div>
    )
  }

  return (
    <div className="sticky top-0 z-10 border-b bg-background px-4 py-2 flex items-center gap-1 flex-wrap">
      {/* 모드 선택 */}
      <Select value={mode} onValueChange={handleModeChange}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="wysiwyg">기본모드</SelectItem>
          <SelectItem value="markdown">마크다운</SelectItem>
        </SelectContent>
      </Select>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* 제목 스타일 */}
      <Select
        value={
          editor?.isActive('heading', { level: 1 })
            ? 'h1'
            : editor?.isActive('heading', { level: 2 })
              ? 'h2'
              : editor?.isActive('heading', { level: 3 })
                ? 'h3'
                : 'paragraph'
        }
        onValueChange={(value) => {
          if (!editor) return
          if (value === 'paragraph') {
            editor.chain().focus().setParagraph().run()
          } else {
            const level = Number(value.replace('h', '')) as 1 | 2 | 3
            editor.chain().focus().toggleHeading({ level }).run()
          }
        }}
      >
        <SelectTrigger className="w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="paragraph">
            <div className="flex items-center gap-2"><Type className="h-4 w-4" /> 본문</div>
          </SelectItem>
          <SelectItem value="h1">
            <div className="flex items-center gap-2"><Heading1 className="h-4 w-4" /> 제목 1</div>
          </SelectItem>
          <SelectItem value="h2">
            <div className="flex items-center gap-2"><Heading2 className="h-4 w-4" /> 제목 2</div>
          </SelectItem>
          <SelectItem value="h3">
            <div className="flex items-center gap-2"><Heading3 className="h-4 w-4" /> 제목 3</div>
          </SelectItem>
        </SelectContent>
      </Select>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* 서식 */}
      <ToolbarButton
        icon={Bold}
        tooltip="굵게"
        isActive={editor?.isActive('bold')}
        onClick={() => editor?.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        icon={Italic}
        tooltip="기울임"
        isActive={editor?.isActive('italic')}
        onClick={() => editor?.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        icon={UnderlineIcon}
        tooltip="밑줄"
        isActive={editor?.isActive('underline')}
        onClick={() => editor?.chain().focus().toggleUnderline().run()}
      />
      <ToolbarButton
        icon={Strikethrough}
        tooltip="취소선"
        isActive={editor?.isActive('strike')}
        onClick={() => editor?.chain().focus().toggleStrike().run()}
      />

      <ColorPicker editor={editor} />

      <ToolbarButton
        icon={Highlighter}
        tooltip="형광펜"
        isActive={editor?.isActive('highlight')}
        onClick={() => editor?.chain().focus().toggleHighlight().run()}
      />

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* 정렬 */}
      <ToolbarButton
        icon={AlignLeft}
        tooltip="왼쪽 정렬"
        isActive={editor?.isActive({ textAlign: 'left' })}
        onClick={() => editor?.chain().focus().setTextAlign('left').run()}
      />
      <ToolbarButton
        icon={AlignCenter}
        tooltip="가운데 정렬"
        isActive={editor?.isActive({ textAlign: 'center' })}
        onClick={() => editor?.chain().focus().setTextAlign('center').run()}
      />
      <ToolbarButton
        icon={AlignRight}
        tooltip="오른쪽 정렬"
        isActive={editor?.isActive({ textAlign: 'right' })}
        onClick={() => editor?.chain().focus().setTextAlign('right').run()}
      />
      <ToolbarButton
        icon={AlignJustify}
        tooltip="양쪽 정렬"
        isActive={editor?.isActive({ textAlign: 'justify' })}
        onClick={() => editor?.chain().focus().setTextAlign('justify').run()}
      />

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* 블록 */}
      <ToolbarButton
        icon={Quote}
        tooltip="인용"
        isActive={editor?.isActive('blockquote')}
        onClick={() => editor?.chain().focus().toggleBlockquote().run()}
      />
      <ToolbarButton
        icon={List}
        tooltip="순서 없는 목록"
        isActive={editor?.isActive('bulletList')}
        onClick={() => editor?.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        icon={ListOrdered}
        tooltip="순서 있는 목록"
        isActive={editor?.isActive('orderedList')}
        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
      />

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* 삽입 */}
      <ToolbarButton
        icon={LinkIcon}
        tooltip="링크"
        isActive={editor?.isActive('link')}
        onClick={() => setIsLinkOpen(true)}
      />
      <ToolbarButton
        icon={ImageIcon}
        tooltip="이미지"
        onClick={() => setIsImageOpen(true)}
      />
      <TableInsertPopover editor={editor} />
      <ToolbarButton
        icon={Minus}
        tooltip="구분선"
        onClick={() => editor?.chain().focus().setHorizontalRule().run()}
      />

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* 실행취소/다시실행 */}
      <ToolbarButton
        icon={Undo2}
        tooltip="실행 취소"
        onClick={() => editor?.chain().focus().undo().run()}
      />
      <ToolbarButton
        icon={Redo2}
        tooltip="다시 실행"
        onClick={() => editor?.chain().focus().redo().run()}
      />

      {/* 다이얼로그 */}
      <LinkDialog editor={editor} open={isLinkOpen} onOpenChange={setIsLinkOpen} />
      <ImageUploadDialog editor={editor} open={isImageOpen} onOpenChange={setIsImageOpen} />
    </div>
  )
}
