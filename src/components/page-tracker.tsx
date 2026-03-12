"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

export function PageTracker() {
  const pathname = usePathname()

  useEffect(() => {
    // admin 경로는 트래킹하지 않음
    if (pathname.startsWith("/admin")) return

    fetch("/api/track", { method: "POST" }).catch(() => {
      // 트래킹 실패는 무시
    })
  }, [pathname])

  return null
}
