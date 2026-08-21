import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { getBlogSettings } from '@/db/queries/settings';
import { AdminPageHeader } from '../_components/admin-page-header';
import { SettingsFormAction } from './_actions/settings-form.action';
import { SettingsNav } from './_components/settings-nav';

const SECTIONS = [
  { id: 'basic', label: '기본 정보' },
  { id: 'seo', label: 'SEO · 공유' },
  { id: 'social', label: '소셜 링크' },
];

export default async function AdminSettingsPage() {
  const settings = await getBlogSettings();

  const siteLabel = settings?.siteUrl
    ? settings.siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')
    : null;
  const savedLabel = settings?.updatedAt
    ? format(new Date(settings.updatedAt), 'M월 d일', { locale: ko })
    : null;

  const description = [siteLabel, savedLabel && `마지막 저장 ${savedLabel}`]
    .filter(Boolean)
    .join(' · ');

  return (
    <div>
      <AdminPageHeader
        title="블로그 설정"
        description={description || undefined}
      />
      <div className="flex gap-8">
        <SettingsNav sections={SECTIONS} />
        <div className="min-w-0 flex-1">
          <SettingsFormAction defaultValues={settings} />
        </div>
      </div>
    </div>
  );
}
