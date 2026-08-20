import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AdminHeaderAction } from './_actions/admin-header.action';
import { AdminSidebarAction } from './_actions/admin-sidebar.action';
import { AdminMainContainerHandler } from './_handlers/admin-main-container.handler';
import { getPendingReplyCount } from '@/db/queries/comments';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect('/');

  const pendingReplyCount = await getPendingReplyCount();

  return (
    <SidebarProvider>
      <AdminSidebarAction pendingReplyCount={pendingReplyCount} />
      <SidebarInset>
        <AdminHeaderAction />
        <main className="flex-1 px-8 py-8">
          <AdminMainContainerHandler>{children}</AdminMainContainerHandler>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
