'use client';

import type { Category } from '@/types';
import { BottomBar } from '../_components/bottom-bar';
import { useAutoSave } from '../_hooks/use-auto-save';
import { EditorProvider } from '../_providers/editor-provider';
import { useNewPostStore } from '../_store';
import { CategorySelectorAction } from './category-selector-action';
import { EditorToolbarAction } from './editor-toolbar-action';
import { MarkdownEditorAction } from './markdown-editor-action';
import { TitleInputAction } from './title-input-action';
import { WysiwygEditorAction } from './wysiwyg-editor-action';

type Props = {
  categories: Category[];
};

export function NewPostPageAction({ categories }: Props) {
  const mode = useNewPostStore((s) => s.mode);

  useAutoSave();

  return (
    <EditorProvider>
      <div className="flex flex-1 flex-col">
        <EditorToolbarAction />
        <div className="flex-1 mx-auto w-full max-w-4xl px-6 py-6">
          <CategorySelectorAction categories={categories} />
          <TitleInputAction />
          <div className="mt-4 flex-1">
            {mode === 'wysiwyg' ? (
              <WysiwygEditorAction />
            ) : (
              <MarkdownEditorAction />
            )}
          </div>
        </div>
        <BottomBar />
      </div>
    </EditorProvider>
  );
}
