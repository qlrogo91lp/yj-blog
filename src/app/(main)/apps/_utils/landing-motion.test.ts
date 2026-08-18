import { clamp, mapRange, stepIndexAt } from './landing-motion';

describe('clamp', () => {
  it('범위 안의 값은 그대로 반환한다', () => {
    expect(clamp(0.5, 0, 1)).toBe(0.5);
  });

  it('범위를 벗어나면 경계값으로 자른다', () => {
    expect(clamp(-3, 0, 1)).toBe(0);
    expect(clamp(9, 0, 1)).toBe(1);
  });
});

describe('mapRange', () => {
  it('입력 범위를 출력 범위로 선형 변환한다', () => {
    expect(mapRange(0.5, 0, 1, 0, 100)).toBe(50);
    expect(mapRange(0.25, 0, 1, 10, 20)).toBe(12.5);
  });

  it('입력이 범위를 벗어나면 출력도 잘린다', () => {
    expect(mapRange(-1, 0, 1, 0, 100)).toBe(0);
    expect(mapRange(2, 0, 1, 0, 100)).toBe(100);
  });

  it('입력 범위 폭이 0이면 outMin을 반환한다', () => {
    expect(mapRange(5, 3, 3, 7, 99)).toBe(7);
  });
});

describe('stepIndexAt', () => {
  it('진행도를 3구간 인덱스로 나눈다', () => {
    expect(stepIndexAt(0)).toBe(0);
    expect(stepIndexAt(0.3)).toBe(0);
    expect(stepIndexAt(0.4)).toBe(1);
    expect(stepIndexAt(0.7)).toBe(2);
  });

  it('진행도 1에서 마지막 인덱스를 넘지 않는다', () => {
    expect(stepIndexAt(1)).toBe(2);
    expect(stepIndexAt(2)).toBe(2);
  });

  it('stepCount를 바꿔도 마지막 인덱스를 넘지 않는다', () => {
    expect(stepIndexAt(1, 5)).toBe(4);
    expect(stepIndexAt(0, 5)).toBe(0);
  });

  // golf-counter Health pin이 2-step으로 사용한다 — 경계를 명시적으로 고정한다
  it('stepCount=2에서 진행도를 절반으로 가른다', () => {
    expect(stepIndexAt(0, 2)).toBe(0);
    expect(stepIndexAt(0.49, 2)).toBe(0);
    expect(stepIndexAt(0.5, 2)).toBe(1);
    expect(stepIndexAt(1, 2)).toBe(1);
  });

  it('음수 진행도는 첫 인덱스로 처리한다', () => {
    expect(stepIndexAt(-1, 2)).toBe(0);
  });
});
