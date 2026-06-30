import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import type { PostWithCategoryAndTags } from '@/types';

type Props = {
  post: PostWithCategoryAndTags;
};

export function PostHeader({ post }: Props) {
  const publishedAt = post.publishedAt
    ? format(new Date(post.publishedAt), 'yyyy년 M월 d일', { locale: ko })
    : null;

  return (
    <header className="mb-10">
      <Link
        href="/posts"
        className="mb-8 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
      >
        <span className="flex size-7 items-center justify-center rounded-full border">
          <ChevronLeft size={14} />
        </span>
        목록으로
      </Link>

      {post.category && (
        <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <span className="text-primary">◆</span>
          {post.category.name}
        </p>
      )}

      <h1 className="mb-6 text-4xl font-bold leading-tight sm:text-5xl">
        {post.title}
      </h1>

      <div className="mb-6 flex items-center gap-3 text-sm text-muted-foreground">
        {publishedAt && (
          <>
            <time>{publishedAt}</time>
            <span>·</span>
          </>
        )}
        <span>{post.views.toLocaleString()}회 조회</span>
      </div>

      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Link key={tag.id} href={`/tags/${tag.slug}`}>
              <Badge variant="outline" className="rounded-full">
                #{tag.name}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
