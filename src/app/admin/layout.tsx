import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AdminHeader } from './_components/admin-header';
import { AdminSidebar } from './_components/admin-sidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect('/');

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <AdminHeader />
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
