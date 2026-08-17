import { describe, expect, it } from 'vitest';
import { Editor } from '@tiptap/core';
import { StarterKit } from '@tiptap/starter-kit';
import { ImageBlock } from './image-extension';
import { collectImageSrcs } from './collect-image-srcs';

function docOf(html: string) {
  return new Editor({ extensions: [StarterKit, ImageBlock], content: html }).state.doc;
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
});
