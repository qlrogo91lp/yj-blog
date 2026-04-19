'use server';

import { revalidateTag } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { CACHE_TAGS } from '@/db/cache-tags';
import { tags } from '@/db/schema';
import { generateSlug } from '@/lib/slugify';

type CreateTagResult =
  | { success: true; tag: { id: number; name: string; slug: string } }
  | { success: false; error: string };

export async function createTag(name: string): Promise<CreateTagResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: '인증이 필요합니다' };

  const trimmed = name.trim();
  if (!trimmed) return { success: false, error: '태그명을 입력해주세요' };
  if (trimmed.length > 50) return { success: false, error: '태그명은 50자 이하여야 합니다' };

  const slug = generateSlug(trimmed);

  try {
    const existing = await db
      .select({ id: tags.id, name: tags.name, slug: tags.slug })
      .from(tags)
      .where(eq(tags.slug, slug))
      .limit(1);

    if (existing[0]) {
      return { success: true, tag: existing[0] };
    }

    const [newTag] = await db
      .insert(tags)
      .values({ name: trimmed, slug })
      .returning({ id: tags.id, name: tags.name, slug: tags.slug });

    revalidateTag(CACHE_TAGS.tags, 'max');
    return { success: true, tag: newTag };
  } catch {
    return { success: false, error: '태그 생성에 실패했습니다' };
  }
}
