import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getPostBySlug } from "@/db/queries/posts"
import { markdownToHtml } from "@/lib/markdown"
import { CommentSection } from "./_components/comment-section"
import { Badge } from "@/components/ui/badge"

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return {}

  return {
    title: post.metaTitle ?? post.title,
    description: post.metaDescription ?? post.excerpt ?? undefined,
  }
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post || post.status !== "published") notFound()

  const contentHtml = post.contentFormat === 'html'
    ? post.content
    : await markdownToHtml(post.content)

  const publishedAt = post.publishedAt
    ? format(new Date(post.publishedAt), "yyyy년 M월 d일", { locale: ko })
    : null

  return (
    <>
      <article className="mx-auto max-w-3xl px-4 py-8">
        <header className="mb-8">
          {post.category && (
            <Badge variant="secondary" className="mb-3">
              {post.category.name}
            </Badge>
          )}
          <h1 className="text-3xl font-bold leading-tight mb-4">{post.title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {publishedAt && <time>{publishedAt}</time>}
            <span>{post.views.toLocaleString()}회 조회</span>
          </div>
        </header>

        <div
          className="prose prose-neutral dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />
      </article>

      <CommentSection postId={post.id} postSlug={post.slug} />
    </>
  )
}
