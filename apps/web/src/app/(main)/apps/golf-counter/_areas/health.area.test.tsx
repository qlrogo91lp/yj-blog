import { render, screen } from '@testing-library/react';
import { HealthArea } from './health.area';

// aria-hidden도 검증 대상이라 다른 area 테스트의 mock(src·alt만 전달)보다
// props를 하나 더 전달한다 — 실제 next/image도 인식하지 못하는 prop을
// 그대로 DOM에 넘기므로, GolfShot이 넘긴 aria-hidden이 img까지 도달하는지 봐야 한다.
vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    'aria-hidden': ariaHidden,
  }: {
    src: string;
    alt: string;
    'aria-hidden'?: boolean;
  }) => <img src={src} alt={alt} aria-hidden={ariaHidden} />,
}));

describe('HealthArea', () => {
  it('섹션 라벨과 제목을 렌더한다', () => {
    render(<HealthArea />);
    expect(screen.getByText('HEALTH')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: 'A round is a workout — logged automatically.',
      })
    ).toBeInTheDocument();
  });

  it('스텝 2개를 모두 렌더한다', () => {
    render(<HealthArea />);
    expect(screen.getByText('Tied to a HealthKit session')).toBeInTheDocument();
    expect(
      screen.getByText('Calories, heart rate, round time')
    ).toBeInTheDocument();
  });

  it('초기 활성 스텝은 첫 번째다', () => {
    render(<HealthArea />);
    expect(screen.getByTestId('golf-step-session')).toHaveAttribute(
      'data-active',
      'true'
    );
    expect(screen.getByTestId('golf-step-sync')).toHaveAttribute(
      'data-active',
      'false'
    );
  });

  it('비활성 이미지는 스크린 리더에서 숨긴다', () => {
    render(<HealthArea />);
    const images = screen.getAllByRole('img', { hidden: true });
    expect(images).toHaveLength(2);
    expect(images[1]).toHaveAttribute('aria-hidden', 'true');
  });

  it('섹션 id를 노출한다', () => {
    const { container } = render(<HealthArea />);
    expect(container.querySelector('#health')).toBeInTheDocument();
  });
});
