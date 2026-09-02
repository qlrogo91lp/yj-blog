'use server';

import { revalidateTag } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { CACHE_TAGS } from '@/db/cache-tags';
import { updateBlogSettings } from '@/db/queries/settings';
import type { BlogSettingsFormValues } from '../_actions/settings-form.action';

type Result = { success: true } | { success: false; error: string };

export async function editSettings(
  data: BlogSettingsFormValues
): Promise<Result> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: '인증이 필요합니다' };
  }

  const { github, twitter, linkedin, ...rest } = data;
  const socialLinks: Record<string, string> = {};
  if (github) socialLinks.github = github;
  if (twitter) socialLinks.twitter = twitter;
  if (linkedin) socialLinks.linkedin = linkedin;

  try {
    await updateBlogSettings({ ...rest, socialLinks });
    revalidateTag(CACHE_TAGS.settings, 'max');
    return { success: true };
  } catch {
    return { success: false, error: '저장에 실패했습니다' };
  }
}
