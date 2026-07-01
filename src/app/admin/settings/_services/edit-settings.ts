'use server';

import { revalidateTag } from 'next/cache';
import { db } from '@/db';
import { CACHE_TAGS } from '@/db/cache-tags';
import { blogSettings } from '@/db/schema';
import type { BlogSettingsFormValues } from '../_components/settings-form';

export async function editSettings(data: BlogSettingsFormValues) {
  const { github, twitter, linkedin, ...rest } = data;

  const socialLinks: Record<string, string> = {};
  if (github) socialLinks.github = github;
  if (twitter) socialLinks.twitter = twitter;
  if (linkedin) socialLinks.linkedin = linkedin;

  await db
    .insert(blogSettings)
    .values({ id: 1, ...rest, socialLinks })
    .onConflictDoUpdate({
      target: blogSettings.id,
      set: { ...rest, socialLinks, updatedAt: new Date() },
    });

  revalidateTag(CACHE_TAGS.settings, 'max');
}
