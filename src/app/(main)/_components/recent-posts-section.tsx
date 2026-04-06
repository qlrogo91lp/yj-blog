import Link from 'next/link';
import { PostCard } from '@/components/post/post-card';
import type { PostWithCategory } from '@/types';

type Props = {
  posts: PostWithCategory[];
};

export function RecentPostsSection({ posts }: Props) {
  return (
    <section className="pb-16">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold">최근 글</h2>
        <Link
          href="/posts"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          모든 글 보기 →
        </Link>
      </div>
      {posts.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">아직 작성된 글이 없습니다.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {posts.map((post, index) => (
            <PostCard key={post.id} post={post} priority={index === 0} />
          ))}
        </div>
      )}
    </section>
  );
}
