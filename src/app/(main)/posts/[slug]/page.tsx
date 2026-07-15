import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { selectPostBySlug } from '@/db/queries/posts';
import { selectCommentsByPostId } from '@/db/queries/comments';
import { getBlogSettings } from '@/db/queries/settings';
import { selectSeriesPosts } from '@/db/queries/series';
import { markdownToHtmlWithToc, htmlToHtmlWithToc } from '@/lib/markdown';
import { SITE_NAME } from '@/lib/constants';
import { CommentSection } from './_components/comment-section';
import { PostHeader } from './_components/post-header';
import { ArticleJsonLd } from './_components/article-json-ld';
import { SeriesPrevNext } from './_components/series-prev-next';
import { PostTocAction } from './_actions/post-toc.action';
import { PostContentAction } from './_actions/post-content.action';
import { SeriesBoxAction } from './_actions/series-box.action';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await selectPostBySlug(slug);
  if (!post || post.status !== 'published') return {};

  const title = post.metaTitle ?? post.title;
  const description = post.metaDescription ?? post.excerpt ?? undefined;
  const ogImage = post.thumbnailUrl ?? '/og-default.png';
  const url = `/posts/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title,
      description,
      url,
      images: [ogImage],
      publishedTime: post.publishedAt
        ? new Date(post.publishedAt).toISOString()
        : undefined,
      modifiedTime: post.updatedAt
        ? new Date(post.updatedAt).toISOString()
        : undefined,
      tags: post.tags.map((t) => t.name),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const [post, settings] = await Promise.all([
    selectPostBySlug(slug),
    getBlogSettings().catch(() => null),
  ]);

  if (!post || post.status !== 'published') notFound();

  const [{ html: contentHtml, toc }, comments, seriesNav] = await Promise.all([
    post.contentFormat === 'html'
      ? htmlToHtmlWithToc(post.content)
      : markdownToHtmlWithToc(post.content),
    selectCommentsByPostId(post.id),
    post.seriesId ? selectSeriesPosts(post.seriesId) : Promise.resolve(null),
  ]);

  const seriesIndex = seriesNav
    ? seriesNav.posts.findIndex((p) => p.id === post.id)
    : -1;
  const hasSeries = seriesNav !== null && seriesIndex !== -1;

  return (
    <>
      <ArticleJsonLd
        post={post}
        blogName={settings?.blogName ?? SITE_NAME}
        baseUrl={process.env.NEXT_PUBLIC_SITE_URL ?? 'https://yjlogs.com'}
      />
      <div className="relative mx-auto max-w-3xl px-4 py-8">
        <article>
          <PostHeader post={post} />
          {hasSeries && (
            <SeriesBoxAction
              name={seriesNav.name}
              slug={seriesNav.slug}
              posts={seriesNav.posts}
              currentPostId={post.id}
            />
          )}
          <PostContentAction html={contentHtml} />
          {hasSeries && (
            <SeriesPrevNext
              prev={seriesNav.posts[seriesIndex - 1] ?? null}
              next={seriesNav.posts[seriesIndex + 1] ?? null}
            />
          )}
        </article>

        {toc.length > 0 && (
          <div className="absolute left-[calc(100%+2rem)] top-0 hidden h-full w-55 min-[1340px]:block">
            <PostTocAction toc={toc} />
          </div>
        )}
      </div>

      <CommentSection comments={comments} postId={post.id} postSlug={post.slug} />
    </>
  );
}
