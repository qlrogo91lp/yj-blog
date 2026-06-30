'use server';

import Anthropic from '@anthropic-ai/sdk';
import { auth } from '@clerk/nextjs/server';

const MAX_CONTENT_LENGTH = 4000;

export async function generateExcerpt(
  contentHtml: string,
): Promise<{ excerpt: string }> {
  const { userId } = await auth();
  if (!userId) throw new Error('인증이 필요합니다');

  const text = contentHtml
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) throw new Error('본문이 비어 있어 요약할 수 없습니다');

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY가 설정되지 않았습니다');

  const anthropic = new Anthropic({ apiKey });
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 200,
    messages: [
      {
        role: 'user',
        content:
          '다음 블로그 글을 검색 노출용으로 150자 이내 한국어 한 문단으로 요약해줘. ' +
          '"이 글은" 같은 메타발언이나 군더더기 없이 핵심 내용만 담아줘:\n\n' +
          text.slice(0, MAX_CONTENT_LENGTH),
      },
    ],
  });

  const block = message.content[0];
  const excerpt = block && block.type === 'text' ? block.text.trim() : '';
  return { excerpt };
}
