import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import type { PostWithCategory, TagSummary } from '@/types';

type Props = {
  post: PostWithCategory;
  priority?: boolean;
  tags?: TagSummary[];
};

export function PostCard({ post, priority = false, tags }: Props) {
  const publishedAt = post.publishedAt
    ? format(new Date(post.publishedAt), 'dd MMM yyyy', { locale: enUS })
    : null;

  return (
    <article className="group relative h-full overflow-hidden rounded-2xl bg-card shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] hover:-translate-y-0.5">
      <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
        {post.thumbnailUrl ? (
          <Image
            src={post.thumbnailUrl}
            alt={post.title}
            fill
            sizes="(max-width: 640px) calc(100vw - 32px), 420px"
            priority={priority}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-muted" />
        )}
      </div>

      <div className="p-5">
        <div className="mb-3 flex items-center justify-between">
          {post.category ? (
            <Link
              href={`/categories/${post.category.slug}`}
              className="relative z-10 text-[10px] font-black tracking-widest text-muted-foreground uppercase hover:text-foreground"
            >
              {post.category.name}
            </Link>
          ) : (
            <span />
          )}
          {publishedAt && (
            <time className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
              {publishedAt}
            </time>
          )}
        </div>

        <h2 className="line-clamp-2 text-lg font-bold leading-snug tracking-tight">
          <Link
            href={`/posts/${post.slug}`}
            className="after:absolute after:inset-0 after:content-['']"
          >
            {post.title}
          </Link>
        </h2>

        {tags && tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag) => (
              <Link
                key={tag.id}
                href={`/tags/${tag.slug}`}
                className="relative z-10 text-[10px] font-medium text-muted-foreground hover:text-foreground"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
