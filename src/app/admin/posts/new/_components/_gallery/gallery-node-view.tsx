'use client';

import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { cn } from '@/lib/utils';
import type { GalleryImage } from '../../_utils/gallery-extension';
import { GallerySlideToolbar } from './gallery-slide-toolbar';

export function GalleryNodeView({
  node,
  updateAttributes,
  deleteNode,
  selected,
}: NodeViewProps) {
  const images = (node.attrs.images ?? []) as GalleryImage[];

  const patch = (index: number, next: Partial<GalleryImage>) => {
    updateAttributes({
      images: images.map((image, i) => (i === index ? { ...image, ...next } : image)),
    });
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    const next = [...images];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    updateAttributes({ images: next });
  };

  const remove = (index: number) => {
    if (images.length <= 1) {
      deleteNode();
      return;
    }
    updateAttributes({ images: images.filter((_, i) => i !== index) });
  };

  return (
    <NodeViewWrapper
      data-gallery=""
      className={cn('my-4', selected && 'ring-2 ring-primary ring-offset-2')}
    >
      {images.map((image, index) => (
        <figure key={`${image.src}-${index}`} className="relative">
          {selected && (
            <div className="absolute left-1/2 top-2 z-10 -translate-x-1/2">
              <GallerySlideToolbar
                index={index}
                total={images.length}
                caption={image.caption}
                alt={image.alt}
                onMove={(to) => move(index, to)}
                onCaptionChange={(caption) => patch(index, { caption })}
                onAltChange={(alt) => patch(index, { alt })}
                onDelete={() => remove(index)}
              />
            </div>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.src}
            alt={image.alt}
            width={image.width || undefined}
            height={image.height || undefined}
          />
          {image.caption && <figcaption>{image.caption}</figcaption>}
        </figure>
      ))}
    </NodeViewWrapper>
  );
}
