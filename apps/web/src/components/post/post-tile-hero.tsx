import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import type { PostWithCategory, TagSummary } from '@/types';

type Props = {
  post: PostWithCategory;
  tags?: TagSummary[];
  priority?: boolean;
};

export function PostTileHero({ post, priority = false }: Props) {
  const publishedAt = post.publishedAt
    ? format(new Date(post.publishedAt), 'dd MMM yyyy', { locale: enUS })
    : null;

  return (
    <article className="group relative aspect-[980/362] w-full overflow-hidden rounded-card bg-muted">
      {post.thumbnailUrl ? (
        <Image
          src={post.thumbnailUrl}
          alt={post.title}
          fill
          sizes="(max-width: 980px) 100vw, 980px"
          priority={priority}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="h-full w-full bg-muted" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8">
        <div className="mb-2 flex items-center gap-2 text-[11px] font-bold tracking-widest text-white/80 uppercase">
          {post.category && <span>{post.category.name}</span>}
          {post.category && publishedAt && (
            <span className="text-white/40">·</span>
          )}
          {publishedAt && <time>{publishedAt}</time>}
        </div>
        <h2 className="max-w-2xl text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl">
          <Link
            href={`/posts/${post.slug}`}
            className="block after:absolute after:inset-0 after:content-['']"
          >
            <span className="line-clamp-2">{post.title}</span>
          </Link>
        </h2>
      </div>
    </article>
  );
}
