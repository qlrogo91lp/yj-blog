import { PostCard } from '@/components/post/post-card';
import { PostListItem } from '@/components/post/post-list-item';
import type { PostWithCategory } from '@/types';

type Props = {
  posts: PostWithCategory[];
  viewType: 'card' | 'list';
};

export function PostListViewHandler({ posts, viewType }: Props) {
  if (posts.length === 0) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        아직 작성된 글이 없습니다.
      </p>
    );
  }

  return viewType === 'card' ? (
    <div className="grid gap-4 sm:grid-cols-2">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  ) : (
    <div className="flex flex-col divide-y">
      {posts.map((post) => (
        <PostListItem key={post.id} post={post} />
      ))}
    </div>
  );
}
