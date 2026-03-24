import { notFound, redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { getCategories } from '@/db/queries/categories';
import { getPostById } from '@/db/queries/posts';
import { BottomBar } from '../../new/_components/bottom-bar';
import { EditorToolbarAction } from '../../new/_actions/editor-toolbar-action';
import { CategorySelectorAction } from '../../new/_actions/category-selector-action';
import { TitleInputAction } from '../../new/_actions/title-input-action';
import { EditorProvider } from '../../new/_providers/editor-provider';
import { AutoSaveProvider } from '../../new/_providers/auto-save-provider';
import { EditorViewHandler } from '../../new/_handlers/editor-view-handler';
import { PostInitHandler } from './_handlers/post-init-handler';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditPostPage({ params }: Props) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const { id } = await params;
  const postId = Number(id);
  if (Number.isNaN(postId)) notFound();

  const [post, categories] = await Promise.all([
    getPostById(postId),
    getCategories(),
  ]);

  if (!post) notFound();

  return (
    <EditorProvider>
      <PostInitHandler post={post} />
      <div className="flex flex-1 flex-col">
        <EditorToolbarAction />
        <div className="flex-1 mx-auto w-full max-w-4xl px-6 py-6">
          <CategorySelectorAction categories={categories} />
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
