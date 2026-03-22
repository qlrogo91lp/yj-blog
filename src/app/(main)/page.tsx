import { PostList } from '@/components/post/post-list';
import { getPosts } from '@/db/queries/posts';

export default async function Home() {
  const { items: posts, total } = await getPosts({ limit: 10 });

  return <PostList posts={posts} total={total} />;
}
