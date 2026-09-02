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
  taglineLines: ['Tennis scores,', 'right on your wrist.'],
  subtitle: 'Score, track, and replay every match — without ever pulling out your phone.',
  platforms: 'Apple Watch · iPhone',
  iconSrc: '/ralli/icon1.png',
  supportEmail: 'qlrogo91lp@gmail.com',
  appStoreUrl: 'https://apps.apple.com/us/app/ralli/id6449350578',
} as const;

export const ralliHeroLetters = ['R', 'A', 'L', 'L', 'I'] as const;

export const ralliHeroShot = watchImage(
  '/ralli/watch-match-global.png',
  'Ralli match score on Apple Watch',
);

export const ralliMarqueeItems = [
  '15 — 0',
  'HEALTHKIT SYNCED',
  '40 — 30',
  'NO ADS',
  'DEUCE',
  'COMPLICATION READY',
  'TIEBREAK',
] as const;

export type RalliStep = {
  id: string;
  title: string;
  body: string;
  image: RalliImage;
};

export const ralliWatchSection = {
  id: 'watch',
  label: '01 — ON THE COURT',
  heading: 'All on your wrist.',
  steps: [
    {
      id: 'score',
      title: 'Score without your phone',
      body: 'Pick a format, tap to score, check results — entirely from Apple Watch.',
      image: watchImage('/ralli/watch-match-global.png', 'Ralli match score on Apple Watch'),
    },
    {
      id: 'complication',
      title: 'One tap from your watch face',
      body: 'Add the complication and start a match the second you step on court.',
      image: watchImage(
        '/ralli/watch-complication-global.png',
        'Ralli complication on the Apple Watch face',
      ),
    },
    {
      id: 'live',
      title: 'Live on the Lock Screen',
      body: 'The current score stays visible in Dynamic Island and Live Activities.',
      image: iosImage(
        '/ralli/ios-live-global.png',
        'Ralli Live Activity on the iPhone Lock Screen',
      ),
    },
  ] satisfies RalliStep[],
};

export type RalliStatTone = 'lime' | 'green' | 'fg';

export type RalliStat = {
  id: string;
  value: number;
  unit: string;
  caption: string;
  tone: RalliStatTone;
};

export const ralliWorkoutSection = {
  id: 'workout',
  label: '02 — HEALTH',
  heading: 'A match is a workout — logged automatically.',
  body: 'Every match runs as a HealthKit workout session, so your rings close while you play.',
  stats: [
    {
      id: 'energy',
      value: 642,
      unit: 'kcal',
      caption: 'Active energy, tracked per match',
      tone: 'lime',
    },
    {
      id: 'heart-rate',
      value: 148,
      unit: 'bpm',
      caption: 'Average heart rate across sets',
      tone: 'green',
    },
    {
      id: 'court-time',
      value: 87,
      unit: 'min',
      caption: 'Court time, straight to Apple Fitness',
      tone: 'fg',
    },
  ] satisfies RalliStat[],
  images: [
    watchImage('/ralli/watch-workout-global.png', 'Ralli workout metrics on Apple Watch'),
    iosImage('/ralli/ios-workout-global.png', 'Ralli workout metrics on iPhone'),
  ],
};

export type RalliNote = {
  id: string;
  title: string;
  body: string;
};

export const ralliReplaySection = {
  id: 'iphone',
  label: '03 — REPLAY',
  heading: 'Every match, back on your iPhone.',
  gallery: [
    iosImage('/ralli/ios-summary-global.png', 'Ralli match summary stats on iPhone'),
    iosImage('/ralli/ios-match-global.png', 'Ralli match score on iPhone'),
    iosImage('/ralli/connectivity-global.png', 'Ralli on iPhone and Apple Watch together'),
    iosImage('/ralli/ios-mode-global.png', 'Ralli match format selection on iPhone'),
    iosImage('/ralli/ios-live-global.png', 'Ralli Live Activity on the iPhone Lock Screen'),
  ],
  notes: [
    {
      id: 'set-detail',
      title: 'Set-by-set detail',
      body: 'Scores, kcal, and workout time for every set you played.',
    },
    {
      id: 'calendar',
      title: 'A calendar that fills itself',
      body: 'Your tennis days stack up automatically, no logging required.',
    },
    {
      id: 'stats',
      title: 'Monthly & lifetime stats',
      body: "See how much you've actually played this season.",
    },
  ] satisfies RalliNote[],
};

export const ralliRulesSection = {
  id: 'rules',
  label: '04 — YOUR RULES',
  heading: 'Play by your own rules.',
  body: 'Club night, league, or a quick hit — start with the format you actually play.',
  chips: ['4 games', '5 games', '6 games', 'No-ad', 'No-tie', 'Tiebreak'],
  images: [
    watchImage('/ralli/watch-mode-global.png', 'Ralli match format on Apple Watch'),
    iosImage('/ralli/ios-mode-global.png', 'Ralli match format selection on iPhone'),
  ],
};

export const ralliFinalCta = {
  heading: 'Go win the next one.',
  body: 'Free on the App Store for Apple Watch and iPhone.',
} as const;
