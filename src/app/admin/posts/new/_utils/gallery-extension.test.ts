import { describe, expect, it } from 'vitest';
import { Editor } from '@tiptap/core';
import { StarterKit } from '@tiptap/starter-kit';
import { Gallery } from './gallery-extension';

function createEditor(content: string) {
  return new Editor({ extensions: [StarterKit, Gallery], content });
}

const twoImages =
  '<div data-gallery>' +
  '<figure><img src="a.png" alt="첫째" width="1600" height="1067"><figcaption>거실</figcaption></figure>' +
  '<figure><img src="b.png" alt="" width="1067" height="1600"></figure>' +
  '</div>';

describe('Gallery extension', () => {
  it('data-gallery를 파싱해 images 배열로 복원한다', () => {
    const editor = createEditor(twoImages);
    let images: unknown = null;
    editor.state.doc.descendants((node) => {
      if (node.type.name === 'gallery') images = node.attrs.images;
      return true;
    });
    expect(images).toEqual([
      { src: 'a.png', alt: '첫째', caption: '거실', width: 1600, height: 1067 },
      { src: 'b.png', alt: '', caption: '', width: 1067, height: 1600 },
    ]);
  });

  it('직렬화하면 figure 구조로 되돌아온다', () => {
    const html = createEditor(twoImages).getHTML();
    expect(html).toContain('data-gallery');
    expect(html).toContain('src="a.png"');
    expect(html).toContain('width="1600"');
    expect(html).toContain('height="1067"');
    expect(html).toContain('<figcaption>거실</figcaption>');
  });

  it('캡션이 비어 있으면 figcaption을 출력하지 않는다', () => {
    const html = createEditor(
      '<div data-gallery><figure><img src="a.png" width="10" height="10"></figure></div>',
    ).getHTML();
    expect(html).not.toContain('figcaption');
  });

  it('width/height가 없으면 0으로 폴백한다', () => {
    const editor = createEditor('<div data-gallery><figure><img src="a.png"></figure></div>');
    let images: { width: number; height: number }[] = [];
    editor.state.doc.descendants((node) => {
      if (node.type.name === 'gallery') images = node.attrs.images;
      return true;
    });
    expect(images[0].width).toBe(0);
    expect(images[0].height).toBe(0);
  });

  it('figure가 없는 빈 갤러리는 빈 배열이 된다', () => {
    const editor = createEditor('<div data-gallery></div>');
    let images: unknown[] = [];
    editor.state.doc.descendants((node) => {
      if (node.type.name === 'gallery') images = node.attrs.images;
      return true;
    });
    expect(images).toEqual([]);
  });
});
