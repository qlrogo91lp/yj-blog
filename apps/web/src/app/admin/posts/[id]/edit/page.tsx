import { notFound, redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { getCategories } from '@/db/queries/categories';
import { selectPostById } from '@/db/queries/posts';
import { selectSeriesList } from '@/db/queries/series';
import { getAllTags, selectTagsByPostId } from '@/db/queries/tags';
import { markdownToHtml } from '@/lib/markdown';
import { BottomBar } from '../../new/_components/bottom-bar';
import { EditorToolbarAction } from '../../new/_actions/editor-toolbar.action';
import { CategorySelectorAction } from '../../new/_actions/category-selector.action';
import { SeriesSelectorAction } from '../../new/_actions/series-selector.action';
import { TagSelectorAction } from '../../new/_actions/tag-selector.action';
import { TitleInputAction } from '../../new/_actions/title-input.action';
import { ThumbnailUploadAction } from '../../new/_actions/thumbnail-upload.action';
import { SeoSectionAction } from '../../new/_actions/seo-section.action';
import { WysiwygEditorAction } from '../../new/_actions/wysiwyg-editor.action';
import { EditorProvider } from '../../new/_providers/editor.provider';
import { AutoSaveProvider } from '../../new/_providers/auto-save.provider';
import { PostInitHandler } from './_handlers/post-init.handler';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditPostPage({ params }: Props) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const { id } = await params;
  const postId = Number(id);
  if (Number.isNaN(postId)) notFound();

  const [post, categories, allTags, postTagList, seriesList] =
    await Promise.all([
      selectPostById(postId),
      getCategories(),
      getAllTags(),
      selectTagsByPostId(postId),
      selectSeriesList(),
    ]);

  if (!post) notFound();

  // 마크다운 포맷 글은 편집기(WYSIWYG 전용)에 넣기 위해 HTML로 변환한다.
  // 사용자가 편집·저장하면 그 시점부터 contentFormat이 'html'로 전환된다.
  const editorContent =
    post.contentFormat === 'markdown'
      ? await markdownToHtml(post.content)
      : post.content;

  return (
    <EditorProvider>
      <PostInitHandler
        post={post}
        content={editorContent}
        initialTagIds={postTagList.map((t) => t.id)}
      />
      <div className="flex flex-1 flex-col">
        <EditorToolbarAction />
        <div className="flex-1 mx-auto w-full max-w-[calc(var(--article-width)+3rem)] px-6 py-6">
          <CategorySelectorAction categories={categories} />
          <SeriesSelectorAction seriesList={seriesList} />
          <TagSelectorAction allTags={allTags} />
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
