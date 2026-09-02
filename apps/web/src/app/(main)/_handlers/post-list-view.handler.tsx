import { PostTile2up } from '@/components/post/post-tile-2up';
import { PostArchiveRow } from '@/components/post/post-archive-row';
import type { PostWithCategory, TagSummary } from '@/types';

type Props = {
  posts: PostWithCategory[];
  viewType: 'card' | 'list';
  tagsMap?: Record<number, TagSummary[]>;
};

export function PostListViewHandler({ posts, viewType, tagsMap = {} }: Props) {
  if (posts.length === 0) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        아직 작성된 글이 없습니다.
      </p>
    );
  }

  return viewType === 'card' ? (
    <div className="grid gap-9 sm:grid-cols-2">
      {posts.map((post) => (
        <PostTile2up key={post.id} post={post} tags={tagsMap[post.id]} />
      ))}
    </div>
  ) : (
    <div className="flex flex-col">
      {posts.map((post) => (
        <PostArchiveRow key={post.id} post={post} tags={tagsMap[post.id]} />
      ))}
    </div>
  );
}
