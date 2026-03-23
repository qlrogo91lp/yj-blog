export type App = {
  slug: string;
  name: string;
  description: string;
  type: 'web' | 'app-store';
  tags: string[];
  longDescription: string;
  links: { label: string; url: string }[];
};

export const apps: App[] = [
  {
    slug: 'timelens',
    name: 'TimeLens',
    description: '공부 시간 타이머 & 통계 시각화 웹앱',
    type: 'web',
    tags: ['타이머', '통계', '생산성'],
    longDescription:
      '실제 공부한 시간을 기록하고 통계로 시각화하는 웹앱입니다. 집중 세션을 추적하고 일별·주별·월별 학습 패턴을 한눈에 확인할 수 있습니다.',
    links: [],
  },
  {
    slug: 'tennis-counter',
    name: 'Tennis Counter',
    description: '테니스 경기 중 점수 카운터 앱',
    type: 'app-store',
    tags: ['테니스', '스포츠', 'iOS'],
    longDescription:
      '테니스 경기 중 점수를 빠르고 편리하게 카운트할 수 있는 iOS 앱입니다. 게임·세트·매치 단위로 점수를 자동 관리합니다.',
    links: [],
  },
];

export function getApp(slug: string): App | undefined {
  return apps.find((app) => app.slug === slug);
}
