import { Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ImageUploadingNodeViewAction } from '../_actions/_image-uploading/image-uploading-node-view.action';

export const ImageUploading = Node.create({
  name: 'imageUploading',
  group: 'block',
  atom: true,
  selectable: false,
  draggable: false,

  addAttributes() {
    return {
      id: { default: '' },
      previewUrl: { default: '' },
    };
  },

  parseHTML() {
    return [];
  },

  renderHTML() {
    return ['span', { 'data-image-uploading': '', style: 'display:none' }];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageUploadingNodeViewAction);
  },
});
