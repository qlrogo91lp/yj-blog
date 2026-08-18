import { golfCounterMeta } from '../golf-counter/_utils/golf-counter-content';

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
    slug: 'golf-counter',
    name: 'GolfCounter',
    description: '골프 라운드 스트로크 카운터 앱',
    iconSrc: '/golf-counter/golf-counter.png',
    platforms: ['ios', 'watch'],
    tags: ['골프', '스포츠'],
    longDescription:
      '라운드 중 스트로크와 퍼팅 수를 애플워치에서 바로 기록하는 앱입니다. 워치가 메인 입력이고, 아이폰에서는 라운드 기록과 통계를 확인합니다.',
    links: [{ label: 'App Store', url: golfCounterMeta.appStoreUrl }],
  },
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
