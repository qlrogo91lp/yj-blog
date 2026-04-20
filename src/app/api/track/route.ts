import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { format } from 'date-fns';
import { eq, sql } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { dailyStats, posts, referrers } from '@/db/schema';

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (userId) {
    return NextResponse.json({ ok: true });
  }

  const body = await request.json().catch(() => ({}));
  const { referrer, slug } = body as { referrer?: string; slug?: string };

  const today = format(new Date(), 'yyyy-MM-dd');
  const cookieStore = await cookies();
  const visitorCookie = cookieStore.get('_blog_vid');

  const isNewVisitor = !visitorCookie || visitorCookie.value !== today;

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
    });

  // referrer 기록
  let postId: number | null = null;
  if (slug) {
    const post = await db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.slug, slug))
      .limit(1);
    postId = post[0]?.id ?? null;

    // 글 조회수 증가
    if (postId) {
      await db
        .update(posts)
        .set({ views: sql`${posts.views} + 1` })
        .where(eq(posts.id, postId));
    }
  }

  await db.insert(referrers).values({
    postId,
    referrer: referrer ?? '',
  });

  const response = NextResponse.json({ ok: true });

  if (isNewVisitor) {
    response.cookies.set('_blog_vid', today, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 1일
    });
  }

  return response;
}
