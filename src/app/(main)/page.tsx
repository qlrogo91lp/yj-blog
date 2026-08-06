import { getBlogSettings } from '@/db/queries/settings';
import { selectPosts } from '@/db/queries/posts';
import { HeroSection } from './_components/hero-section';
import { RecentPostsSection } from './_components/recent-posts-section';
import { ContentContainer } from '@/components/layout/content-container';

export default async function Home() {
  const settings = await getBlogSettings();
  const { items: posts } = await selectPosts({ limit: 5 });

  return (
    <ContentContainer>
      <HeroSection
        blogName={settings?.blogName}
        tagline={settings?.tagline}
        authorBio={settings?.authorBio}
      />
      <RecentPostsSection posts={posts} />
    </ContentContainer>
  );
}
