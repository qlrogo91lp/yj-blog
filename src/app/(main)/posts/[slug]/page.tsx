import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPostBySlug } from '@/db/queries/posts';
import { markdownToHtmlWithToc, htmlToHtmlWithToc } from '@/lib/markdown';
import { CommentSection } from './_components/comment-section';
import { PostToc } from './_components/post-toc';
import { PostHeader } from './_components/post-header';
import { PostContent } from './_components/post-content';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};

  return {
    title: post.metaTitle ?? post.title,
    description: post.metaDescription ?? post.excerpt ?? undefined,
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post || post.status !== 'published') notFound();

  const { html: contentHtml, toc } =
    post.contentFormat === 'html'
      ? await htmlToHtmlWithToc(post.content)
      : await markdownToHtmlWithToc(post.content);

  return (
    <>
      <div className="relative mx-auto max-w-3xl px-4 py-8">
        <article>
          <PostHeader post={post} />
          <PostContent html={contentHtml} />
        </article>

        {toc.length > 0 && (
          <div className="absolute left-[calc(100%+2rem)] top-8 hidden w-[220px] xl:block">
            <PostToc toc={toc} />
          </div>
        )}
      </div>

      <CommentSection postId={post.id} postSlug={post.slug} />
    </>
  );
}
