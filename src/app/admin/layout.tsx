import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AdminHeaderAction } from './_actions/admin-header.action';
import { AdminSidebarAction } from './_actions/admin-sidebar.action';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect('/');

  return (
    <SidebarProvider>
      <AdminSidebarAction />
      <SidebarInset>
        <AdminHeaderAction />
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
