export type RalliImageKind = 'ios' | 'watch';

export type RalliImage = {
  src: string;
  alt: string;
  kind: RalliImageKind;
  width: number;
  height: number;
};

const IOS_W = 1284;
const IOS_H = 2778;
const WATCH_W = 422;
const WATCH_H = 514;

function iosImage(src: string, alt: string): RalliImage {
  return { src, alt, kind: 'ios', width: IOS_W, height: IOS_H };
}

function watchImage(src: string, alt: string): RalliImage {
  return { src, alt, kind: 'watch', width: WATCH_W, height: WATCH_H };
}

export const ralliMeta = {
  name: 'Ralli',
  tagline: 'Tennis scores, right on your wrist.',
  subtitle: 'A score-counting companion for tennis players.',
  iconSrc: '/ralli/icon1.png',
  supportEmail: 'qlrogo91lp@gmail.com',
  appStoreUrl: 'https://apps.apple.com/us/app/ralli/id6449350578',
} as const;

export type RalliFeature = {
  id: string;
  heading: string;
  bullets: string[];
  images: RalliImage[];
};

export const ralliFeatures: RalliFeature[] = [
  {
    id: 'on-the-wrist',
    heading: 'On the court, all on your wrist',
    bullets: [
      'Score, pick a format, and check results — entirely from Apple Watch',
      'Launch the app from your watch face with a complication',
      'At a glance on the Lock Screen and Dynamic Island',
    ],
    images: [
      watchImage('/ralli/watch-match-global.png', 'Ralli match score on Apple Watch'),
      watchImage('/ralli/watch-complication-global.png', 'Ralli complication on the Apple Watch face'),
    ],
  },
  {
    id: 'match-is-a-workout',
    heading: 'A match is a workout — logged automatically',
    bullets: [
      'Seamlessly tied to a HealthKit workout session',
      'Calories, heart rate, and workout time tracked automatically',
      'Syncs with the Apple Fitness app',
    ],
    images: [
      watchImage('/ralli/watch-workout-global.png', 'Ralli workout metrics on Apple Watch'),
      iosImage('/ralli/ios-workout-global.png', 'Ralli workout metrics on iPhone'),
    ],
  },
  {
    id: 'replay-on-iphone',
    heading: 'Replay every match on iPhone',
    bullets: [
      'Set-by-set scores, kcal, and workout time in detail',
      'Your tennis days stacked on a calendar, automatically',
      'Monthly and lifetime stats',
    ],
    images: [
      iosImage('/ralli/ios-summary-global.png', 'Ralli match summary stats on iPhone'),
      iosImage('/ralli/ios-live-global.png', 'Ralli Live Activity on the iPhone Lock Screen'),
    ],
  },
  {
    id: 'your-own-rules',
    heading: 'Play by your own rules',
    bullets: [
      'Customizable set length: 4, 5, or 6 games',
      'No-ad, no-tie, and tiebreak support',
      'Start with the rules you actually play',
    ],
    images: [
      watchImage('/ralli/watch-mode-global.png', 'Ralli match format on Apple Watch'),
      iosImage('/ralli/ios-mode-global.png', 'Ralli match format selection on iPhone'),
    ],
  },
];

export const ralliScreenshots: RalliImage[] = [
  iosImage('/ralli/ios-match-global.png', 'Ralli match score on iPhone'),
  iosImage('/ralli/connectivity-global.png', 'Ralli on iPhone and Apple Watch together'),
  iosImage('/ralli/ios-mode-global.png', 'Ralli match format selection on iPhone'),
  iosImage('/ralli/ios-workout-global.png', 'Ralli workout metrics on iPhone'),
  iosImage('/ralli/ios-summary-global.png', 'Ralli match summary stats on iPhone'),
  iosImage('/ralli/ios-live-global.png', 'Ralli Live Activity on the iPhone Lock Screen'),
  watchImage('/ralli/watch-home-global.png', 'Ralli home on Apple Watch'),
  watchImage('/ralli/watch-match-global.png', 'Ralli match score on Apple Watch'),
  watchImage('/ralli/watch-mode-global.png', 'Ralli match format on Apple Watch'),
  watchImage('/ralli/watch-complication-global.png', 'Ralli complication on the Apple Watch face'),
  watchImage('/ralli/watch-workout-global.png', 'Ralli workout metrics on Apple Watch'),
];
