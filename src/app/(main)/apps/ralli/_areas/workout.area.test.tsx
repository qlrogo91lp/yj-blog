import { render, screen } from '@testing-library/react';
import { WorkoutArea } from './workout.area';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

describe('WorkoutArea', () => {
  it('섹션 제목과 라벨을 렌더한다', () => {
    render(<WorkoutArea />);
    expect(
      screen.getByRole('heading', { name: 'A match is a workout — logged automatically.' }),
    ).toBeInTheDocument();
    expect(screen.getByText('02 — HEALTH')).toBeInTheDocument();
  });

  it('스탯 3개의 단위와 설명을 렌더한다', () => {
    render(<WorkoutArea />);
    expect(screen.getByText('kcal')).toBeInTheDocument();
    expect(screen.getByText('bpm')).toBeInTheDocument();
    expect(screen.getByText('min')).toBeInTheDocument();
    expect(screen.getByText('Active energy, tracked per match')).toBeInTheDocument();
  });

  it('앵커 이동을 위해 섹션 id를 노출한다', () => {
    const { container } = render(<WorkoutArea />);
    expect(container.querySelector('#workout')).toBeInTheDocument();
  });
});
