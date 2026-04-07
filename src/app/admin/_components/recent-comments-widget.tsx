import Link from 'next/link';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type RecentComment = {
  id: number;
  authorName: string;
  content: string;
  createdAt: Date;
  postTitle: string;
  postSlug: string;
};

type Props = {
  comments: RecentComment[];
};

export function RecentCommentsWidget({ comments }: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">최근 댓글</CardTitle>
        <Link href="/admin/comments" className="text-xs text-muted-foreground hover:text-foreground">
          전체보기
        </Link>
      </CardHeader>
      <CardContent>
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">댓글이 없습니다.</p>
        ) : (
          <ul className="space-y-3">
            {comments.map((comment) => (
              <li key={comment.id} className="space-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{comment.authorName}</span>
                  <time className="text-[10px] text-muted-foreground">
                    {format(new Date(comment.createdAt), 'M월 d일', { locale: ko })}
                  </time>
                </div>
                <p className="line-clamp-1 text-xs text-muted-foreground">{comment.content}</p>
                <Link
                  href={`/posts/${comment.postSlug}#comments`}
                  className="text-[10px] text-muted-foreground hover:text-foreground hover:underline"
                >
                  {comment.postTitle}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
