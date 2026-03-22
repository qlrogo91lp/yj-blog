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
    <section className="mx-auto max-w-3xl px-4 py-8 border-t">
      <h2 className="text-xl font-bold mb-6">댓글 {comments.length}개</h2>
      <CommentList comments={comments} postSlug={postSlug} />
      <div className="mt-8">
        <h3 className="text-base font-semibold mb-4">댓글 작성</h3>
        <CommentForm postId={postId} postSlug={postSlug} />
      </div>
    </section>
  );
}
