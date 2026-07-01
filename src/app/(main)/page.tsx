import { selectPosts } from '@/db/queries/posts';
import { HeroSection } from './_components/hero-section';
import { RecentPostsSection } from './_components/recent-posts-section';

export default async function Home() {
  const { items: posts } = await selectPosts({ limit: 5 });

  return (
    <div className="mx-auto max-w-4xl px-4">
      <HeroSection />
      <RecentPostsSection posts={posts} />
    </div>
  );
}
