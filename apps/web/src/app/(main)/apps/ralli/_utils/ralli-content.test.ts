import {
  ralliMeta,
  ralliHeroLetters,
  ralliHeroShot,
  ralliWatchSection,
  ralliWorkoutSection,
  ralliReplaySection,
  ralliRulesSection,
  ralliFinalCta,
  type RalliImage,
} from './ralli-content';

const allImages: RalliImage[] = [
  ralliHeroShot,
  ...ralliWatchSection.steps.map((s) => s.image),
  ...ralliWorkoutSection.images,
  ...ralliReplaySection.gallery,
  ...ralliRulesSection.images,
];

describe('ralli-content', () => {
  it('모든 이미지 src는 /ralli/ 경로이고 alt가 비어있지 않다', () => {
    for (const img of allImages) {
      expect(img.src.startsWith('/ralli/')).toBe(true);
      expect(img.alt.length).toBeGreaterThan(0);
    }
  });

  it('모든 이미지의 intrinsic 크기가 양수다', () => {
    for (const img of allImages) {
      expect(img.width).toBeGreaterThan(0);
      expect(img.height).toBeGreaterThan(0);
    }
  });

  it('외부 참조 키를 보존한다', () => {
    expect(ralliMeta.name).toBe('Ralli');
    expect(ralliMeta.iconSrc).toBe('/ralli/icon1.png');
    expect(ralliMeta.subtitle.length).toBeGreaterThan(0);
    expect(ralliMeta.appStoreUrl).toBe('https://apps.apple.com/us/app/ralli/id6449350578');
    expect(ralliMeta.supportEmail).toBe('qlrogo91lp@gmail.com');
  });

  it('섹션 라벨 넘버링이 01부터 04까지 연속한다', () => {
    const labels = [
      ralliWatchSection.label,
      ralliWorkoutSection.label,
      ralliReplaySection.label,
      ralliRulesSection.label,
    ];
    expect(labels.map((l) => l.slice(0, 2))).toEqual(['01', '02', '03', '04']);
  });

  it('히어로 글자는 RALLI 5자다', () => {
    expect(ralliHeroLetters.join('')).toBe('RALLI');
  });

  it('watch 섹션은 3스텝이고 각 스텝이 제목·본문·이미지를 갖는다', () => {
    expect(ralliWatchSection.steps).toHaveLength(3);
    for (const step of ralliWatchSection.steps) {
      expect(step.title.length).toBeGreaterThan(0);
      expect(step.body.length).toBeGreaterThan(0);
      expect(step.image.src.length).toBeGreaterThan(0);
    }
  });

  it('workout 스탯은 3개이고 목표값이 양수다', () => {
    expect(ralliWorkoutSection.stats).toHaveLength(3);
    for (const stat of ralliWorkoutSection.stats) {
      expect(stat.value).toBeGreaterThan(0);
      expect(stat.unit.length).toBeGreaterThan(0);
    }
  });

  it('replay 갤러리는 5장, 설명 노트는 3개다', () => {
    expect(ralliReplaySection.gallery).toHaveLength(5);
    expect(ralliReplaySection.notes).toHaveLength(3);
  });

  it('룰 칩은 6개이고 첫 칩이 기본 강조 대상이다', () => {
    expect(ralliRulesSection.chips).toHaveLength(6);
    expect(ralliRulesSection.chips[0]).toBe('4 games');
  });

  it('최종 CTA 카피가 존재한다', () => {
    expect(ralliFinalCta.heading).toBe('Go win the next one.');
    expect(ralliFinalCta.body.length).toBeGreaterThan(0);
  });

  it('사용하지 않는 watch-home 자산을 참조하지 않는다', () => {
    expect(allImages.some((img) => img.src.includes('watch-home'))).toBe(false);
  });
});
