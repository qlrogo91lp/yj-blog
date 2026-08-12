import { clamp, mapRange, scoreAt, stepIndexAt } from './ralli-motion';

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

describe('scoreAt', () => {
  it('진행도에 따라 테니스 스코어 시퀀스를 반환한다', () => {
    expect(scoreAt(0)).toBe('0');
    expect(scoreAt(0.1)).toBe('0');
    expect(scoreAt(0.2)).toBe('15');
    expect(scoreAt(0.4)).toBe('30');
    expect(scoreAt(0.6)).toBe('40');
    expect(scoreAt(0.8)).toBe('GAME');
  });

  it('진행도 1에서도 마지막 값을 넘지 않는다', () => {
    expect(scoreAt(1)).toBe('GAME');
    expect(scoreAt(1.5)).toBe('GAME');
  });

  it('음수 진행도는 첫 값으로 처리한다', () => {
    expect(scoreAt(-0.4)).toBe('0');
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
});
