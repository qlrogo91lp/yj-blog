import { Image } from '@tiptap/extension-image';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ImageNodeView } from '../_components/_image-block/image-node-view';

export type ImageSize = 'small' | 'medium' | 'full';
export type ImageAlign = 'left' | 'center' | 'right';

function isImageSize(v: string | null): v is ImageSize {
  return v === 'small' || v === 'medium' || v === 'full';
}

function isImageAlign(v: string | null): v is ImageAlign {
  return v === 'left' || v === 'center' || v === 'right';
}

export const ImageBlock = Image.extend({
  draggable: true,

  addAttributes() {
    return {
      ...this.parent?.(),
      size: {
        default: 'medium' as ImageSize,
        parseHTML: (el) => {
          const v = el.getAttribute('data-size');
          return isImageSize(v) ? v : 'medium';
        },
        renderHTML: (attrs) => ({ 'data-size': attrs.size ?? 'medium' }),
      },
      align: {
        default: 'center' as ImageAlign,
        parseHTML: (el) => {
          const v = el.getAttribute('data-align');
          return isImageAlign(v) ? v : 'center';
        },
        renderHTML: (attrs) => ({ 'data-align': attrs.align ?? 'center' }),
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});
