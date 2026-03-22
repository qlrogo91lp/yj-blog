import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import type { PostWithCategory } from '@/types';

interface Props {
  post: PostWithCategory;
}

export function PostListItem({ post }: Props) {
  const publishedAt = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <Link href={`/posts/${post.slug}`} className="block">
      <div className="flex gap-4 rounded-lg p-3 transition-colors hover:bg-muted/50">
        <div className="shrink-0">
          {post.thumbnailUrl ? (
            <Image
              src={post.thumbnailUrl}
              alt={post.title}
              width={80}
              height={80}
              className="rounded-md object-cover"
            />
          ) : (
            <div className="h-20 w-20 rounded-md bg-muted" />
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          {post.category && (
            <Badge variant="secondary" className="w-fit text-xs">
              {post.category.name}
            </Badge>
          )}
          <p className="font-medium leading-snug">{post.title}</p>
          {post.excerpt && (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {post.excerpt}
            </p>
          )}
          {publishedAt && (
            <time className="text-xs text-muted-foreground">{publishedAt}</time>
          )}
        </div>
      </div>
    </Link>
  );
}
