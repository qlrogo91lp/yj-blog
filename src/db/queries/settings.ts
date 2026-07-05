import { unstable_cache } from 'next/cache';
import { db } from '@/db';
import { CACHE_TAGS } from '@/db/cache-tags';
import { blogSettings } from '@/db/schema';

export const getBlogSettings = unstable_cache(
  async () => db.query.blogSettings.findFirst(),
  [CACHE_TAGS.settings],
  { tags: [CACHE_TAGS.settings] },
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
  data: UpdateBlogSettingsInput,
): Promise<void> {
  await db
    .insert(blogSettings)
    .values({ id: 1, ...data })
    .onConflictDoUpdate({
      target: blogSettings.id,
      set: { ...data, updatedAt: new Date() },
    });
}
