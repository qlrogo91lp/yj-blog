import { scoreAt } from './ralli-motion';

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
