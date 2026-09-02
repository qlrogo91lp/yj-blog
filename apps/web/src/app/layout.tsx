import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { GoogleAnalytics } from '@next/third-parties/google';
import { NavigationProgress } from '@/components/navigation-progress';
import { PageTracker } from '@/components/page-tracker';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { getBlogSettings } from '@/db/queries/settings';
import { SITE_DESCRIPTION, SITE_NAME } from '@/lib/constants';
import { cn } from '@/lib/utils';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getBlogSettings().catch(() => null);
  const siteName = settings?.blogName ?? SITE_NAME;
  const description = settings?.defaultMetaDescription ?? SITE_DESCRIPTION;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://yjlogs.com';

  return {
    metadataBase: new URL(baseUrl),
    title: siteName,
    description,
    alternates: {
      types: {
        'application/rss+xml': '/feed.xml',
      },
    },
    openGraph: {
      siteName,
      type: 'website',
      images: ['/og-default.png'],
    },
    twitter: {
      card: 'summary_large_image',
      images: ['/og-default.png'],
    },
    verification: {
      other: {
        'naver-site-verification': '7d25909aa6a6b6fedab3de9a116a4bc44e315dc4',
      },
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="ko" suppressHydrationWarning>
        <body
          className={cn(
            geistSans.variable,
            geistMono.variable,
            'antialiased min-w-100'
          )}
        >
          <ThemeProvider>
            <TooltipProvider>
              <PageTracker />
              <NavigationProgress />
              {children}
              <Toaster />
            </TooltipProvider>
          </ThemeProvider>
          {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
            <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
          )}
        </body>
      </html>
    </ClerkProvider>
  );
}
