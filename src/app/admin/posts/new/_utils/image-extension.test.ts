import { describe, expect, it } from 'vitest';
import { Editor } from '@tiptap/core';
import { StarterKit } from '@tiptap/starter-kit';
import { ImageBlock } from './image-extension';

function createEditor(content: string) {
  return new Editor({
    extensions: [StarterKit, ImageBlock],
    content,
  });
}

describe('ImageBlock extension', () => {
  it('data-size, data-align 속성이 있는 이미지를 파싱한다', () => {
    const editor = createEditor(
      '<p><img src="a.png" data-size="small" data-align="left" /></p>',
    );
    const html = editor.getHTML();
    expect(html).toContain('data-size="small"');
    expect(html).toContain('data-align="left"');
    expect(html).toContain('src="a.png"');
  });

  it('속성이 없는 기존 이미지는 기본값(medium/center)으로 직렬화된다', () => {
    const editor = createEditor('<p><img src="a.png" /></p>');
    const html = editor.getHTML();
    expect(html).toContain('data-size="medium"');
    expect(html).toContain('data-align="center"');
  });

  it('draggable 스펙이 true이다', () => {
    const editor = createEditor('<p></p>');
    const spec = editor.schema.nodes.image.spec;
    expect(spec.draggable).toBe(true);
  });

  it('data-caption 속성이 있는 이미지를 파싱하고 직렬화한다', () => {
    const editor = createEditor(
      '<p><img src="a.png" data-size="medium" data-align="center" data-caption="강남역 저녁" /></p>',
    );
    const html = editor.getHTML();
    expect(html).toContain('data-caption="강남역 저녁"');
  });

  it('caption이 비어있으면 data-caption 속성을 출력하지 않는다', () => {
    const editor = createEditor('<p><img src="a.png" /></p>');
    const html = editor.getHTML();
    expect(html).not.toContain('data-caption');
  });
});
