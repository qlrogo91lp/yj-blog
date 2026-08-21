'use client';

import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { ImageBlock } from '../_utils/image-extension';
import { ImageUploading } from '../_utils/image-uploading-extension';
import { Link } from '@tiptap/extension-link';
import { Youtube } from '@tiptap/extension-youtube';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableRow } from '@tiptap/extension-table-row';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Underline } from '@tiptap/extension-underline';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { useEditorContext } from '../_providers/editor.provider';
import { useNewPostStore } from '../_store';
import { uploadImage } from '../_services/upload-image';
import { replaceUploadingNode } from '../_utils/replace-uploading-node';
import { Gallery, type GalleryImage } from '../_utils/gallery-extension';
import { readImageSize } from '../_utils/read-image-size';
import { compressImage } from '../_utils/compress-image';
import { ImageBubbleMenuAction } from './image-bubble-menu.action';

const lowlight = createLowlight(common);

export function WysiwygEditorAction() {
  const setContent = useNewPostStore((s) => s.setContent);
  const setPostId = useNewPostStore((s) => s.setPostId);
  const content = useNewPostStore((s) => s.content);
  const { setEditor, setUploadFiles } = useEditorContext();
  const isInitialMount = useRef(true);

  const uploadAndInsert = useCallback(
    async (editorInstance: Editor, file: File) => {
      if (!file.type.startsWith('image/')) return false;

      if (file.size > 10 * 1024 * 1024) {
        toast.error('파일 크기는 10MB 이하여야 합니다');
        return true;
      }

      const id = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(file);

      editorInstance
        .chain()
        .focus()
        .insertContent({
          type: 'imageUploading',
          attrs: { id, previewUrl },
        })
        .run();

      const uploadFile = await compressImage(file);
      const formData = new FormData();
      formData.append('file', uploadFile);

      const currentPostId = useNewPostStore.getState().postId;
      const result = await uploadImage(formData, currentPostId, 'content');

      if (result.url) {
        replaceUploadingNode(editorInstance, id, {
          type: 'image',
          attrs: { src: result.url },
        });
        if (result.postId && !currentPostId) {
          setPostId(result.postId);
        }
      } else {
        replaceUploadingNode(editorInstance, id, null);
        toast.error(result.error ?? '업로드 실패');
      }

      return true;
    },
    [setPostId],
  );

  const uploadFiles = useCallback(
    async (editorInstance: Editor, fileList: File[]) => {
      const images = fileList.filter((f) => f.type.startsWith('image/'));
      const withinLimit = images.filter((f) => f.size <= 10 * 1024 * 1024);
      const rejected = images.length - withinLimit.length;
      if (rejected > 0) {
        toast.error(`${rejected}장이 10MB를 넘어 제외됐습니다`);
      }
      if (withinLimit.length === 0) return true;
      if (withinLimit.length === 1) {
        await uploadAndInsert(editorInstance, withinLimit[0]);
        return true;
      }

      const id = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(withinLimit[0]);
      editorInstance
        .chain()
        .focus()
        .insertContent({
          type: 'imageUploading',
          attrs: { id, previewUrl, total: withinLimit.length },
        })
        .run();

      const uploaded: GalleryImage[] = [];
      let failed = 0;

      // R2 키의 index를 서버가 순차 계산하므로 병렬 호출 시 충돌한다
      for (const file of withinLimit) {
        const uploadFile = await compressImage(file);
        const size = await readImageSize(uploadFile);
        const formData = new FormData();
        formData.append('file', uploadFile);
        const currentPostId = useNewPostStore.getState().postId;
        const result = await uploadImage(formData, currentPostId, 'content');
        if (result.url) {
          uploaded.push({
            src: result.url,
            alt: '',
            caption: '',
            width: size.width,
            height: size.height,
          });
          if (result.postId && !currentPostId) setPostId(result.postId);
        } else {
          failed += 1;
        }
      }

      if (uploaded.length === 0) {
        replaceUploadingNode(editorInstance, id, null);
        toast.error('업로드에 모두 실패했습니다');
        return true;
      }

      replaceUploadingNode(editorInstance, id, {
        type: 'gallery',
        attrs: { images: uploaded },
      });
      if (failed > 0) toast.error(`${failed}장 업로드에 실패했습니다`);
      return true;
    },
    [uploadAndInsert, setPostId],
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: false,
        underline: false,
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({ lowlight }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }),
      Color,
      TextStyle,
      Link.configure({ openOnClick: false }),
      ImageBlock,
      Gallery,
      ImageUploading,
      Youtube.configure({
        nocookie: true,
        allowFullscreen: true,
        width: 640,
        height: 360,
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Placeholder.configure({ placeholder: '내용을 입력하세요...' }),
    ],
    content: content || '',
    editorProps: {
      attributes: {
        class:
          'prose prose-neutral dark:prose-invert max-w-none min-h-[500px] outline-none',
      },
      handleDrop: (_view, event, _slice, moved) => {
        if (moved || !event.dataTransfer?.files.length) return false;
        const files = Array.from(event.dataTransfer.files);
        if (!files.some((f) => f.type.startsWith('image/'))) return false;
        event.preventDefault();
        if (editor) uploadFiles(editor, files);
        return true;
      },
      handlePaste: (_view, event) => {
        const fileList = event.clipboardData?.files;
        if (!fileList?.length) return false;
        const files = Array.from(fileList);
        if (!files.some((f) => f.type.startsWith('image/'))) return false;
        event.preventDefault();
        if (editor) uploadFiles(editor, files);
        return true;
      },
    },
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
    },
  });

  // context에 editor 인스턴스 공유
  useEffect(() => {
    setEditor(editor);
    setUploadFiles(editor ? (files: File[]) => void uploadFiles(editor, files) : null);
    return () => {
      setEditor(null);
      setUploadFiles(null);
    };
  }, [editor, setEditor, setUploadFiles, uploadFiles]);

  // content가 외부에서 변경되었을 때 (수정 페이지 초기화, 모드 전환 등) 에디터 내용 동기화.
  // emitUpdate: false — onUpdate를 타지 않게 해서 초기화가 dirty(changeCount)를 올리지 않도록 한다.
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '', { emitUpdate: false });
    }
  }, [content, editor]);

  return (
    <>
      <EditorContent editor={editor} />
      <ImageBubbleMenuAction editor={editor} />
    </>
  );
}
