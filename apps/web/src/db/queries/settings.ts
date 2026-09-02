import { unstable_cache } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { CACHE_TAGS } from '@/db/cache-tags';
import { blogSettings } from '@/db/schema';

export const getBlogSettings = unstable_cache(
  async () => db.query.blogSettings.findFirst(),
  [CACHE_TAGS.settings],
  { tags: [CACHE_TAGS.settings] }
);

export type BlogSettings = typeof blogSettings.$inferSelect;

type UpdateBlogSettingsInput = {
  blogName: string;
  tagline?: string;
  authorBio?: string;
  siteUrl?: string;
  defaultMetaDescription?: string;
  socialLinks: Record<string, string>;
};

/**
 * 블로그 설정 upsert (단일 row, id=1)
 */
export async function updateBlogSettings(
  data: UpdateBlogSettingsInput
): Promise<void> {
  await db
    .insert(blogSettings)
    .values({ id: 1, ...data })
    .onConflictDoUpdate({
      target: blogSettings.id,
      set: { ...data, updatedAt: new Date() },
    });
}

/**
 * 유입경로 "항상 제외" 규칙만 갱신한다. blog_settings row(id=1)가
 * 이미 존재한다고 가정한다 — 최초 블로그 설정은 항상 SettingsFormAction으로 먼저 만들어진다.
 */
export async function updateReferrerExcludes(
  excludes: string[]
): Promise<void> {
  await db
    .update(blogSettings)
    .set({ referrerExcludes: excludes, updatedAt: new Date() })
    .where(eq(blogSettings.id, 1));
}
