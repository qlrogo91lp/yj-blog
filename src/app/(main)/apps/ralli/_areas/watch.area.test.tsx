import { render, screen } from '@testing-library/react';
import { WatchArea } from './watch.area';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
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
});
