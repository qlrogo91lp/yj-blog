import { golfCounterMeta } from '../_utils/golf-counter-content';

export function GolfJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: golfCounterMeta.name,
    applicationCategory: 'SportsApplication',
    operatingSystem: golfCounterMeta.minimumOs,
    url: golfCounterMeta.appStoreUrl,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
