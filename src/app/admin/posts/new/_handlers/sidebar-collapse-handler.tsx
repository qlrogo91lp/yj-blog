"use client"
import { useEffect } from "react"
import { useSidebar } from "@/components/ui/sidebar"

export function SidebarCollapseHandler() {
  const { setOpen, setOpenMobile } = useSidebar()
  useEffect(() => {
    setOpen(false)
    setOpenMobile(false)
    return () => setOpen(true)
  }, [setOpen, setOpenMobile])
  return null
}
