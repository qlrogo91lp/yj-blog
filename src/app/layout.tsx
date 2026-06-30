import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { cn } from '@/lib/utils';
import { ClerkProvider } from '@clerk/nextjs';
import { PageTracker } from '@/components/page-tracker';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SITE_NAME, SITE_DESCRIPTION } from '@/lib/constants';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { getBlogSettings } from '@/db/queries/settings';
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
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

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
          className={cn(geistSans.variable, geistMono.variable, 'antialiased min-w-100')}
        >
          <ThemeProvider>
            <TooltipProvider>
              <PageTracker />
              {children}
              <Toaster />
            </TooltipProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
