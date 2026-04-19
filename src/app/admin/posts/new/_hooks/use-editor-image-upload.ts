import { useCallback } from 'react';
import type { Editor } from '@tiptap/react';
import { toast } from 'sonner';
import { uploadImage } from '../_components/_image-upload/_services/upload-image';
import { useNewPostStore } from '../_store';

export function useEditorImageUpload() {
  const setPostId = useNewPostStore((s) => s.setPostId);

  const uploadAndInsert = useCallback(
    async (editor: Editor, file: File) => {
      if (!file.type.startsWith('image/')) return false;

      if (file.size > 10 * 1024 * 1024) {
        toast.error('파일 크기는 10MB 이하여야 합니다');
        return true;
      }

      const formData = new FormData();
      formData.append('file', file);

      const currentPostId = useNewPostStore.getState().postId;
      const result = await uploadImage(formData, currentPostId, 'content');

      if (result.url) {
        editor.chain().focus().setImage({ src: result.url }).run();
        if (result.postId && !currentPostId) {
          setPostId(result.postId);
        }
      } else if (result.error) {
        toast.error(result.error);
      }

      return true;
    },
    [setPostId],
  );

  return { uploadAndInsert };
}
