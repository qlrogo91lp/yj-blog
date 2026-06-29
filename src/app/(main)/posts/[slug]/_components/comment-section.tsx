import { getCommentsByPostId } from '@/db/queries/comments';
import { CommentForm } from './comment-form';
import { CommentList } from './comment-list';

type Props = {
  postId: number;
  postSlug: string;
};

export async function CommentSection({ postId, postSlug }: Props) {
  const comments = await getCommentsByPostId(postId);

  return (
    <section className="mx-auto max-w-3xl border-t px-4 py-8">
      <h2 className="mb-6 text-xl font-bold">댓글 {comments.length}개</h2>

      <div className="mb-8 rounded-2xl border bg-card p-5">
        <h3 className="mb-4 text-base font-semibold">댓글 작성</h3>
        <CommentForm postId={postId} postSlug={postSlug} />
      </div>

      <CommentList comments={comments} postSlug={postSlug} />
    </section>
  );
}
