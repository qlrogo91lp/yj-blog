import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { selectSeriesBySlug } from '@/db/queries/series';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const seriesDetail = await selectSeriesBySlug(slug);
  if (!seriesDetail || seriesDetail.posts.length === 0) return {};

  const title = seriesDetail.name;
  const description = seriesDetail.description ?? `${seriesDetail.name} 시리즈`;
  const ogImage = seriesDetail.posts.find((p) => p.thumbnailUrl)?.thumbnailUrl;
  const url = `/series/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export default async function SeriesDetailPage({ params }: Props) {
  const { slug } = await params;
  const seriesDetail = await selectSeriesBySlug(slug);

  if (!seriesDetail || seriesDetail.posts.length === 0) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-8">
        <p className="text-sm text-muted-foreground">시리즈</p>
        <h1 className="mt-1 text-2xl font-bold">{seriesDetail.name}</h1>
        {seriesDetail.description && (
          <p className="mt-2 text-muted-foreground">{seriesDetail.description}</p>
        )}
        <p className="mt-2 text-sm text-muted-foreground">
          총 {seriesDetail.posts.length}개의 글
        </p>
      </header>

      <ol className="space-y-4">
        {seriesDetail.posts.map((post, i) => (
          <li key={post.id}>
            <Link
              href={`/posts/${post.slug}`}
              className="group flex gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
            >
              <span className="text-lg font-bold text-muted-foreground">
                {i + 1}
              </span>
              <div className="min-w-0">
                <h2 className="truncate font-medium group-hover:underline">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {post.excerpt}
                  </p>
                )}
                {post.publishedAt && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    <time dateTime={new Date(post.publishedAt).toISOString()}>
                      {format(new Date(post.publishedAt), 'yyyy년 M월 d일', {
                        locale: ko,
                      })}
                    </time>
                  </p>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
