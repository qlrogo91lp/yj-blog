import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

type Props = {
  comments: {
    id: number;
    content: string;
    postTitle: string;
    createdAt: Date;
  }[];
  /** 답변 대기 댓글 전체 개수 (사이드바 뱃지와 동일한 값). 목록은 최대 몇 건만 보여줄 수 있어 따로 받는다. */
  totalCount: number;
};

export function PendingCommentsWidget({ comments, totalCount }: Props) {
  return (
    <div className="rounded-2xl border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">새 댓글</h2>
        <span className="bg-muted rounded-full px-2 text-xs">
          {totalCount}
        </span>
      </div>

      {comments.length === 0 ? (
        <p className="text-muted-foreground py-4 text-center text-sm">
          답변 대기 댓글이 없습니다.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {comments.map((comment) => (
            <li key={comment.id}>
              <Link
                href="/admin/comments"
                className="line-clamp-2 text-sm hover:underline"
              >
                &quot;{comment.content}&quot;
              </Link>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {comment.postTitle} ·{' '}
                {formatDistanceToNow(new Date(comment.createdAt), {
                  addSuffix: true,
                  locale: ko,
                })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
