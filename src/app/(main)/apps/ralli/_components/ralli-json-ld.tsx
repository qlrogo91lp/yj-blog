import { ralliMeta } from '../_utils/ralli-content';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://yjlogs.com';

export function RalliJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: ralliMeta.name,
    applicationCategory: 'SportsApplication',
    operatingSystem: 'iOS, watchOS',
    description: ralliMeta.subtitle,
    url: `${BASE_URL}/apps/ralli`,
    downloadUrl: ralliMeta.appStoreUrl,
    image: `${BASE_URL}${ralliMeta.iconSrc}`,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
