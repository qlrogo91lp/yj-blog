import { Editor } from '@tiptap/core';
import { StarterKit } from '@tiptap/starter-kit';
import { describe, expect, it } from 'vitest';
import { ImageUploading } from './image-uploading-extension';

function createEditor(content = '<p></p>') {
  return new Editor({
    extensions: [StarterKit, ImageUploading],
    content,
  });
}

describe('ImageUploading extension', () => {
  it('group=block, atom 스펙을 가진다', () => {
    const editor = createEditor();
    const spec = editor.schema.nodes.imageUploading.spec;
    expect(spec.group).toBe('block');
    expect(spec.atom).toBe(true);
    expect(spec.selectable).toBe(false);
  });

  it('id, previewUrl attribute를 가진다', () => {
    const editor = createEditor();
    const spec = editor.schema.nodes.imageUploading.spec;
    const attrs = spec.attrs ?? {};
    expect(attrs).toHaveProperty('id');
    expect(attrs).toHaveProperty('previewUrl');
  });

  it('직렬화된 HTML에 노드가 노출되지 않는다', () => {
    const editor = createEditor();
    editor
      .chain()
      .insertContent({
        type: 'imageUploading',
        attrs: { id: 'abc', previewUrl: 'blob:fake' },
      })
      .run();
    const html = editor.getHTML();
    expect(html).not.toContain('imageUploading');
    expect(html).not.toContain('blob:fake');
    expect(html).not.toContain('abc');
  });
});
