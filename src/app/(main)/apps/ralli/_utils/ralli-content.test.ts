import { ralliFeatures, ralliScreenshots, ralliMeta } from './ralli-content';

const allImages = [...ralliScreenshots, ...ralliFeatures.flatMap((f) => f.images)];

describe('ralli-content', () => {
  it('모든 이미지 src는 /ralli/ 경로이고 alt가 비어있지 않다', () => {
    for (const img of allImages) {
      expect(img.src.startsWith('/ralli/')).toBe(true);
      expect(img.alt.length).toBeGreaterThan(0);
    }
  });

  it('ios/watch 이미지의 intrinsic 크기가 양수다', () => {
    for (const img of allImages) {
      expect(img.width).toBeGreaterThan(0);
      expect(img.height).toBeGreaterThan(0);
    }
  });

  it('기능 섹션은 4개이고 각각 불릿과 이미지를 갖는다', () => {
    expect(ralliFeatures).toHaveLength(4);
    for (const f of ralliFeatures) {
      expect(f.bullets.length).toBeGreaterThan(0);
      expect(f.images.length).toBeGreaterThan(0);
    }
  });

  it('지원 이메일이 설정되어 있다', () => {
    expect(ralliMeta.supportEmail).toContain('@');
  });
});
