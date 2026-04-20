import { relations } from 'drizzle-orm';
import {
  boolean,
  date,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';


// -----------------------------------------------
// Enums
// -----------------------------------------------

export const postStatusEnum = pgEnum('post_status', ['draft', 'published']);

// -----------------------------------------------
// categories
// -----------------------------------------------

export const categories = pgTable('categories', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(), // URL: /category/[slug]
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// -----------------------------------------------
// posts
// -----------------------------------------------

export const posts = pgTable('posts', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(), // URL: /posts/[slug], SEO-friendly
  content: text('content').notNull().default(''),
  contentFormat: text('content_format').notNull().default('markdown'), // 'markdown' | 'html'
  excerpt: text('excerpt'), // 글 요약 - 목록 미리보기 및 meta description 기본값

  thumbnailUrl: text('thumbnail_url'),

  status: postStatusEnum('status').notNull().default('draft'),
  views: integer('views').notNull().default(0),

  // 분류
  categoryId: integer('category_id').references(() => categories.id, {
    onDelete: 'set null',
  }),

  // SEO - 비워두면 title/excerpt를 fallback으로 사용
  metaTitle: text('meta_title'),
  metaDescription: text('meta_description'),

  publishedAt: timestamp('published_at'), // 발행 시각 (sitemap, 정렬에 사용)
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// -----------------------------------------------
// comments
// -----------------------------------------------

export const comments = pgTable('comments', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  postId: integer('post_id')
    .notNull()
    .references(() => posts.id, { onDelete: 'cascade' }),
  parentId: integer('parent_id'), // null이면 최상위 댓글, 값이 있으면 대댓글

  authorName: text('author_name').notNull(),
  email: text('email'), // nullable — 알림 수신 선택 시만 입력
  passwordHash: text('password_hash').notNull(), // bcrypt 해시 - 수정/삭제 시 검증
  content: text('content').notNull(),

  isDeleted: boolean('is_deleted').notNull().default(false), // 소프트 삭제 (대댓글이 있으면 "삭제된 댓글"로 표시)

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// -----------------------------------------------
// daily_stats (일별 조회수·방문자 통계)
// -----------------------------------------------

export const dailyStats = pgTable('daily_stats', {
  date: date('date').primaryKey(), // 'YYYY-MM-DD' 형태 — natural PK
  views: integer('views').notNull().default(0), // 일별 총 조회수
  visitors: integer('visitors').notNull().default(0), // 일별 순 방문자
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// -----------------------------------------------
// referrers (유입 경로 기록)
// -----------------------------------------------

export const referrers = pgTable('referrers', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  postId: integer('post_id').references(() => posts.id, { onDelete: 'cascade' }), // null이면 글 페이지가 아닌 방문
  referrer: varchar('referrer', { length: 2048 }), // document.referrer 값. 빈 문자열이면 직접 접근
  visitedAt: timestamp('visited_at').defaultNow().notNull(),
});

// -----------------------------------------------
// blog_settings (단일 row, id = 1)
// -----------------------------------------------

export const blogSettings = pgTable('blog_settings', {
  id: integer('id').primaryKey().default(1),
  blogName: varchar('blog_name', { length: 100 }).notNull(),
  tagline: varchar('tagline', { length: 255 }),
  authorBio: text('author_bio'),
  siteUrl: varchar('site_url', { length: 255 }),
  socialLinks: jsonb('social_links').$type<Record<string, string>>(),
  defaultMetaDescription: varchar('default_meta_description', { length: 300 }),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// -----------------------------------------------
// tags
// -----------------------------------------------

export const tags = pgTable('tags', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  slug: varchar('slug', { length: 50 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// -----------------------------------------------
// post_images (게시글-이미지 매핑)
// -----------------------------------------------

export const postImages = pgTable('post_images', {
  id: serial('id').primaryKey(),
  postId: integer('post_id')
    .notNull()
    .references(() => posts.id, { onDelete: 'cascade' }),
  key: text('key').notNull(),
  type: text('type').notNull(), // 'thumbnail' | 'content'
  index: integer('index').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// -----------------------------------------------
// post_tags (N:M)
// -----------------------------------------------

export const postTags = pgTable(
  'post_tags',
  {
    postId: integer('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    tagId: integer('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (t) => ({ pk: primaryKey({ columns: [t.postId, t.tagId] }) }),
);

// -----------------------------------------------
// Relations
// -----------------------------------------------

export const categoriesRelations = relations(categories, ({ many }) => ({
  posts: many(posts),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  category: one(categories, {
    fields: [posts.categoryId],
    references: [categories.id],
  }),
  comments: many(comments),
  referrers: many(referrers),
  postTags: many(postTags),
  postImages: many(postImages),
}));

export const postImagesRelations = relations(postImages, ({ one }) => ({
  post: one(posts, {
    fields: [postImages.postId],
    references: [posts.id],
  }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  postTags: many(postTags),
}));

export const postTagsRelations = relations(postTags, ({ one }) => ({
  post: one(posts, {
    fields: [postTags.postId],
    references: [posts.id],
  }),
  tag: one(tags, {
    fields: [postTags.tagId],
    references: [tags.id],
  }),
}));

export const referrersRelations = relations(referrers, ({ one }) => ({
  post: one(posts, {
    fields: [referrers.postId],
    references: [posts.id],
  }),
}));

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
}));
