import type { Metadata } from 'next';
import Link from 'next/link';
import { ArticleContainer } from '@/components/layout/article-container';
import { SITE_NAME } from '@/lib/constants';
import { haruchiFitMeta } from './_utils/haruchi-fit-content';

export const metadata: Metadata = {
  title: `${haruchiFitMeta.name} | ${SITE_NAME}`,
  description: haruchiFitMeta.tagline,
};

export default function HaruchiFitPage() {
  return (
    <ArticleContainer className="py-12">
      <article className="prose max-w-none">
        <h1>{haruchiFitMeta.name}</h1>
        <p>{haruchiFitMeta.tagline}</p>
        <p>{haruchiFitMeta.platforms} — Coming soon to the App Store.</p>

        <h2>Support</h2>
        <p>
          Questions, bug reports, or feedback:{' '}
          <a href={`mailto:${haruchiFitMeta.supportEmail}`}>
            {haruchiFitMeta.supportEmail}
          </a>
        </p>

        <p>
          <Link href="/apps/haruchi-fit/privacy">Privacy Policy →</Link>
        </p>
      </article>
    </ArticleContainer>
  );
}
