'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  ImageIcon,
  Images,
  Italic,
  Youtube,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  SquareCode,
  Strikethrough,
  Type,
  Underline as UnderlineIcon,
  Undo2,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ImageUploadDialogAction } from './_image-upload/image-upload.action';
import { YoutubeEmbedDialogAction } from './_youtube/youtube.action';
import { LinkDialogAction } from './_link/link.action';
import { ColorPicker } from '../_components/color-picker';
import { TableInsertAction } from './table-insert.action';
import { ToolbarButton } from '../_components/toolbar-button';
import { useEditorContext } from '../_providers/editor.provider';

function useForceUpdate() {
  const [, setState] = useState(0);
  return useCallback(() => setState((n) => n + 1), []);
}

export function EditorToolbarAction() {
  const { editor, uploadFiles } = useEditorContext();
  const forceUpdate = useForceUpdate();
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // editor 내부 상태 변경(커서 이동, 서식 적용 등) 시 리렌더링 트리거
  useEffect(() => {
    if (!editor) return;
    editor.on('transaction', forceUpdate);
    return () => {
      editor.off('transaction', forceUpdate);
    };
  }, [editor, forceUpdate]);
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [isYoutubeOpen, setIsYoutubeOpen] = useState(false);

  return (
    <div className="sticky top-0 z-10 border-b bg-background px-4 py-2 flex items-center gap-1 flex-wrap">
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
          if (!editor) return;
          if (value === 'paragraph') {
            editor.chain().focus().setParagraph().run();
          } else {
            const level = Number(value.replace('h', '')) as 1 | 2 | 3;
            editor.chain().focus().toggleHeading({ level }).run();
          }
        }}
      >
        <SelectTrigger className="w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="paragraph">
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4" /> 본문
            </div>
          </SelectItem>
          <SelectItem value="h1">
            <div className="flex items-center gap-2">
              <Heading1 className="h-4 w-4" /> 제목 1
            </div>
          </SelectItem>
          <SelectItem value="h2">
            <div className="flex items-center gap-2">
              <Heading2 className="h-4 w-4" /> 제목 2
            </div>
          </SelectItem>
          <SelectItem value="h3">
            <div className="flex items-center gap-2">
              <Heading3 className="h-4 w-4" /> 제목 3
            </div>
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
      <ToolbarButton
        icon={Code}
        tooltip="코드"
        isActive={editor?.isActive('code')}
        onClick={() => editor?.chain().focus().toggleCode().run()}
      />
      <ToolbarButton
        icon={SquareCode}
        tooltip="코드 블록"
        isActive={editor?.isActive('codeBlock')}
        onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
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
      <ToolbarButton
        icon={Images}
        tooltip="갤러리"
        onClick={() => galleryInputRef.current?.click()}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length > 0) uploadFiles?.(files);
          e.target.value = '';
        }}
      />
      <ToolbarButton
        icon={Youtube}
        tooltip="YouTube 영상"
        onClick={() => setIsYoutubeOpen(true)}
      />
      <TableInsertAction editor={editor} />
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
      <LinkDialogAction
        editor={editor}
        open={isLinkOpen}
        onOpenChange={setIsLinkOpen}
      />
      <ImageUploadDialogAction
        editor={editor}
        open={isImageOpen}
        onOpenChange={setIsImageOpen}
      />
      <YoutubeEmbedDialogAction
        editor={editor}
        open={isYoutubeOpen}
        onOpenChange={setIsYoutubeOpen}
      />
    </div>
  );
}
