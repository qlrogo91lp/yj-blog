import { NextResponse } from 'next/server';
import { getPosts } from '@/db/queries/posts';
import { SITE_NAME, SITE_DESCRIPTION } from '@/lib/constants';
import { siteUrl } from '@/app/(main)/_constants/profile';

export async function GET() {
  const { items } = await getPosts({ limit: 20 });

  const items_xml = items
    .map((post) => {
      const link = `${siteUrl}/posts/${post.slug}`;
      const pubDate = post.publishedAt
        ? new Date(post.publishedAt).toUTCString()
        : new Date(post.createdAt).toUTCString();

      return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      ${post.excerpt ? `<description><![CDATA[${post.excerpt}]]></description>` : ''}
      ${post.category ? `<category><![CDATA[${post.category.name}]]></category>` : ''}
    </item>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title><![CDATA[${SITE_NAME}]]></title>
    <link>${siteUrl}</link>
    <description><![CDATA[${SITE_DESCRIPTION}]]></description>
    <language>ko</language>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml" />
    ${items_xml}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate',
    },
  });
}
