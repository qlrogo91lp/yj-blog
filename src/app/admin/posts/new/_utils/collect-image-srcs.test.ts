import { describe, expect, it } from 'vitest';
import { Editor } from '@tiptap/core';
import { StarterKit } from '@tiptap/starter-kit';
import { ImageBlock } from './image-extension';
import { Gallery } from './gallery-extension';
import { collectImageSrcs } from './collect-image-srcs';

function docOf(html: string) {
  return new Editor({ extensions: [StarterKit, ImageBlock, Gallery], content: html }).state.doc;
}

describe('collectImageSrcs', () => {
  it('단일 이미지의 src를 수집한다', () => {
    const doc = docOf('<p><img src="https://cdn/a.png" /></p>');
    expect(collectImageSrcs(doc)).toEqual(new Set(['https://cdn/a.png']));
  });

  it('이미지가 여러 개면 모두 수집한다', () => {
    const doc = docOf('<p><img src="https://cdn/a.png" /></p><p><img src="https://cdn/b.png" /></p>');
    expect(collectImageSrcs(doc)).toEqual(
      new Set(['https://cdn/a.png', 'https://cdn/b.png']),
    );
  });

  it('이미지가 없으면 빈 Set을 반환한다', () => {
    expect(collectImageSrcs(docOf('<p>텍스트만</p>'))).toEqual(new Set());
  });

  it('갤러리 안의 src도 모두 수집한다', () => {
    const doc = docOf(
      '<div data-gallery>' +
        '<figure><img src="https://cdn/g1.png" width="10" height="10"></figure>' +
        '<figure><img src="https://cdn/g2.png" width="10" height="10"></figure>' +
        '</div>',
    );
    expect(collectImageSrcs(doc)).toEqual(
      new Set(['https://cdn/g1.png', 'https://cdn/g2.png']),
    );
  });

  it('단일 이미지와 갤러리가 섞여 있어도 전부 수집한다', () => {
    const doc = docOf(
      '<p><img src="https://cdn/a.png" /></p>' +
        '<div data-gallery><figure><img src="https://cdn/g1.png" width="10" height="10"></figure></div>',
    );
    expect(collectImageSrcs(doc)).toEqual(
      new Set(['https://cdn/a.png', 'https://cdn/g1.png']),
    );
  });
});
