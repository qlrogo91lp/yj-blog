/**
 * 시안 B의 rAF 계산 중 framer-motion `useTransform`으로 흡수되지 않는 부분.
 * 이징(easeInOutQuad)과 값 보간은 `useTransform`이 처리하므로 여기 없다.
 */

/** 칩별 등장 구간. 시안 원본: t = clamp((p - 0.04 - i*0.045) / 0.46, 0, 1) */
export function chipRangeAt(index: number): [number, number] {
  const start = 0.04 + index * 0.045;
  return [start, start + 0.46];
}

/**
 * 칩이 흩어지는 [vw, vh] 벡터.
 * 시안 원본: mob ? [[-2,-11],[2,-13],[2,13],[-2,12]] : [[-16,-6],[16,-10],[14,12],[-14,10]]
 */
export const CHIP_OFFSETS = {
  desktop: [
    [-16, -6],
    [16, -10],
    [14, 12],
    [-14, 10],
  ],
  mobile: [
    [-2, -11],
    [2, -13],
    [2, 13],
    [-2, 12],
  ],
} as const;

export type StageRange = {
  width: [string, string];
  height: [string, string];
  translateY: [string, string];
  borderRadius: [number, number];
};

/**
 * hero stage의 시작·끝 크기.
 * 시안 원본: width = mob ? 86+e*10 : 50+e*44 (vw)
 *            height = mob ? 32+e*26 : 44+e*42 (vh)
 *            translateY = base - e*base (base = mob ? 19 : 16)
 *            borderRadius = 40 - e*12
 */
export function stageRangeOf(isMobile: boolean): StageRange {
  if (isMobile) {
    return {
      width: ['86vw', '96vw'],
      height: ['32vh', '58vh'],
      translateY: ['19vh', '0vh'],
      borderRadius: [40, 28],
    };
  }

  return {
    width: ['50vw', '94vw'],
    height: ['44vh', '86vh'],
    translateY: ['16vh', '0vh'],
    borderRadius: [40, 28],
  };
}
