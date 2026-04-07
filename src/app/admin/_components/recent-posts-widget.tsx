import Link from 'next/link';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PostWithCategory } from '@/types';

type Props = {
  posts: PostWithCategory[];
};

export function RecentPostsWidget({ posts }: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">최근 글</CardTitle>
        <Link href="/admin/posts" className="text-xs text-muted-foreground hover:text-foreground">
          전체보기
        </Link>
      </CardHeader>
      <CardContent>
        {posts.length === 0 ? (
          <p className="text-sm text-muted-foreground">글이 없습니다.</p>
        ) : (
          <ul className="space-y-3">
            {posts.map((post) => (
              <li key={post.id} className="flex items-start justify-between gap-2">
                <Link
                  href={`/admin/posts/${post.id}/edit`}
                  className="flex-1 text-sm font-medium hover:underline line-clamp-1"
                >
                  {post.title}
                </Link>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge
                    variant={post.status === 'published' ? 'default' : 'secondary'}
                    className="text-[10px]"
                  >
                    {post.status === 'published' ? '발행' : '임시저장'}
                  </Badge>
                  {post.updatedAt && (
                    <time className="text-[10px] text-muted-foreground">
                      {format(new Date(post.updatedAt), 'M월 d일', { locale: ko })}
                    </time>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
