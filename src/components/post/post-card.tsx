import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { PostWithCategory } from '@/types';

type Props = {
  post: PostWithCategory;
};

export function PostCard({ post }: Props) {
  const publishedAt = post.publishedAt
    ? format(new Date(post.publishedAt), 'yyyy년 M월 d일', { locale: ko })
    : null;

  return (
    <Link href={`/posts/${post.slug}`} className="block">
      <Card
        className={cn(
          'h-full overflow-hidden transition-shadow hover:shadow-md',
          post.thumbnailUrl && 'pt-0'
        )}
      >
        {post.thumbnailUrl && (
          <div className="relative aspect-video w-full">
            <Image
              src={post.thumbnailUrl}
              alt={post.title}
              fill
              className="object-cover"
            />
          </div>
        )}
        <CardHeader>
          {post.category && (
            <Badge variant="secondary" className="w-fit">
              {post.category.name}
            </Badge>
          )}
          <CardTitle className="line-clamp-2 text-lg">{post.title}</CardTitle>
        </CardHeader>
        {post.excerpt && (
          <CardContent>
            <p className="line-clamp-3 text-sm text-muted-foreground">
              {post.excerpt}
            </p>
          </CardContent>
        )}
        {publishedAt && (
          <CardFooter>
            <time className="text-xs text-muted-foreground">{publishedAt}</time>
          </CardFooter>
        )}
      </Card>
    </Link>
  );
}
