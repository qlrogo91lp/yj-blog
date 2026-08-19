import { render, screen } from '@testing-library/react';
import { WatchArea } from './watch.area';
import { ralliWatchSection } from '../_utils/ralli-content';

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

describe('WatchArea', () => {
  it('섹션 제목과 라벨을 렌더한다', () => {
    render(<WatchArea />);
    expect(screen.getByRole('heading', { name: 'All on your wrist.' })).toBeInTheDocument();
    expect(screen.getByText('01 — ON THE COURT')).toBeInTheDocument();
  });

  it('3개 스텝을 모두 렌더한다', () => {
    render(<WatchArea />);
    expect(screen.getByText('Score without your phone')).toBeInTheDocument();
    expect(screen.getByText('One tap from your watch face')).toBeInTheDocument();
    expect(screen.getByText('Live on the Lock Screen')).toBeInTheDocument();
  });

  it('앵커 이동을 위해 섹션 id를 노출한다', () => {
    const { container } = render(<WatchArea />);
    expect(container.querySelector('#watch')).toBeInTheDocument();
  });

  it('초기 활성 스텝은 첫 번째다', () => {
    render(<WatchArea />);
    expect(screen.getByTestId('ralli-step-score')).toHaveAttribute('data-active', 'true');
    expect(screen.getByTestId('ralli-step-live')).toHaveAttribute('data-active', 'false');
  });

  it('비활성 이미지는 스크린 리더에서 숨긴다', () => {
    render(<WatchArea />);

    // 이미지 자신에 aria-hidden이 붙어야 한다 — 래퍼 div에 걸면 접근성 트리에서
    // img 요소 자체는 여전히 노출된다
    const images = screen.getAllByRole('img', { hidden: true });
    expect(images).toHaveLength(ralliWatchSection.steps.length);
    expect(images[0]).not.toHaveAttribute('aria-hidden', 'true');
    expect(images[1]).toHaveAttribute('aria-hidden', 'true');
    expect(images[2]).toHaveAttribute('aria-hidden', 'true');
  });
});
