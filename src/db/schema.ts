import { boolean, date, integer, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// -----------------------------------------------
// Enums
// -----------------------------------------------

export const postStatusEnum = pgEnum('post_status', ['draft', 'published'])

// -----------------------------------------------
// categories
// -----------------------------------------------

export const categories = pgTable('categories', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),      // URL: /category/[slug]
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// -----------------------------------------------
// posts
// -----------------------------------------------

export const posts = pgTable('posts', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),      // URL: /posts/[slug], SEO-friendly
  content: text('content').notNull().default(''),
  contentFormat: text('content_format').notNull().default('markdown'), // 'markdown' | 'html'
  excerpt: text('excerpt'),                   // 글 요약 - 목록 미리보기 및 meta description 기본값

  thumbnailUrl: text('thumbnail_url'),

  status: postStatusEnum('status').notNull().default('draft'),
  views: integer('views').notNull().default(0),

  // 분류
  categoryId: integer('category_id').references(() => categories.id, { onDelete: 'set null' }),

  // SEO - 비워두면 title/excerpt를 fallback으로 사용
  metaTitle: text('meta_title'),
  metaDescription: text('meta_description'),

  publishedAt: timestamp('published_at'),     // 발행 시각 (sitemap, 정렬에 사용)
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// -----------------------------------------------
// comments
// -----------------------------------------------

export const comments = pgTable('comments', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  postId: integer('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  parentId: integer('parent_id'),             // null이면 최상위 댓글, 값이 있으면 대댓글

  authorName: text('author_name').notNull(),
  passwordHash: text('password_hash').notNull(), // bcrypt 해시 - 수정/삭제 시 검증
  content: text('content').notNull(),

  isDeleted: boolean('is_deleted').notNull().default(false), // 소프트 삭제 (대댓글이 있으면 "삭제된 댓글"로 표시)

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// -----------------------------------------------
// daily_stats (일별 조회수·방문자 통계)
// -----------------------------------------------

export const dailyStats = pgTable('daily_stats', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  date: date('date').notNull().unique(),         // 'YYYY-MM-DD' 형태
  views: integer('views').notNull().default(0),  // 일별 총 조회수
  visitors: integer('visitors').notNull().default(0), // 일별 순 방문자
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// -----------------------------------------------
// Relations
// -----------------------------------------------

export const categoriesRelations = relations(categories, ({ many }) => ({
  posts: many(posts),
}))

export const postsRelations = relations(posts, ({ one, many }) => ({
  category: one(categories, {
    fields: [posts.categoryId],
    references: [categories.id],
  }),
  comments: many(comments),
}))

export const commentsRelations = relations(comments, ({ one, many }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
    relationName: 'replies',
  }),
  replies: many(comments, { relationName: 'replies' }),
}))
