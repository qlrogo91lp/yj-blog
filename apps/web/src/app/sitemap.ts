import type { MetadataRoute } from 'next';
import { selectPosts } from '@/db/queries/posts';
import { selectSeriesList } from '@/db/queries/series';
import { apps } from '@/app/(main)/apps/_utils/apps-data';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://yjlogs.com';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ items: posts }, seriesList] = await Promise.all([
    selectPosts({ limit: 1000 }),
    selectSeriesList(),
  ]);

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${BASE_URL}/posts/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const appEntries: MetadataRoute.Sitemap = apps.map((app) => ({
    url: `${BASE_URL}/apps/${app.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  const seriesEntries: MetadataRoute.Sitemap = seriesList
    .filter((s) => s.postCount > 0)
    .map((s) => ({
      url: `${BASE_URL}/series/${s.slug}`,
      lastModified: s.lastPublishedAt ?? s.createdAt,
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/posts`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/apps`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    ...appEntries,
    {
      url: `${BASE_URL}/series`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...seriesEntries,
    ...postEntries,
  ];
}
