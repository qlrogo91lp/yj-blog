'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import type { Editor } from '@tiptap/react';

type UploadFiles = (files: File[]) => void;

type EditorContextValue = {
  editor: Editor | null;
  setEditor: (editor: Editor | null) => void;
  uploadFiles: UploadFiles | null;
  setUploadFiles: (fn: UploadFiles | null) => void;
};

const EditorContext = createContext<EditorContextValue>({
  editor: null,
  setEditor: () => {},
  uploadFiles: null,
  setUploadFiles: () => {},
});

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [uploadFiles, setUploadFilesState] = useState<UploadFiles | null>(null);

  // useState에 함수를 그대로 넘기면 업데이터 함수로 해석되므로 한 번 감싼다
  const setUploadFiles = useCallback((fn: UploadFiles | null) => {
    setUploadFilesState(() => fn);
  }, []);

  return (
    <EditorContext.Provider
      value={{ editor, setEditor, uploadFiles, setUploadFiles }}
    >
      {children}
    </EditorContext.Provider>
  );
}

export function useEditorContext() {
  return useContext(EditorContext);
}
