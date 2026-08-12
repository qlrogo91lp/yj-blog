import { render, screen } from '@testing-library/react';
import { ReplayArea } from './replay.area';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

beforeAll(() => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
});

afterAll(() => {
  vi.unstubAllGlobals();
});

describe('ReplayArea', () => {
  it('섹션 제목과 라벨을 렌더한다', () => {
    render(<ReplayArea />);
    expect(
      screen.getByRole('heading', { name: 'Every match, back on your iPhone.' }),
    ).toBeInTheDocument();
    expect(screen.getByText('03 — REPLAY')).toBeInTheDocument();
  });

  it('갤러리 이미지 5장을 렌더한다', () => {
    render(<ReplayArea />);
    expect(screen.getAllByRole('img')).toHaveLength(5);
  });

  it('설명 노트 3개를 렌더한다', () => {
    render(<ReplayArea />);
    expect(screen.getByText('Set-by-set detail')).toBeInTheDocument();
    expect(screen.getByText('A calendar that fills itself')).toBeInTheDocument();
    expect(screen.getByText('Monthly & lifetime stats')).toBeInTheDocument();
  });

  it('앵커 이동을 위해 섹션 id를 노출한다', () => {
    const { container } = render(<ReplayArea />);
    expect(container.querySelector('#iphone')).toBeInTheDocument();
  });
});
