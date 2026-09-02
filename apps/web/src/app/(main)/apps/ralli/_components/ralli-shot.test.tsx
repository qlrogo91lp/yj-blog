import { render, screen } from '@testing-library/react';
import type { RalliImage } from '../_utils/ralli-content';
import { RalliShot } from './ralli-shot';

vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    width,
    height,
    className,
    sizes,
  }: {
    src: string;
    alt: string;
    width: number;
    height: number;
    className?: string;
    sizes?: string;
  }) => (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      sizes={sizes}
    />
  ),
}));

const image: RalliImage = {
  src: '/ralli/watch-match-global.png',
  alt: 'Ralli match score on Apple Watch',
  kind: 'watch',
  width: 422,
  height: 514,
};

describe('RalliShot', () => {
  it('마스크 클래스를 항상 적용한다', () => {
    render(<RalliShot image={image} />);
    expect(screen.getByRole('img')).toHaveClass('ralli-shot-mask');
  });

  it('추가 className을 받아도 마스크 클래스를 유지한다', () => {
    render(<RalliShot image={image} className="h-[64vh]" />);
    const img = screen.getByRole('img');
    expect(img).toHaveClass('ralli-shot-mask');
    expect(img).toHaveClass('h-[64vh]');
  });

  it('src·alt·intrinsic 크기를 그대로 전달한다', () => {
    render(<RalliShot image={image} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', '/ralli/watch-match-global.png');
    expect(img).toHaveAttribute('alt', 'Ralli match score on Apple Watch');
    expect(img).toHaveAttribute('width', '422');
    expect(img).toHaveAttribute('height', '514');
  });
});
