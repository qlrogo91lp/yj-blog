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
    <div className="grid gap-6 sm:grid-cols-2">
      {posts.map((post, index) => (
        <PostCard key={post.id} post={post} priority={index === 0} />
      ))}
    </div>
  ) : (
    <div className="flex flex-col gap-4">
      {posts.map((post, index) => (
        <PostListItem key={post.id} post={post} />
      ))}
    </div>
  );
}
