import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { getPostBySlug } from '@/db/queries/posts';
import { markdownToHtmlWithToc, htmlToHtmlWithToc } from '@/lib/markdown';
import { CommentSection } from './_components/comment-section';
import { PostToc } from './_components/post-toc';

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

  const publishedAt = post.publishedAt
    ? format(new Date(post.publishedAt), 'yyyy년 M월 d일', { locale: ko })
    : null;

  return (
    <>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className={cn(toc.length > 0 && 'lg:grid lg:grid-cols-[1fr_220px] lg:gap-12')}>
          <article>
            <header className="mb-8">
              {post.category && (
                <Badge variant="secondary" className="mb-3">
                  {post.category.name}
                </Badge>
              )}
              <h1 className="text-3xl font-bold leading-tight mb-4">
                {post.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {publishedAt && <time>{publishedAt}</time>}
                <span>{post.views.toLocaleString()}회 조회</span>
              </div>
            </header>

            <div
              className="prose prose-neutral dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />

            {post.tags.length > 0 && (
              <footer className="mt-8 pt-6 border-t flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Link key={tag.id} href={`/tags/${tag.slug}`}>
                    <Badge variant="outline">#{tag.name}</Badge>
                  </Link>
                ))}
              </footer>
            )}
          </article>

          {toc.length > 0 &&  <PostToc toc={toc} />}
        </div>
      </div>

      <CommentSection postId={post.id} postSlug={post.slug} />
    </>
  );
}
