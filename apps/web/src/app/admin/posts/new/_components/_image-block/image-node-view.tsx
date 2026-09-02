'use client';

import { type NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import { cn } from '@/lib/utils';
import type { ImageAlign, ImageSize } from '../../_utils/image-extension';

/**
 * 본문 이미지 NodeView.
 * - 툴바는 여기 두지 않는다 — 에디터 레벨 ImageBubbleMenuAction이 담당(폭·overflow 문제 회피).
 * - <img>가 드래그 핸들: TipTap React NodeView는 [data-drag-handle]에서 시작한 드래그만 노드 이동으로 처리한다.
 */
export function ImageNodeView({
  node,
  updateAttributes,
  selected,
}: NodeViewProps) {
  const size = (node.attrs.size as ImageSize) ?? 'default';
  const align = (node.attrs.align as ImageAlign) ?? 'center';
  const src = node.attrs.src as string;
  const alt = (node.attrs.alt as string) ?? '';
  const caption = (node.attrs.caption as string) ?? '';

  return (
    <NodeViewWrapper
      as="figure"
      className="relative my-4"
      data-size={size}
      data-align={align}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        data-size={size}
        data-align={align}
        data-drag-handle
        className={cn(
          'cursor-grab active:cursor-grabbing',
          selected && 'ring-2 ring-primary ring-offset-2'
        )}
      />
      {(selected || caption) && (
        <input
          type="text"
          value={caption}
          onChange={(e) => updateAttributes({ caption: e.target.value })}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter') {
              e.preventDefault();
              (e.target as HTMLInputElement).blur();
            }
          }}
          placeholder="캡션 추가..."
          className="mt-1.5 w-full border-0 border-b border-muted-foreground/30 bg-transparent px-0 py-0.5 text-sm italic text-muted-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-0"
        />
      )}
    </NodeViewWrapper>
  );
}
