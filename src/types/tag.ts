import type { InferSelectModel } from 'drizzle-orm';
import type { tags } from '@/db/schema';

export type Tag = InferSelectModel<typeof tags>;

export type TagSummary = Pick<Tag, 'id' | 'name' | 'slug'>;

/** 글 수를 함께 집계한 태그 (어드민 태그 보드용) */
export type TagWithCount = Tag & { postCount: number };
