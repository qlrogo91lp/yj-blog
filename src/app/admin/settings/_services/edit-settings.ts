'use server';

import { revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/db/cache-tags';
import { updateBlogSettings } from '@/db/queries/settings';
import type { BlogSettingsFormValues } from '../_actions/settings-form.action';

export async function editSettings(data: BlogSettingsFormValues) {
  const { github, twitter, linkedin, ...rest } = data;

  const socialLinks: Record<string, string> = {};
  if (github) socialLinks.github = github;
  if (twitter) socialLinks.twitter = twitter;
  if (linkedin) socialLinks.linkedin = linkedin;

  await updateBlogSettings({ ...rest, socialLinks });

  revalidateTag(CACHE_TAGS.settings, 'max');
}
