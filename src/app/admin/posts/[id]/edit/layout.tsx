"use client"

import { useEffect } from "react"
import { useSidebar } from "@/components/ui/sidebar"

export default function EditPostLayout({ children }: { children: React.ReactNode }) {
  const { setOpen, setOpenMobile } = useSidebar()

  useEffect(() => {
    setOpen(false)
    setOpenMobile(false)
    return () => setOpen(true)
  }, [setOpen, setOpenMobile])

  return <div className="min-h-screen flex flex-col">{children}</div>
}
