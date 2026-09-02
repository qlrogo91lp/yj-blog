import { Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { GalleryNodeView } from '../_components/_gallery/gallery-node-view';

export type GalleryImage = {
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
};

function toNumber(value: string | null): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function parseFigures(el: HTMLElement): GalleryImage[] {
  return Array.from(el.querySelectorAll('figure')).flatMap((figure) => {
    const img = figure.querySelector('img');
    if (!img) return [];
    return [
      {
        src: img.getAttribute('src') ?? '',
        alt: img.getAttribute('alt') ?? '',
        caption: figure.querySelector('figcaption')?.textContent ?? '',
        width: toNumber(img.getAttribute('width')),
        height: toNumber(img.getAttribute('height')),
      },
    ];
  });
}

export const Gallery = Node.create({
  name: 'gallery',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      images: {
        default: [] as GalleryImage[],
        parseHTML: (el) => parseFigures(el as HTMLElement),
        renderHTML: () => ({}),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-gallery]' }];
  },

  renderHTML({ node }) {
    const images = (node.attrs.images ?? []) as GalleryImage[];
    return [
      'div',
      { 'data-gallery': '' },
      ...images.map((image) => {
        const img = [
          'img',
          {
            src: image.src,
            alt: image.alt,
            ...(image.width ? { width: String(image.width) } : {}),
            ...(image.height ? { height: String(image.height) } : {}),
          },
        ];
        return image.caption
          ? ['figure', {}, img, ['figcaption', {}, image.caption]]
          : ['figure', {}, img];
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(GalleryNodeView);
  },
});
