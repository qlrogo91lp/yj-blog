import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockCreate = vi.fn();

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn(function() {
    return {
      messages: { create: mockCreate },
    };
  }),
}));

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

import { generateExcerpt } from './generate-excerpt';
import { auth } from '@clerk/nextjs/server';

describe('generateExcerpt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = 'test-key';
    vi.mocked(auth).mockResolvedValue({ userId: 'user_1' } as never);
  });

  it('본문을 요약해 excerpt를 반환한다', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: '요약 결과입니다' }],
    });
    const result = await generateExcerpt('<p>긴 본문 내용</p>');
    expect(result.excerpt).toBe('요약 결과입니다');
    expect(mockCreate).toHaveBeenCalledOnce();
  });

  it('미인증이면 에러를 던진다', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);
    await expect(generateExcerpt('<p>x</p>')).rejects.toThrow('인증');
  });

  it('본문 텍스트가 비어 있으면 에러를 던진다', async () => {
    await expect(generateExcerpt('<p></p><img src="x" />')).rejects.toThrow(
      '본문',
    );
  });

  it('API 키가 없으면 에러를 던진다', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    await expect(generateExcerpt('<p>본문</p>')).rejects.toThrow(
      'ANTHROPIC_API_KEY',
    );
  });
});
