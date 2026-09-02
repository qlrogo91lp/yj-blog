import { Editor } from '@tiptap/core';
import { StarterKit } from '@tiptap/starter-kit';
import { describe, expect, it } from 'vitest';
import { ImageBlock } from './image-extension';
import { ImageUploading } from './image-uploading-extension';
import { replaceUploadingNode } from './replace-uploading-node';

function createEditor() {
  return new Editor({
    extensions: [StarterKit, ImageBlock, ImageUploading],
    content: '<p></p>',
  });
}

function insertUploading(editor: Editor, id: string) {
  editor
    .chain()
    .insertContent({
      type: 'imageUploading',
      attrs: { id, previewUrl: 'blob:fake' },
    })
    .run();
}

describe('replaceUploadingNode', () => {
  it('id에 해당하는 노드를 imageBlock으로 교체한다', () => {
    const editor = createEditor();
    insertUploading(editor, 'target');

    replaceUploadingNode(editor, 'target', {
      type: 'image',
      attrs: { src: 'https://r2/x.png' },
    });

    const html = editor.getHTML();
    expect(html).toContain('src="https://r2/x.png"');
    expect(html).not.toContain('data-image-uploading');
  });

  it('replacement가 null이면 노드를 제거한다', () => {
    const editor = createEditor();
    insertUploading(editor, 'target');

    replaceUploadingNode(editor, 'target', null);

    const html = editor.getHTML();
    expect(html).not.toContain('data-image-uploading');
  });

  it('id가 일치하지 않으면 아무것도 하지 않는다', () => {
    const editor = createEditor();
    insertUploading(editor, 'a');
    const before = editor.getHTML();

    replaceUploadingNode(editor, 'b', null);

    expect(editor.getHTML()).toBe(before);
  });

  it('여러 placeholder 중 일치하는 id만 교체한다', () => {
    const editor = createEditor();
    insertUploading(editor, 'a');
    insertUploading(editor, 'b');

    replaceUploadingNode(editor, 'b', {
      type: 'image',
      attrs: { src: 'https://r2/b.png' },
    });

    const html = editor.getHTML();
    expect(html).toContain('src="https://r2/b.png"');
  });
});
