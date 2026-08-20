import { unstable_cache } from 'next/cache';
import { and, count, desc, eq, inArray, isNull, notExists } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '@/db';
import { CACHE_TAGS } from '@/db/cache-tags';
import { comments, posts } from '@/db/schema';
import type { AdminCommentThread, Comment, CommentWithReplies } from '@/types';

async function selectCommentsByPostIdUncached(
  postId: number
): Promise<CommentWithReplies[]> {
  const allComments = await db
    .select()
    .from(comments)
    .where(eq(comments.postId, postId))
    .orderBy(comments.createdAt);

  const map = new Map<number, CommentWithReplies>();
  const roots: CommentWithReplies[] = [];

  for (const c of allComments) {
    map.set(c.id, { ...c, replies: [] });
  }

  for (const c of allComments) {
    const node = map.get(c.id)!;
    if (c.parentId === null) {
      roots.push(node);
    } else {
      map.get(c.parentId)?.replies.push(node);
    }
  }

  return roots;
}

/**
 * 특정 글의 댓글 목록을 트리 구조로 반환
 * 소프트 삭제된 댓글은 포함 (대댓글이 있으면 "삭제된 댓글"로 표시해야 하므로)
 */
export async function selectCommentsByPostId(
  postId: number
): Promise<CommentWithReplies[]> {
  return unstable_cache(
    () => selectCommentsByPostIdUncached(postId),
    ['comments-by-post', String(postId)],
    { tags: [CACHE_TAGS.comments] }
  )();
}

/**
 * 댓글 작성
 */
export async function insertComment(data: {
  postId: number;
  parentId?: number | null;
  authorName: string;
  email?: string | null;
  passwordHash: string;
  content: string;
  isAuthor?: boolean;
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
      isAuthor: data.isAuthor ?? false,
    })
    .returning();

  return result[0];
}

/**
 * 특정 댓글 단건 조회 (비밀번호 검증용)
 */
export async function selectCommentById(
  commentId: number
): Promise<Comment | undefined> {
  const result = await db
    .select()
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1);

  return result[0];
}

/**
 * 댓글 소프트 삭제
 */
export async function softDeleteComment(commentId: number): Promise<void> {
  await db
    .update(comments)
    .set({ isDeleted: true, updatedAt: new Date() })
    .where(eq(comments.id, commentId));
}

/**
 * 관리자 대시보드 최근 댓글 (post title/slug 포함, 최신순)
 */
export const getRecentComments = unstable_cache(
  async (limit = 5) => {
    const result = await db
      .select({
        comment: comments,
        postTitle: posts.title,
        postSlug: posts.slug,
      })
      .from(comments)
      .innerJoin(posts, eq(comments.postId, posts.id))
      .orderBy(desc(comments.createdAt))
      .limit(limit);

    return result.map(({ comment, postTitle, postSlug }) => ({
      ...comment,
      postTitle,
      postSlug,
    }));
  },
  ['admin-recent-comments'],
  { tags: [CACHE_TAGS.comments] }
);

/**
 * 관리자용 댓글 스레드 조회 — 최상위 댓글을 페이지네이션 기준으로 삼고,
 * 그 안에 속한 답글을 전부 함께 반환한다 (post title/slug 포함)
 */
export const getAllCommentsForAdmin = unstable_cache(
  async (
    page = 1,
    limit = 20
  ): Promise<{ comments: AdminCommentThread[]; total: number }> => {
    const offset = (page - 1) * limit;

    const [topLevelRows, totalResult] = await Promise.all([
      db
        .select({
          comment: comments,
          postTitle: posts.title,
          postSlug: posts.slug,
        })
        .from(comments)
        .innerJoin(posts, eq(comments.postId, posts.id))
        .where(isNull(comments.parentId))
        .orderBy(desc(comments.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: count() })
        .from(comments)
        .where(isNull(comments.parentId)),
    ]);

    const topLevelIds = topLevelRows.map(({ comment }) => comment.id);
    const replyRows =
      topLevelIds.length > 0
        ? await db
            .select()
            .from(comments)
            .where(inArray(comments.parentId, topLevelIds))
            .orderBy(comments.createdAt)
        : [];

    const repliesByParent = new Map<number, Comment[]>();
    for (const reply of replyRows) {
      const list = repliesByParent.get(reply.parentId!) ?? [];
      list.push(reply);
      repliesByParent.set(reply.parentId!, list);
    }

    return {
      comments: topLevelRows.map(({ comment, postTitle, postSlug }) => ({
        ...comment,
        postTitle,
        postSlug,
        replies: repliesByParent.get(comment.id) ?? [],
      })),
      total: totalResult[0].total,
    };
  },
  ['admin-comments-list'],
  { tags: [CACHE_TAGS.comments] }
);

const replyComments = alias(comments, 'reply_comments');

/**
 * 답변 대기 중인 최상위 댓글 수 — 대댓글 중 관리자 답글(isAuthor=true)이
 * 하나도 없는, 삭제되지 않은 최상위 댓글의 개수. 사이드바 뱃지에 쓰인다.
 */
export async function getPendingReplyCount(): Promise<number> {
  const result = await db
    .select({ value: count() })
    .from(comments)
    .where(
      and(
        isNull(comments.parentId),
        eq(comments.isDeleted, false),
        notExists(
          db
            .select({ id: replyComments.id })
            .from(replyComments)
            .where(
              and(
                eq(replyComments.parentId, comments.id),
                eq(replyComments.isAuthor, true)
              )
            )
        )
      )
    );

  return result[0].value;
}
