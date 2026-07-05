import type { CommentWithReplies } from '@/types';
import { CommentFormAction } from '../_actions/comment-form.action';
import { CommentList } from './comment-list';

type Props = {
  comments: CommentWithReplies[];
  postId: number;
  postSlug: string;
};

export function CommentSection({ comments, postId, postSlug }: Props) {
  return (
    <section className="mx-auto max-w-3xl border-t px-4 py-8">
      <h2 className="mb-6 text-xl font-bold">댓글 {comments.length}개</h2>

      <div className="mb-8 rounded-2xl border bg-card p-5">
        <h3 className="mb-4 text-base font-semibold">댓글 작성</h3>
        <CommentFormAction postId={postId} postSlug={postSlug} />
      </div>

      <CommentList comments={comments} postSlug={postSlug} />
    </section>
  );
}
