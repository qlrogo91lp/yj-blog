type PostInput = {
  title: string;
  slug: string;
  excerpt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  thumbnailUrl: string | null;
  publishedAt: Date | null;
  updatedAt: Date | null;
};

type Args = {
  post: PostInput;
  blogName: string;
  baseUrl: string;
};

export function buildArticleJsonLd({
  post,
  blogName,
  baseUrl,
}: Args): Record<string, unknown> {
  const url = `${baseUrl}/posts/${post.slug}`;
  const image = post.thumbnailUrl ?? `${baseUrl}/og-default.png`;
  const headline = post.metaTitle ?? post.title;
  const description = post.metaDescription ?? post.excerpt ?? '';

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline,
    description,
    image,
    datePublished: post.publishedAt
      ? new Date(post.publishedAt).toISOString()
      : undefined,
    dateModified: post.updatedAt
      ? new Date(post.updatedAt).toISOString()
      : undefined,
    author: { '@type': 'Person', name: blogName },
    publisher: {
      '@type': 'Organization',
      name: blogName,
      logo: { '@type': 'ImageObject', url: `${baseUrl}/og-default.png` },
    },
    url,
    mainEntityOfPage: url,
  };
}
