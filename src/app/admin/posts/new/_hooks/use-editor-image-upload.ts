import { useCallback } from 'react';
import type { Editor } from '@tiptap/react';
import { toast } from 'sonner';
import { uploadImage } from '../_services/upload-image';
import { useNewPostStore } from '../_store';
import { replaceUploadingNode } from '../_utils/replace-uploading-node';

export function useEditorImageUpload() {
  const setPostId = useNewPostStore((s) => s.setPostId);

  const uploadAndInsert = useCallback(
    async (editor: Editor, file: File) => {
      if (!file.type.startsWith('image/')) return false;

      if (file.size > 10 * 1024 * 1024) {
        toast.error('파일 크기는 10MB 이하여야 합니다');
        return true;
      }

      const id = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(file);

      editor
        .chain()
        .focus()
        .insertContent({
          type: 'imageUploading',
          attrs: { id, previewUrl },
        })
        .run();

      const formData = new FormData();
      formData.append('file', file);

      const currentPostId = useNewPostStore.getState().postId;
      const result = await uploadImage(formData, currentPostId, 'content');

      if (result.url) {
        replaceUploadingNode(editor, id, {
          type: 'image',
          attrs: { src: result.url },
        });
        if (result.postId && !currentPostId) {
          setPostId(result.postId);
        }
      } else {
        replaceUploadingNode(editor, id, null);
        toast.error(result.error ?? '업로드 실패');
      }

      return true;
    },
    [setPostId],
  );

  return { uploadAndInsert };
}
