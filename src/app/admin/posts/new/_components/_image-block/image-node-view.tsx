'use client';

import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import type { ImageAlign, ImageSize } from './image-extension';
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
      <img
        src={src}
        alt={alt}
        data-size={size}
        data-align={align}
        className={selected ? 'ring-2 ring-primary ring-offset-2' : ''}
        draggable={false}
      />
    </NodeViewWrapper>
  );
}
