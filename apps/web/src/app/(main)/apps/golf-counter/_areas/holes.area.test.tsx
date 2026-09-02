import { render, screen } from '@testing-library/react';
import { HolesArea } from './holes.area';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}));

describe('HolesArea', () => {
  it('제목과 설명을 렌더한다', () => {
    render(<HolesArea />);
    expect(
      screen.getByRole('heading', { name: 'Nine or eighteen. Your call.' })
    ).toBeInTheDocument();
  });

  it('홀 수 칩 2개를 렌더한다', () => {
    render(<HolesArea />);
    expect(screen.getByText('18 holes')).toBeInTheDocument();
    expect(screen.getByText('9 holes')).toBeInTheDocument();
  });

  it('활성 칩만 data-active가 true다', () => {
    render(<HolesArea />);
    expect(screen.getByText('18 holes')).toHaveAttribute('data-active', 'true');
    expect(screen.getByText('9 holes')).toHaveAttribute('data-active', 'false');
  });
});
