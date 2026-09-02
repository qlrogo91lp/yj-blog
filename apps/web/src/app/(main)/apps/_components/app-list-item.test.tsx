import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import type { App } from '../_utils/apps-data';
import { AppListItem } from './app-list-item';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}));

const mockApp: App = {
  slug: 'ralli',
  name: 'Ralli',
  description: '테니스 경기 중 점수 카운터 앱',
  iconSrc: '/ralli/icon1.png',
  platforms: ['ios', 'watch'],
  tags: ['테니스'],
  longDescription: '긴 설명',
  links: [],
};

describe('AppListItem', () => {
  it('앱 이름과 설명을 렌더한다', () => {
    render(<AppListItem app={mockApp} />);
    expect(screen.getByRole('heading', { name: 'Ralli' })).toBeInTheDocument();
    expect(
      screen.getByText('테니스 경기 중 점수 카운터 앱')
    ).toBeInTheDocument();
  });

  it('상세 페이지로 링크한다', () => {
    render(<AppListItem app={mockApp} />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/apps/ralli');
  });

  it('앱 아이콘을 alt와 함께 렌더한다', () => {
    render(<AppListItem app={mockApp} />);
    const icon = screen.getByRole('img');
    expect(icon).toHaveAttribute('src', '/ralli/icon1.png');
    expect(icon).toHaveAttribute('alt', 'Ralli 앱 아이콘');
  });

  it('플랫폼 칩을 모두 렌더한다', () => {
    render(<AppListItem app={mockApp} />);
    expect(screen.getByText('iPhone')).toBeInTheDocument();
    expect(screen.getByText('Watch')).toBeInTheDocument();
  });

  it('웹앱은 Web 칩을 렌더한다', () => {
    render(<AppListItem app={{ ...mockApp, platforms: ['web'] }} />);
    expect(screen.getByText('Web')).toBeInTheDocument();
    expect(screen.queryByText('iPhone')).not.toBeInTheDocument();
  });
});
