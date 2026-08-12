export type AppPlatform = 'ios' | 'watch' | 'web';

export type App = {
  slug: string;
  name: string;
  description: string;
  iconSrc: string;
  platforms: AppPlatform[];
  tags: string[];
  longDescription: string;
  links: { label: string; url: string }[];
};

export const apps: App[] = [
  {
    slug: 'ralli',
    name: 'Ralli',
    description: '테니스 경기 중 점수 카운터 앱',
    iconSrc: '/ralli/icon1.png',
    platforms: ['ios', 'watch'],
    tags: ['테니스', '스포츠'],
    longDescription:
      '테니스 경기 중 점수를 빠르고 편리하게 카운트할 수 있는 iOS 앱입니다. 게임·세트·매치 단위로 점수를 자동 관리합니다.',
    links: [],
  },
];

export function getApp(slug: string): App | undefined {
  return apps.find((app) => app.slug === slug);
}
