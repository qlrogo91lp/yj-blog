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
