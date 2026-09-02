import {
  golfAfterSection,
  golfCounterMeta,
  golfCourseSection,
  golfHealthSection,
  golfHolesSection,
} from './golf-counter-content';

describe('golfCounterMeta', () => {
  it('App Store URL은 us 스토어프론트를 가리킨다', () => {
    expect(golfCounterMeta.appStoreUrl).toBe(
      'https://apps.apple.com/us/app/golfcounter-with-watch/id6448967372'
    );
  });

  it('랜딩 표기명은 스토어 표기명이 아닌 GolfCounter다', () => {
    expect(golfCounterMeta.name).toBe('GolfCounter');
  });
});

describe('섹션 이미지', () => {
  it('모든 이미지 경로가 /golf-counter/ 아래를 가리킨다', () => {
    const images = [
      golfCourseSection.cards.map((card) => card.image),
      golfHealthSection.steps.map((step) => step.image),
      golfAfterSection.gallery,
      [golfHolesSection.image],
    ].flat();

    expect(images.length).toBeGreaterThan(0);
    images.forEach((image) => {
      expect(image.src.startsWith('/golf-counter/')).toBe(true);
    });
  });

  it('모든 이미지에 alt가 있다', () => {
    const images = [
      golfCourseSection.cards.map((card) => card.image),
      golfHealthSection.steps.map((step) => step.image),
      golfAfterSection.gallery,
      [golfHolesSection.image],
    ].flat();

    images.forEach((image) => {
      expect(image.alt.length).toBeGreaterThan(0);
    });
  });
});

describe('golfHealthSection', () => {
  it('스텝이 2개다 — pin 크로스페이드가 2-step으로 동작한다', () => {
    expect(golfHealthSection.steps).toHaveLength(2);
  });
});

describe('golfHolesSection', () => {
  it('활성 칩은 정확히 하나다', () => {
    const active = golfHolesSection.chips.filter((chip) => chip.isActive);
    expect(active).toHaveLength(1);
    expect(active[0].label).toBe('18 holes');
  });
});
