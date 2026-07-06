import type { MetadataRoute } from 'next';
import { selectPosts } from '@/db/queries/posts';
import { apps } from '@/app/(main)/apps/_utils/apps-data';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://yjlogs.com';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { items: posts } = await selectPosts({ limit: 1000 });

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
    ...postEntries,
  ];
}
