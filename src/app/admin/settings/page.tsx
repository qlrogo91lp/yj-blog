import { getBlogSettings } from '@/db/queries/settings';
import { SettingsForm } from './_components/settings-form';

export default async function AdminSettingsPage() {
  const settings = await getBlogSettings();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">블로그 설정</h1>
      <SettingsForm defaultValues={settings} />
    </div>
  );
}
