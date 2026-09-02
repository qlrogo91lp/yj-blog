export const PROFILE = {
  name: 'YJ',
  headline: '개발하며 배운 것들을 기록합니다.',
  description: 'Frontend · Backend · 일상의 메모',
  ctaLabel: '글 보러가기',
  ctaHref: '/posts',
} as const;

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://yjlogs.com';
