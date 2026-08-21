import Image from 'next/image';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import type { AdminPostRow } from '@/types';
import { PostActionsCellAction } from '../_actions/post-actions-cell.action';
import { PostStatusToggleAction } from '../_actions/post-status-toggle.action';

type Props = {
  post: AdminPostRow;
};

export function PostRow({ post }: Props) {
  const isDraft = post.status === 'draft';
  const href = isDraft ? `/admin/posts/${post.id}/edit` : `/posts/${post.slug}`;

  return (
    <li className="flex items-center gap-4 rounded-2xl border p-4">
      <div className="bg-muted text-muted-foreground relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl text-xs">
        {post.thumbnailUrl ? (
          <Image
            src={post.thumbnailUrl}
            alt={post.title || '썸네일'}
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : (
          '썸네일 없음'
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={href}
            className={
              post.title
                ? 'font-semibold hover:underline'
                : 'text-muted-foreground font-semibold italic hover:underline'
            }
          >
            {post.title || '(제목 없음)'}
          </Link>
          {post.category && (
            <Badge variant="secondary">{post.category.name}</Badge>
          )}
          {isDraft && (
            <Badge className="bg-status-draft text-foreground">임시저장</Badge>
          )}
        </div>

        {post.excerpt && (
          <p className="text-muted-foreground mt-1 line-clamp-1 text-sm">
            {post.excerpt}
          </p>
        )}

        <p className="text-muted-foreground mt-1.5 text-xs">
          {isDraft ? (
            <>
              본문 {post.content.length}자 ·{' '}
              {formatDistanceToNow(new Date(post.updatedAt), {
                addSuffix: true,
                locale: ko,
              })}{' '}
              자동 저장
            </>
          ) : (
            <>
              {post.publishedAt &&
                format(new Date(post.publishedAt), 'M월 d일', { locale: ko })}
              {' · '}조회 {post.views.toLocaleString()}
              {' · '}댓글 {post.commentCount}
              {post.tagNames.length > 0 &&
                ` · ${post.tagNames.map((name) => `#${name}`).join(' ')}`}
            </>
          )}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <PostActionsCellAction postId={post.id} postTitle={post.title} />
        <PostStatusToggleAction postId={post.id} status={post.status} />
      </div>
    </li>
  );
}
