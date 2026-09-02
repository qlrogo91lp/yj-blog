import { render, screen } from '@testing-library/react';
import { CourseArea } from './course.area';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

describe('CourseArea', () => {
  it('섹션 라벨과 제목을 렌더한다', () => {
    render(<CourseArea />);
    expect(screen.getByText('ON THE COURSE')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Everything happens on your wrist.' }),
    ).toBeInTheDocument();
  });

  it('카드 3장의 제목을 모두 렌더한다', () => {
    render(<CourseArea />);
    expect(screen.getByText('Tap to count')).toBeInTheDocument();
    expect(screen.getByText('One tap from the watch face')).toBeInTheDocument();
    expect(screen.getByText('The whole card on your wrist')).toBeInTheDocument();
  });

  it('카드 이미지 3장을 alt와 함께 렌더한다', () => {
    render(<CourseArea />);
    expect(screen.getAllByRole('img')).toHaveLength(3);
  });

  it('섹션 id를 노출한다', () => {
    const { container } = render(<CourseArea />);
    expect(container.querySelector('#course')).toBeInTheDocument();
  });
});
