import { getBlogSettings } from '@/db/queries/settings';
import { SettingsFormAction } from './_actions/settings-form.action';
import { SettingsNav } from './_components/settings-nav';

const SECTIONS = [
  { id: 'basic', label: '기본 정보' },
  { id: 'social', label: '소셜 링크' },
];

export default async function AdminSettingsPage() {
  const settings = await getBlogSettings();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">블로그 설정</h1>
      <div className="flex gap-8">
        <SettingsNav sections={SECTIONS} />
        <div className="min-w-0 flex-1">
          <SettingsFormAction defaultValues={settings} />
        </div>
      </div>
    </div>
  );
}
