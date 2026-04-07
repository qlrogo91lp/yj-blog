import Link from 'next/link';
import { getBlogSettings } from '@/db/queries/settings';

export async function HeroSection() {
  const settings = await getBlogSettings();

  const name = settings?.blogName ?? 'YJ';
  const headline = settings?.tagline ?? '개발하며 배운 것들을 기록합니다.';
  const description = settings?.authorBio ?? 'Frontend · Backend · 일상의 메모';

  return (
    <section className="py-20 text-center">
      <h1 className="mb-3 text-4xl font-black tracking-tight">{name}</h1>
      <p className="mb-2 text-lg font-medium text-foreground">{headline}</p>
      <p className="mb-8 text-sm text-muted-foreground">{description}</p>
      <Link
        href="/posts"
        className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-80"
      >
        글 보러가기
      </Link>
    </section>
  );
}
