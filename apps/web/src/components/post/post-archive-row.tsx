import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import type { PostWithCategory, TagSummary } from '@/types';

type Props = {
  post: PostWithCategory;
  tags?: TagSummary[];
};

export function PostArchiveRow({ post }: Props) {
  const publishedAt = post.publishedAt
    ? format(new Date(post.publishedAt), 'MMM dd, yyyy', { locale: enUS })
    : null;

  return (
    <article className="group relative flex items-center gap-4 border-b border-border py-4">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
        {post.thumbnailUrl ? (
          <Image
            src={post.thumbnailUrl}
            alt={post.title}
            fill
            sizes="64px"
            className="object-cover"
          />
        ) : (
          <div className="h-full w-full bg-muted" />
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
          {post.category && <span>{post.category.name}</span>}
          {post.category && publishedAt && (
            <span className="text-muted-foreground/40">·</span>
          )}
          {publishedAt && <time>{publishedAt}</time>}
        </div>
        <h2 className="text-base font-bold leading-snug tracking-tight">
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
