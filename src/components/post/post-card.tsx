import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import type { PostWithCategory } from '@/types';

type Props = {
  post: PostWithCategory;
};

export function PostCard({ post }: Props) {
  const publishedAt = post.publishedAt
    ? format(new Date(post.publishedAt), 'dd MMM yyyy', { locale: enUS })
    : null;

  return (
    <Link href={`/posts/${post.slug}`} className="block group">
      <article className="h-full overflow-hidden rounded-2xl bg-card shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] hover:-translate-y-0.5">
        {/* 썸네일 */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
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

        {/* 본문 */}
        <div className="p-5">
          {/* 카테고리 + 날짜 */}
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
              {post.category?.name ?? ''}
            </span>
            {publishedAt && (
              <time className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
                {publishedAt}
              </time>
            )}
          </div>

          {/* 제목 */}
          <h2 className="line-clamp-2 text-lg font-bold leading-snug tracking-tight">
            {post.title}
          </h2>
        </div>
      </article>
    </Link>
  );
}
