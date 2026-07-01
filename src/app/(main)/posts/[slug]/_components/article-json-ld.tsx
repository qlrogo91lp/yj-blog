import { buildArticleJsonLd } from '../_utils/build-article-json-ld';

type Props = {
  post: {
    title: string;
    slug: string;
    excerpt: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
    thumbnailUrl: string | null;
    publishedAt: Date | null;
    updatedAt: Date | null;
  };
  blogName: string;
  baseUrl: string;
};

export function ArticleJsonLd({ post, blogName, baseUrl }: Props) {
  const json = buildArticleJsonLd({ post, blogName, baseUrl });

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
