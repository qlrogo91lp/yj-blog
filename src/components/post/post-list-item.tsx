import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import type { PostWithCategory } from '@/types';

type Props = {
  post: PostWithCategory;
};

export function PostListItem({ post }: Props) {
  const publishedAt = post.publishedAt
    ? format(new Date(post.publishedAt), 'MMM dd, yyyy', { locale: enUS })
    : null;

  return (
    <Link href={`/posts/${post.slug}`} className="block group">
      <article className="flex gap-6 rounded-2xl bg-card shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_16px_40px_rgba(0,0,0,0.07)]">
        {/* 썸네일 */}
        <div className="relative w-40 shrink-0 overflow-hidden rounded-l-xl bg-muted sm:w-48">
          {post.thumbnailUrl ? (
            <Image
              src={post.thumbnailUrl}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-muted" />
          )}
        </div>

        {/* 텍스트 */}
        <div className="flex min-w-0 flex-col justify-center gap-3 p-4">
          {/* 카테고리 · 날짜 */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
              {post.category?.name ?? ''}
            </span>
            {publishedAt && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <time className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
                  {publishedAt}
                </time>
              </>
            )}
          </div>

          {/* 제목 */}
          <h2 className="line-clamp-2 text-xl font-bold leading-snug tracking-tight">
            {post.title}
          </h2>

          {/* excerpt */}
          {post.excerpt && (
            <p className="line-clamp-2 text-sm text-muted-foreground leading-relaxed">
              {post.excerpt}
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}
