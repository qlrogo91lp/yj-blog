import { SidebarCollapseHandler } from "./_handlers/sidebar-collapse-handler"

export default function NewPostLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <SidebarCollapseHandler />
      {children}
    </div>
  )
}
