import { db } from '@/db'
import { comments, posts } from '@/db/schema'
import { count, desc, eq } from 'drizzle-orm'
import type { Comment, CommentWithReplies } from '@/types'

/**
 * 특정 글의 댓글 목록을 트리 구조로 반환
 * 소프트 삭제된 댓글은 포함 (대댓글이 있으면 "삭제된 댓글"로 표시해야 하므로)
 */
export async function getCommentsByPostId(postId: number): Promise<CommentWithReplies[]> {
  const allComments = await db
    .select()
    .from(comments)
    .where(eq(comments.postId, postId))
    .orderBy(comments.createdAt)

  const map = new Map<number, CommentWithReplies>()
  const roots: CommentWithReplies[] = []

  for (const c of allComments) {
    map.set(c.id, { ...c, replies: [] })
  }

  for (const c of allComments) {
    const node = map.get(c.id)!
    if (c.parentId === null) {
      roots.push(node)
    } else {
      map.get(c.parentId)?.replies.push(node)
    }
  }

  return roots
}

/**
 * 댓글 작성
 */
export async function createComment(data: {
  postId: number
  parentId?: number | null
  authorName: string
  email?: string | null
  passwordHash: string
  content: string
}): Promise<Comment> {
  const result = await db
    .insert(comments)
    .values({
      postId: data.postId,
      parentId: data.parentId ?? null,
      authorName: data.authorName,
      email: data.email ?? null,
      passwordHash: data.passwordHash,
      content: data.content,
    })
    .returning()

  return result[0]
}

/**
 * 특정 댓글 단건 조회 (비밀번호 검증용)
 */
export async function getCommentById(commentId: number): Promise<Comment | undefined> {
  const result = await db
    .select()
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1)

  return result[0]
}

/**
 * 댓글 소프트 삭제
 */
export async function softDeleteComment(commentId: number): Promise<void> {
  await db
    .update(comments)
    .set({ isDeleted: true, updatedAt: new Date() })
    .where(eq(comments.id, commentId))
}

/**
 * 관리자용 전체 댓글 조회 (post title 포함, 페이지네이션)
 */
export async function getAllCommentsForAdmin(page = 1, limit = 20) {
  const offset = (page - 1) * limit

  const [items, totalResult] = await Promise.all([
    db
      .select({
        comment: comments,
        postTitle: posts.title,
        postSlug: posts.slug,
      })
      .from(comments)
      .innerJoin(posts, eq(comments.postId, posts.id))
      .orderBy(desc(comments.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(comments),
  ])

  return {
    comments: items.map(({ comment, postTitle, postSlug }) => ({
      ...comment,
      postTitle,
      postSlug,
    })),
    total: totalResult[0].total,
  }
}
