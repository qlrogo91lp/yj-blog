import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { getCategories } from '@/db/queries/categories';
import { BottomBar } from './_components/bottom-bar';
import { EditorProvider } from './_providers/editor-provider';
import { EditorViewHandler } from './_handlers/editor-view-handler';
import { EditorToolbarAction } from './_actions/editor-toolbar-action';
import { CategorySelectorAction } from './_actions/category-selector-action';
import { TitleInputAction } from './_actions/title-input-action';
import { ThumbnailUploadAction } from './_actions/thumbnail-upload-action';
import { AutoSaveProvider } from './_providers/auto-save-provider';

export default async function NewPostPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const categories = await getCategories();

  return (
    <EditorProvider>
      <div className="flex flex-1 flex-col">
        <EditorToolbarAction />
        <div className="flex-1 mx-auto w-full max-w-4xl px-6 py-6">
          <CategorySelectorAction categories={categories} />
          <ThumbnailUploadAction />
          <TitleInputAction />
          <div className="mt-4 flex-1">
            <EditorViewHandler />
          </div>
        </div>
        <BottomBar />
      </div>

      <AutoSaveProvider />
    </EditorProvider>
  );
}
