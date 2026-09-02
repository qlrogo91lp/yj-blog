import { SidebarCollapseHandler } from '../../new/_handlers/sidebar-collapse.handler';

export default function EditPostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <SidebarCollapseHandler />
      {children}
    </div>
  );
}
