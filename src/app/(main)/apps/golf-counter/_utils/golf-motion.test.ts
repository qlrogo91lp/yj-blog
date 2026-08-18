import { CHIP_OFFSETS, chipRangeAt, stageRangeOf } from './golf-motion';

describe('chipRangeAt', () => {
  it('첫 칩은 진행도 0.04에서 시작한다', () => {
    expect(chipRangeAt(0)).toEqual([0.04, 0.5]);
  });

  it('칩마다 0.045씩 시작이 밀린다 — 시차 등장', () => {
    expect(chipRangeAt(1)[0]).toBeCloseTo(0.085, 5);
    expect(chipRangeAt(2)[0]).toBeCloseTo(0.13, 5);
    expect(chipRangeAt(3)[0]).toBeCloseTo(0.175, 5);
  });

  it('모든 칩의 구간 폭은 0.46으로 같다', () => {
    [0, 1, 2, 3].forEach((index) => {
      const [start, end] = chipRangeAt(index);
      expect(end - start).toBeCloseTo(0.46, 5);
    });
  });

  it('마지막 칩도 진행도 1 안에서 끝난다', () => {
    expect(chipRangeAt(3)[1]).toBeLessThanOrEqual(1);
  });
});

describe('CHIP_OFFSETS', () => {
  it('데스크톱·모바일 모두 칩 4개의 벡터를 갖는다', () => {
    expect(CHIP_OFFSETS.desktop).toHaveLength(4);
    expect(CHIP_OFFSETS.mobile).toHaveLength(4);
  });

  it('모바일은 세로 이동 위주다 — 좁은 화면에서 가로로 밀면 화면을 벗어난다', () => {
    CHIP_OFFSETS.mobile.forEach(([x, y]) => {
      expect(Math.abs(y)).toBeGreaterThan(Math.abs(x));
    });
  });

  it('데스크톱은 가로 이동이 살아 있다', () => {
    CHIP_OFFSETS.desktop.forEach(([x]) => {
      expect(Math.abs(x)).toBeGreaterThanOrEqual(14);
    });
  });
});

describe('stageRangeOf', () => {
  it('데스크톱 stage는 50vw에서 94vw로 커진다', () => {
    expect(stageRangeOf(false).width).toEqual(['50vw', '94vw']);
    expect(stageRangeOf(false).height).toEqual(['44vh', '86vh']);
  });

  it('모바일 stage는 처음부터 넓고 낮다', () => {
    expect(stageRangeOf(true).width).toEqual(['86vw', '96vw']);
    expect(stageRangeOf(true).height).toEqual(['32vh', '58vh']);
  });

  it('두 경우 모두 최종 translateY는 0이다 — 중앙에 안착한다', () => {
    expect(stageRangeOf(false).translateY[1]).toBe('0vh');
    expect(stageRangeOf(true).translateY[1]).toBe('0vh');
  });

  it('모서리는 40px에서 28px로 좁아진다', () => {
    expect(stageRangeOf(false).borderRadius).toEqual([40, 28]);
  });
});
