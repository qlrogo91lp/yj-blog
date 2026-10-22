import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ArticleContainer } from '@/components/layout/article-container';
import { SITE_NAME } from '@/lib/constants';
import { haruchiFitMeta } from '../_utils/haruchi-fit-content';

export const metadata: Metadata = {
  title: `Privacy Policy — ${haruchiFitMeta.name} | ${SITE_NAME}`,
  description: 'Privacy Policy for the Haruchi Fit workout log app.',
};

export default function HaruchiFitPrivacyPage() {
  return (
    <ArticleContainer className="py-12">
      <Link
        href="/apps/haruchi-fit"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={16} />
        Haruchi Fit
      </Link>

      <article className="prose mt-8 max-w-none">
        <h1>Privacy Policy</h1>
        <p>
          <strong>Effective date:</strong> October 22, 2026
        </p>
        <p>
          Haruchi Fit (&ldquo;the app&rdquo;) respects your privacy. This policy
          explains what data the app handles and how.
        </p>

        <h2>Data stored on your device</h2>
        <p>
          Your workout records (strength and cardio sets, target muscle groups,
          notes, and manually added entries) are stored only on your device
          using SwiftData. The app does not use iCloud or CloudKit, and this
          data is never uploaded anywhere. If you delete the app, these records
          are deleted with it.
        </p>

        <h2>HealthKit</h2>
        <p>
          With your permission, Haruchi Fit uses Apple HealthKit as follows:
        </p>
        <ul>
          <li>
            <strong>iPhone app:</strong> reads workouts, heart rate, and active
            and resting energy (calories), so that workouts recorded by other
            apps can also appear on your activity grid. The iPhone app does not
            write data to HealthKit.
          </li>
          <li>
            <strong>Apple Watch app:</strong> saves the workouts you record with
            it to the Health app, including the heart rate and calories measured
            during the workout.
          </li>
        </ul>
        <p>
          HealthKit data is never used for advertising or marketing, and is
          never shared with third parties.
        </p>

        <h2>Data we do not collect</h2>
        <p>
          Haruchi Fit does not send any data to developer-operated servers.
          There are no analytics SDKs, no crash reporting services, no
          third-party tracking, no advertising, and no account sign-up.
        </p>

        <h2>Children</h2>
        <p>
          Haruchi Fit is not directed at children under 13 and does not
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
          <a href={`mailto:${haruchiFitMeta.supportEmail}`}>
            {haruchiFitMeta.supportEmail}
          </a>
          .
        </p>
      </article>
    </ArticleContainer>
  );
}
