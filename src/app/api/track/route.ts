import { db } from "@/db"
import { dailyStats } from "@/db/schema"
import { sql } from "drizzle-orm"
import { format } from "date-fns"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST() {
  const today = format(new Date(), "yyyy-MM-dd")
  const cookieStore = await cookies()
  const visitorCookie = cookieStore.get("_blog_vid")

  const isNewVisitor = !visitorCookie || visitorCookie.value !== today

  // upsert: 오늘 날짜 row가 있으면 views +1, 없으면 새로 생성
  await db
    .insert(dailyStats)
    .values({
      date: today,
      views: 1,
      visitors: isNewVisitor ? 1 : 0,
    })
    .onConflictDoUpdate({
      target: dailyStats.date,
      set: {
        views: sql`${dailyStats.views} + 1`,
        visitors: isNewVisitor
          ? sql`${dailyStats.visitors} + 1`
          : sql`${dailyStats.visitors}`,
      },
    })

  const response = NextResponse.json({ ok: true })

  if (isNewVisitor) {
    response.cookies.set("_blog_vid", today, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 1일
    })
  }

  return response
}
