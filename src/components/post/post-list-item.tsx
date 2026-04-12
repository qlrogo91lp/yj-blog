import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import type { PostWithCategory, TagSummary } from '@/types';

type Props = {
  post: PostWithCategory;
  tags?: TagSummary[];
};

export function PostListItem({ post, tags }: Props) {
  const publishedAt = post.publishedAt
    ? format(new Date(post.publishedAt), 'MMM dd, yyyy', { locale: enUS })
    : null;

  return (
    <article className="group relative flex min-h-35 gap-6 rounded-2xl bg-card shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_16px_40px_rgba(0,0,0,0.07)]">
      <div className="relative w-40 shrink-0 overflow-hidden rounded-l-xl bg-muted sm:w-48">
        {post.thumbnailUrl ? (
          <Image
            src={post.thumbnailUrl}
            alt={post.title}
            fill
            sizes="(max-width: 640px) 160px, 192px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-muted" />
        )}
      </div>

      <div className="flex min-w-0 flex-col justify-center gap-3 p-4">
        <div className="flex items-center gap-2">
          {post.category && (
            <Link
              href={`/categories/${post.category.slug}`}
              className="relative z-10 text-[10px] font-black tracking-widest text-muted-foreground uppercase hover:text-foreground"
            >
              {post.category.name}
            </Link>
          )}
          {publishedAt && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <time className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
                {publishedAt}
              </time>
            </>
          )}
        </div>

        <h2 className="line-clamp-2 text-xl font-bold leading-snug tracking-tight">
          <Link
            href={`/posts/${post.slug}`}
            className="after:absolute after:inset-0 after:content-['']"
          >
            {post.title}
          </Link>
        </h2>

        {post.excerpt && (
          <p className="line-clamp-2 text-sm text-muted-foreground leading-relaxed">
            {post.excerpt}
          </p>
        )}

        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
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
