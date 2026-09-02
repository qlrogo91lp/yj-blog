import { render, screen } from '@testing-library/react';
import { AfterRoundArea } from './after-round.area';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}));

describe('AfterRoundArea', () => {
  it('섹션 라벨과 제목을 렌더한다', () => {
    render(<AfterRoundArea />);
    expect(screen.getByText('AFTER THE ROUND')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Every round adds up.' })
    ).toBeInTheDocument();
  });

  it('갤러리 이미지 2장을 렌더한다', () => {
    render(<AfterRoundArea />);
    expect(screen.getAllByRole('img')).toHaveLength(2);
  });

  it('섹션 id를 노출한다', () => {
    const { container } = render(<AfterRoundArea />);
    expect(container.querySelector('#after')).toBeInTheDocument();
  });
});
