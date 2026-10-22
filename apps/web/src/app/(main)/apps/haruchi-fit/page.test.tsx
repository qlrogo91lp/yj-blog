import { render, screen } from '@testing-library/react';
import { haruchiFitMeta } from './_utils/haruchi-fit-content';
import HaruchiFitPage from './page';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));

describe('HaruchiFitPage', () => {
  it('앱 이름과 소개를 렌더한다', () => {
    render(<HaruchiFitPage />);
    expect(
      screen.getByRole('heading', { name: 'Haruchi Fit' })
    ).toBeInTheDocument();
    expect(screen.getByText(haruchiFitMeta.tagline)).toBeInTheDocument();
  });

  it('문의 메일 링크를 렌더한다', () => {
    render(<HaruchiFitPage />);
    expect(
      screen.getByRole('link', { name: haruchiFitMeta.supportEmail })
    ).toHaveAttribute('href', `mailto:${haruchiFitMeta.supportEmail}`);
  });

  it('App Store 링크를 렌더한다', () => {
    render(<HaruchiFitPage />);
    expect(screen.getByRole('link', { name: /App Store/ })).toHaveAttribute(
      'href',
      haruchiFitMeta.appStoreUrl
    );
  });

  it('방침 페이지 링크를 렌더한다', () => {
    render(<HaruchiFitPage />);
    expect(
      screen.getByRole('link', { name: /Privacy Policy/ })
    ).toHaveAttribute('href', '/apps/haruchi-fit/privacy');
  });
});
