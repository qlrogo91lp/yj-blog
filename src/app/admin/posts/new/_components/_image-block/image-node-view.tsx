'use client';

import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { cn } from '@/lib/utils';
import type { ImageAlign, ImageSize } from '../../_utils/image-extension';
import { ImageToolbar } from './image-toolbar';

export function ImageNodeView({
  node,
  updateAttributes,
  deleteNode,
  selected,
}: NodeViewProps) {
  const size = (node.attrs.size as ImageSize) ?? 'medium';
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
      {selected && (
        <div className="absolute -top-11 left-1/2 z-10 -translate-x-1/2">
          <ImageToolbar
            size={size}
            align={align}
            onSizeChange={(next) => updateAttributes({ size: next })}
            onAlignChange={(next) => updateAttributes({ align: next })}
            onDelete={() => deleteNode()}
          />
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        data-size={size}
        data-align={align}
        className={cn(
          'cursor-grab active:cursor-grabbing',
          selected && 'ring-2 ring-primary ring-offset-2',
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
