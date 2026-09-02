'use client';

import { type Editor, useEditorState } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { ImageToolbar } from '../_components/_image-block/image-toolbar';
import type { ImageAlign, ImageSize } from '../_utils/image-extension';

type Props = {
  editor: Editor | null;
};

/**
 * 선택된 본문 이미지 위에 뜨는 툴바.
 * NodeView 내부 absolute 배치 대신 BubbleMenu(floating-ui, flip/shift 내장, portal)로 띄워
 * 이미지 폭이 좁거나 정렬·full-bleed(transform)여도 잘리거나 어긋나지 않는다.
 */
export function ImageBubbleMenuAction({ editor }: Props) {
  const imageAttrs = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      if (!e || !e.isActive('image')) return null;
      const attrs = e.getAttributes('image');
      return {
        size: (attrs.size as ImageSize | undefined) ?? 'default',
        align: (attrs.align as ImageAlign | undefined) ?? 'center',
        alt: (attrs.alt as string | undefined) ?? '',
      };
    },
  });

  if (!editor) return null;

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="imageBubbleMenu"
      shouldShow={({ editor: e }) => e.isActive('image')}
      options={{ placement: 'top', offset: 8 }}
    >
      {imageAttrs && (
        <ImageToolbar
          size={imageAttrs.size}
          align={imageAttrs.align}
          alt={imageAttrs.alt}
          onSizeChange={(size) =>
            editor.chain().focus().updateAttributes('image', { size }).run()
          }
          onAlignChange={(align) =>
            editor.chain().focus().updateAttributes('image', { align }).run()
          }
          onAltChange={(alt) =>
            editor.commands.updateAttributes('image', { alt })
          }
          onDelete={() => editor.chain().focus().deleteSelection().run()}
        />
      )}
    </BubbleMenu>
  );
}
