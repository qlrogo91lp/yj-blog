import { db } from '@/db'
import { comments } from '@/db/schema'
import { eq } from 'drizzle-orm'
import type { CommentWithReplies } from '@/types'

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
