import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { getCategories } from '@/db/queries/categories';
import { selectSeriesList } from '@/db/queries/series';
import { getAllTags } from '@/db/queries/tags';
import { BottomBar } from './_components/bottom-bar';
import { EditorProvider } from './_providers/editor.provider';
import { NewPostResetHandler } from './_handlers/new-post-reset.handler';
import { EditorToolbarAction } from './_actions/editor-toolbar.action';
import { CategorySelectorAction } from './_actions/category-selector.action';
import { SeriesSelectorAction } from './_actions/series-selector.action';
import { TagSelectorAction } from './_actions/tag-selector.action';
import { TitleInputAction } from './_actions/title-input.action';
import { ThumbnailUploadAction } from './_actions/thumbnail-upload.action';
import { SeoSectionAction } from './_actions/seo-section.action';
import { WysiwygEditorAction } from './_actions/wysiwyg-editor.action';
import { AutoSaveProvider } from './_providers/auto-save.provider';

export default async function NewPostPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const [categories, tags, seriesList] = await Promise.all([
    getCategories(),
    getAllTags(),
    selectSeriesList(),
  ]);

  return (
    <EditorProvider>
      <NewPostResetHandler />
      <div className="flex flex-1 flex-col">
        <EditorToolbarAction />
        <div className="flex-1 mx-auto w-full max-w-[calc(var(--article-width)+3rem)] px-6 py-6">
          <CategorySelectorAction categories={categories} />
          <SeriesSelectorAction seriesList={seriesList} />
          <TagSelectorAction allTags={tags} />
          <ThumbnailUploadAction />
          <TitleInputAction />
          <div className="mt-4 flex-1">
            <WysiwygEditorAction />
          </div>
          <SeoSectionAction />
        </div>
        <BottomBar />
      </div>

      <AutoSaveProvider />
    </EditorProvider>
  );
}
