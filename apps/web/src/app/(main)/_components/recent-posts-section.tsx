import Link from 'next/link';
import { PostTile2up } from '@/components/post/post-tile-2up';
import { PostTileHero } from '@/components/post/post-tile-hero';
import type { PostWithCategory } from '@/types';

type Props = {
  posts: PostWithCategory[];
};

export function RecentPostsSection({ posts }: Props) {
  const [hero, ...rest] = posts;

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
        <p className="py-12 text-center text-muted-foreground">
          아직 작성된 글이 없습니다.
        </p>
      ) : (
        <div className="flex flex-col gap-9">
          <PostTileHero post={hero} priority />
          {rest.length > 0 && (
            <div className="grid gap-9 sm:grid-cols-2">
              {rest.map((post) => (
                <PostTile2up key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
