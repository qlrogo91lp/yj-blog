import { describe, expect, it } from 'vitest';
import { seriesFormSchema } from '@/types/series';

const validData = {
  name: 'Ralli 개발기',
  slug: 'ralli-dev',
  description: 'Ralli 앱을 만들며 기록한 개발 일지',
};

describe('seriesFormSchema', () => {
  it('유효한 데이터는 파싱 성공', () => {
    expect(seriesFormSchema.safeParse(validData).success).toBe(true);
  });

  it('description 없이도 성공 (optional)', () => {
    const { description: _, ...withoutDescription } = validData;
    expect(seriesFormSchema.safeParse(withoutDescription).success).toBe(true);
  });

  describe('name', () => {
    it('빈 문자열이면 실패', () => {
      expect(seriesFormSchema.safeParse({ ...validData, name: '' }).success).toBe(false);
    });

    it('100자 초과면 실패', () => {
      expect(
        seriesFormSchema.safeParse({ ...validData, name: 'a'.repeat(101) }).success
      ).toBe(false);
    });
  });

  describe('slug', () => {
    it('영소문자·숫자·하이픈 조합은 성공', () => {
      expect(
        seriesFormSchema.safeParse({ ...validData, slug: 'ralli-dev-1' }).success
      ).toBe(true);
    });

    it('한글 slug는 성공 (post slug 규칙과 동일)', () => {
      expect(
        seriesFormSchema.safeParse({ ...validData, slug: '랠리-개발기' }).success
      ).toBe(true);
    });

    it('대문자가 있으면 실패', () => {
      expect(
        seriesFormSchema.safeParse({ ...validData, slug: 'Ralli-Dev' }).success
      ).toBe(false);
    });

    it('공백이 있으면 실패', () => {
      expect(
        seriesFormSchema.safeParse({ ...validData, slug: 'ralli dev' }).success
      ).toBe(false);
    });

    it('빈 문자열이면 실패', () => {
      expect(seriesFormSchema.safeParse({ ...validData, slug: '' }).success).toBe(false);
    });
  });

  describe('description', () => {
    it('500자 초과면 실패', () => {
      expect(
        seriesFormSchema.safeParse({ ...validData, description: 'a'.repeat(501) }).success
      ).toBe(false);
    });
  });
});
