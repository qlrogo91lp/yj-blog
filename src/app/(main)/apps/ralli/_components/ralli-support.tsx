import Link from 'next/link';

type Props = {
  email: string;
};

export function RalliSupport({ email }: Props) {
  return (
    <section className="border-t border-white/10 py-16">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <h2 className="text-2xl font-bold">Need help?</h2>
        <p className="mt-3 text-white/70">
          Questions, bug reports, or feedback are always welcome.
        </p>
        <a
          href={`mailto:${email}`}
          className="mt-4 inline-block text-lg font-semibold text-lime-400 hover:underline"
        >
          {email}
        </a>
        <div className="mt-8 text-sm text-white/50">
          <Link href="/apps/ralli/privacy" className="hover:text-white/80 hover:underline">
            Privacy Policy
          </Link>
        </div>
      </div>
    </section>
  );
}
