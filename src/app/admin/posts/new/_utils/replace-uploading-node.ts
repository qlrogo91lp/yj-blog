import type { Editor } from '@tiptap/core';

type Replacement = {
  type: string;
  attrs?: Record<string, unknown>;
};

export function replaceUploadingNode(
  editor: Editor,
  id: string,
  replacement: Replacement | null,
): void {
  let foundPos: number | null = null;
  let foundSize = 0;

  editor.state.doc.descendants((node, pos) => {
    if (foundPos !== null) return false;
    if (node.type.name === 'imageUploading' && node.attrs.id === id) {
      foundPos = pos;
      foundSize = node.nodeSize;
      return false;
    }
    return true;
  });

  if (foundPos === null) return;

  const tr = editor.state.tr;
  if (replacement) {
    const newNode = editor.schema.nodeFromJSON({
      type: replacement.type,
      attrs: replacement.attrs ?? {},
    });
    tr.replaceWith(foundPos, foundPos + foundSize, newNode);
  } else {
    tr.delete(foundPos, foundPos + foundSize);
  }
  editor.view.dispatch(tr);
}
