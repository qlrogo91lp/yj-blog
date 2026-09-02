export type GolfImageKind = 'ios' | 'watch';

export type GolfImage = {
  src: string;
  alt: string;
  kind: GolfImageKind;
  width: number;
  height: number;
};

const IOS_W = 1284;
const IOS_H = 2778;
const WATCH_W = 422;
const WATCH_H = 514;

function iosImage(src: string, alt: string): GolfImage {
  return { src, alt, kind: 'ios', width: IOS_W, height: IOS_H };
}

function watchImage(src: string, alt: string): GolfImage {
  return { src, alt, kind: 'watch', width: WATCH_W, height: WATCH_H };
}

export const golfCounterMeta = {
  name: 'GolfCounter',
  iconSrc: '/golf-counter/golf-counter.png',
  supportEmail: 'qlrogo91lp@gmail.com',
  appStoreUrl:
    'https://apps.apple.com/us/app/golfcounter-with-watch/id6448967372',
  platformNote: 'Free · watchOS 9.0+',
  minimumOs: 'iOS 16.4, watchOS 9.0',
} as const;

export type GolfStatChip = {
  id: string;
  label: string;
  value: string;
  suffix?: string;
  tone: 'green' | 'orange' | 'fg';
};

export const golfHeroSection = {
  badge: 'Live on Apple Watch & iPhone',
  headingLines: ['Play the round.', 'Not your phone.'],
  body: 'GolfCounter counts strokes, putts, and calories from your wrist — then hands the whole round back to your iPhone.',
  shot: watchImage(
    '/golf-counter/watch-match-en.png',
    'GolfCounter hole score dial on Apple Watch'
  ),
  stageLabel: 'Hole 2 · Par 4 · +3',
  // 값은 전부 스크린샷에 실제로 찍힌 숫자다 (설계 문서 4.4)
  chips: [
    { id: 'total', label: 'TOTAL', value: '46', suffix: '+10', tone: 'green' },
    { id: 'holes', label: 'HOLES', value: '18', tone: 'fg' },
    { id: 'putts', label: 'PUTTS', value: '1.8', suffix: '/hole', tone: 'fg' },
    { id: 'best', label: 'BEST', value: '+9', tone: 'orange' },
  ] satisfies GolfStatChip[],
};

export type GolfCard = {
  id: string;
  title: string;
  body: string;
  image: GolfImage;
};

export const golfCourseSection = {
  id: 'course',
  label: 'ON THE COURSE',
  heading: 'Everything happens on your wrist.',
  body: 'No phone in your pocket. No paper scorecard. Just a tap per stroke.',
  cards: [
    {
      id: 'count',
      title: 'Tap to count',
      body: 'Pick 9 or 18 holes, tap once per stroke, and undo a miscount instantly.',
      image: iosImage(
        '/golf-counter/ios-watch-match-en.png',
        'GolfCounter stroke counter on Apple Watch'
      ),
    },
    {
      id: 'complication',
      title: 'One tap from the watch face',
      body: 'Add the complication and start a round before the first tee.',
      image: watchImage(
        '/golf-counter/watch-complication-en.png',
        'GolfCounter complication on the Apple Watch face'
      ),
    },
    {
      id: 'scorecard',
      title: 'The whole card on your wrist',
      body: 'Total strokes, over-par, and every hole — without reaching for your phone.',
      image: watchImage(
        '/golf-counter/watch-score-en.png',
        'GolfCounter scorecard on Apple Watch'
      ),
    },
  ] satisfies GolfCard[],
};

export type GolfStep = {
  id: string;
  title: string;
  body: string;
  image: GolfImage;
};

export const golfHealthSection = {
  id: 'health',
  label: 'HEALTH',
  heading: 'A round is a workout — logged automatically.',
  steps: [
    {
      id: 'session',
      title: 'Tied to a HealthKit session',
      body: 'Start a round, start a workout. Nothing extra to remember.',
      image: watchImage(
        '/golf-counter/watch-workout-en.png',
        'GolfCounter workout metrics on Apple Watch'
      ),
    },
    {
      id: 'sync',
      title: 'Calories, heart rate, round time',
      body: 'Tracked live on your wrist, then synced to your iPhone.',
      image: iosImage(
        '/golf-counter/connectivity-en.png',
        'GolfCounter on iPhone and Apple Watch together'
      ),
    },
  ] satisfies GolfStep[],
};

export const golfAfterSection = {
  id: 'after',
  label: 'AFTER THE ROUND',
  heading: 'Every round adds up.',
  body: 'Over-par trend, putts per hole, and score distribution — built from the rounds you already played.',
  gallery: [
    iosImage(
      '/golf-counter/ios-stat-en.png',
      'GolfCounter round statistics on iPhone'
    ),
    iosImage(
      '/golf-counter/ios-watch-score-en.png',
      'GolfCounter full scorecard on Apple Watch'
    ),
  ],
};

export type GolfChip = {
  label: string;
  isActive: boolean;
};

export const golfHolesSection = {
  heading: 'Nine or eighteen. Your call.',
  body: 'Set the hole count before you tee off. GolfCounter handles par and over-par from there.',
  chips: [
    { label: '18 holes', isActive: true },
    { label: '9 holes', isActive: false },
  ] satisfies GolfChip[],
  image: watchImage(
    '/golf-counter/watch-home-en.png',
    'GolfCounter hole count selection on Apple Watch'
  ),
};

export const golfFinalCta = {
  heading: 'Ready for the first tee?',
  body: 'Free on the App Store for Apple Watch and iPhone.',
} as const;
