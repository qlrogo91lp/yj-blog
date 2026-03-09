import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getPostBySlug } from "@/db/queries/posts"
import { markdownToHtml } from "@/lib/markdown"
import { PostDetail } from "./_components/post-detail"

interface Props {
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

  const contentHtml = await markdownToHtml(post.content)

  return <PostDetail post={post} contentHtml={contentHtml} />
}
