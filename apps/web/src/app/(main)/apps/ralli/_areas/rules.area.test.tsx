import { render, screen } from '@testing-library/react';
import { RulesArea } from './rules.area';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}));

describe('RulesArea', () => {
  it('섹션 제목과 라벨을 렌더한다', () => {
    render(<RulesArea />);
    expect(
      screen.getByRole('heading', { name: 'Play by your own rules.' })
    ).toBeInTheDocument();
    expect(screen.getByText('04 — YOUR RULES')).toBeInTheDocument();
  });

  it('룰 칩 6개를 렌더한다', () => {
    render(<RulesArea />);
    for (const chip of [
      '4 games',
      '5 games',
      '6 games',
      'No-ad',
      'No-tie',
      'Tiebreak',
    ]) {
      expect(screen.getByText(chip)).toBeInTheDocument();
    }
  });

  it('첫 칩만 강조 스타일을 갖는다', () => {
    render(<RulesArea />);
    expect(screen.getByText('4 games')).toHaveClass('bg-ralli-lime');
    expect(screen.getByText('5 games')).not.toHaveClass('bg-ralli-lime');
  });
});
