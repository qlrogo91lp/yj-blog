import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import type { GalleryImage } from './gallery-extension';

/**
 * 문서에 남아 있는 이미지 src를 모두 모은다.
 * 여기에 없는 src는 본문에서 삭제된 것으로 보고 R2에서 정리한다.
 */
export function collectImageSrcs(doc: ProseMirrorNode): Set<string> {
  const srcs = new Set<string>();
  doc.descendants((node) => {
    if (node.type.name === 'image' && node.attrs.src) {
      srcs.add(node.attrs.src as string);
    }
    if (node.type.name === 'gallery') {
      const images = (node.attrs.images ?? []) as GalleryImage[];
      images.forEach((image) => {
        if (image.src) srcs.add(image.src);
      });
    }
    return true;
  });
  return srcs;
}
