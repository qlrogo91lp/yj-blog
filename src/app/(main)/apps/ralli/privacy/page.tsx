import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { SITE_NAME } from '@/lib/constants';
import { ralliMeta } from '../_utils/ralli-content';

export const metadata: Metadata = {
  title: `Privacy Policy — ${ralliMeta.name} | ${SITE_NAME}`,
  description: 'Privacy Policy for the Ralli tennis score app.',
};

export default function RalliPrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Link
        href="/apps/ralli"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={16} />
        Ralli
      </Link>

      <article className="prose mt-8 max-w-none">
        <h1>Privacy Policy</h1>
        <p>
          <strong>Effective date:</strong> May 28, 2026
        </p>
        <p>
          Ralli (&ldquo;the app&rdquo;) respects your privacy. This policy explains what data the
          app handles and how.
        </p>

        <h2>Data stored on your device and iCloud</h2>
        <p>
          Your match records (scores, sets, and dates) are stored on your device using SwiftData and
          synced to your personal, private iCloud account through Apple CloudKit so they stay in
          sync across your own devices. This data is managed by Apple, and the developer cannot
          access it.
        </p>

        <h2>HealthKit</h2>
        <p>
          With your permission, Ralli reads and writes workout sessions, heart rate, active energy
          (calories), and workout duration through Apple HealthKit, solely to record your tennis
          matches as workouts. HealthKit data is never used for advertising or marketing, and is
          never shared with third parties.
        </p>

        <h2>Data we do not collect</h2>
        <p>
          Ralli does not send any data to developer-operated servers. There are no analytics SDKs,
          no third-party tracking, no advertising, and no account sign-up. The app uses only your
          Apple ID-based iCloud.
        </p>

        <h2>Children</h2>
        <p>
          Ralli is not directed at children under 13 and does not knowingly collect personal
          information from them.
        </p>

        <h2>Changes to this policy</h2>
        <p>
          We may update this policy from time to time. The effective date above will change
          accordingly.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about this policy? Email{' '}
          <a href={`mailto:${ralliMeta.supportEmail}`}>{ralliMeta.supportEmail}</a>.
        </p>
      </article>
    </div>
  );
}
