import { getBlogSettings } from '@/db/queries/settings';
import { SettingsFormAction } from './_actions/settings-form.action';

export default async function AdminSettingsPage() {
  const settings = await getBlogSettings();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">블로그 설정</h1>
      <SettingsFormAction defaultValues={settings} />
    </div>
  );
}
