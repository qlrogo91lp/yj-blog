import Image from 'next/image';
import { RalliCtaButton } from './ralli-cta-button';

type Props = {
  name: string;
  tagline: string;
  subtitle: string;
  iconSrc: string;
  appStoreUrl: string;
};

export function RalliHero({ name, tagline, subtitle, iconSrc, appStoreUrl }: Props) {
  return (
    <section className="py-20 text-center">
      <div className="mx-auto max-w-3xl px-4">
        <Image
          src={iconSrc}
          alt={`${name} app icon`}
          width={112}
          height={112}
          className="mx-auto rounded-[22px] shadow-lg"
          priority
        />
        <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">{name}</h1>
        <p className="mt-4 text-xl font-medium text-lime-400">{tagline}</p>
        <p className="mt-2 text-white/60">{subtitle}</p>
        <div className="mt-8">
          <RalliCtaButton appStoreUrl={appStoreUrl} />
        </div>
      </div>
    </section>
  );
}
