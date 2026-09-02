import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ArticleContainer } from '@/components/layout/article-container';
import { SITE_NAME } from '@/lib/constants';
import { golfCounterMeta } from '../_utils/golf-counter-content';

export const metadata: Metadata = {
  title: `Privacy Policy — ${golfCounterMeta.name} | ${SITE_NAME}`,
  description: 'Privacy Policy for the GolfCounter app.',
};

export default function GolfCounterPrivacyPage() {
  return (
    <ArticleContainer className="py-12">
      <Link
        href="/apps/golf-counter"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={16} />
        GolfCounter
      </Link>

      <article className="prose mt-8 max-w-none">
        <h1>Privacy Policy</h1>
        <p>
          <strong>Effective date:</strong> August 18, 2026
        </p>
        <p>
          GolfCounter (&ldquo;the app&rdquo;) respects your privacy. This policy
          explains what data the app handles and how.
        </p>

        <h2>Data stored on your device and iCloud</h2>
        <p>
          Your round records (strokes, putts, course, and dates) are stored on
          your device using SwiftData and synced to your personal, private
          iCloud account through Apple CloudKit so they stay in sync across your
          own devices. This data is managed by Apple, and the developer cannot
          access it.
        </p>

        <h2>HealthKit</h2>
        <p>
          With your permission, GolfCounter reads and writes workout sessions,
          heart rate, and active energy (calories) through Apple HealthKit,
          solely to record your golf rounds as workouts. HealthKit data is never
          used for advertising or marketing, and is never shared with third
          parties.
        </p>

        <h2>Watch and iPhone syncing</h2>
        <p>
          GolfCounter uses Apple Watch as the primary input during a round.
          Round data is transferred from your Apple Watch to your iPhone using
          Apple&rsquo;s WatchConnectivity framework and a shared App Group
          container. This transfer happens directly between your own devices and
          never leaves them.
        </p>

        <h2>Data we do not collect</h2>
        <p>
          GolfCounter does not send any data to developer-operated servers. The
          app does not collect your location. There are no analytics SDKs, no
          third-party tracking, no advertising, and no account sign-up. The app
          uses only your Apple ID-based iCloud.
        </p>

        <h2>Children</h2>
        <p>
          GolfCounter is not directed at children under 13 and does not
          knowingly collect personal information from them.
        </p>

        <h2>Changes to this policy</h2>
        <p>
          We may update this policy from time to time. The effective date above
          will change accordingly.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about this policy? Email{' '}
          <a href={`mailto:${golfCounterMeta.supportEmail}`}>
            {golfCounterMeta.supportEmail}
          </a>
          .
        </p>
      </article>
    </ArticleContainer>
  );
}
