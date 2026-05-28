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
  return {
    title: settings?.blogName ?? SITE_NAME,
    description: settings?.defaultMetaDescription ?? SITE_DESCRIPTION,
    alternates: {
      types: {
        'application/rss+xml': '/feed.xml',
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
