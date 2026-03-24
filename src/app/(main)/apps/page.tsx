import type { Metadata } from 'next';
import { apps } from './_utils/apps-data';
import { AppCard } from './_components/app-card';
import { SITE_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Apps | ${SITE_NAME}`,
  description: '개발한 웹앱과 앱스토어 앱 목록',
};

export default function AppsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold">Apps</h1>
      <p className="mt-2 text-muted-foreground">개발한 웹앱과 앱스토어 앱을 소개합니다.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {apps.map((app) => (
          <AppCard key={app.slug} app={app} />
        ))}
      </div>
    </div>
  );
}
