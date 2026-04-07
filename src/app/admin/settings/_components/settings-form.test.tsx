import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { z } from 'zod';

// next/link mock
vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

// update-settings mock
vi.mock('../_services/update-settings', () => ({
  updateSettings: vi.fn().mockResolvedValue(undefined),
}));

// sonner mock
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { SettingsForm } from './settings-form';
import { updateSettings } from '../_services/update-settings';
import { toast } from 'sonner';

// -------------------------------------------------------------------
// zod 스키마 단위 테스트
// -------------------------------------------------------------------

// 내부 스키마와 동일하게 정의 (export 하지 않으므로 직접 정의)
const blogSettingsSchema = z.object({
  blogName: z.string().min(1, '블로그 이름은 필수입니다').max(100),
  tagline: z.string().max(255).optional(),
  authorBio: z.string().optional(),
  siteUrl: z
    .string()
    .url('유효한 URL을 입력하세요')
    .max(255)
    .optional()
    .or(z.literal('')),
  defaultMetaDescription: z.string().max(300).optional(),
  github: z.string().url('유효한 URL을 입력하세요').optional().or(z.literal('')),
  twitter: z
    .string()
    .url('유효한 URL을 입력하세요')
    .optional()
    .or(z.literal('')),
  linkedin: z
    .string()
    .url('유효한 URL을 입력하세요')
    .optional()
    .or(z.literal('')),
});

describe('blogSettingsSchema', () => {
  const validData = { blogName: 'YJlogs' };

  it('blogName만 있어도 유효하다', () => {
    expect(blogSettingsSchema.safeParse(validData).success).toBe(true);
  });

  it('blogName이 비어 있으면 실패한다', () => {
    const result = blogSettingsSchema.safeParse({ blogName: '' });
    expect(result.success).toBe(false);
  });

  it('유효한 siteUrl은 통과한다', () => {
    const result = blogSettingsSchema.safeParse({
      ...validData,
      siteUrl: 'https://yjlogs.com',
    });
    expect(result.success).toBe(true);
  });

  it('빈 문자열 siteUrl은 통과한다', () => {
    const result = blogSettingsSchema.safeParse({ ...validData, siteUrl: '' });
    expect(result.success).toBe(true);
  });

  it('잘못된 형식의 siteUrl은 실패한다', () => {
    const result = blogSettingsSchema.safeParse({
      ...validData,
      siteUrl: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });

  it('유효한 github URL은 통과한다', () => {
    const result = blogSettingsSchema.safeParse({
      ...validData,
      github: 'https://github.com/yjkim91',
    });
    expect(result.success).toBe(true);
  });

  it('잘못된 형식의 github URL은 실패한다', () => {
    const result = blogSettingsSchema.safeParse({
      ...validData,
      github: 'github.com/yjkim91',
    });
    expect(result.success).toBe(false);
  });

  it('blogName이 100자를 초과하면 실패한다', () => {
    const result = blogSettingsSchema.safeParse({
      blogName: 'a'.repeat(101),
    });
    expect(result.success).toBe(false);
  });
});

// -------------------------------------------------------------------
// SettingsForm 컴포넌트 테스트
// -------------------------------------------------------------------

describe('SettingsForm', () => {
  it('기본 필드들이 렌더링된다', () => {
    render(<SettingsForm />);

    expect(screen.getByLabelText('블로그 이름 *')).toBeInTheDocument();
    expect(screen.getByLabelText('태그라인')).toBeInTheDocument();
    expect(screen.getByLabelText('소개')).toBeInTheDocument();
    expect(screen.getByLabelText('사이트 URL')).toBeInTheDocument();
    expect(screen.getByLabelText('기본 메타 설명')).toBeInTheDocument();
    expect(screen.getByLabelText('GitHub')).toBeInTheDocument();
    expect(screen.getByLabelText('Twitter / X')).toBeInTheDocument();
    expect(screen.getByLabelText('LinkedIn')).toBeInTheDocument();
  });

  it('저장 버튼이 렌더링된다', () => {
    render(<SettingsForm />);
    expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument();
  });

  it('defaultValues가 폼 필드에 반영된다', () => {
    const defaultValues = {
      id: 1,
      blogName: 'My Blog',
      tagline: '기록하는 블로그',
      authorBio: '개발자',
      siteUrl: 'https://example.com',
      defaultMetaDescription: '설명',
      socialLinks: { github: 'https://github.com/test' },
      updatedAt: new Date(),
    };

    render(<SettingsForm defaultValues={defaultValues} />);

    expect(screen.getByLabelText('블로그 이름 *')).toHaveValue('My Blog');
    expect(screen.getByLabelText('태그라인')).toHaveValue('기록하는 블로그');
    expect(screen.getByLabelText('소개')).toHaveValue('개발자');
    expect(screen.getByLabelText('GitHub')).toHaveValue(
      'https://github.com/test',
    );
  });

  it('blogName이 없으면 유효성 에러가 표시된다', async () => {
    render(<SettingsForm />);

    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => {
      expect(
        screen.getByText('블로그 이름은 필수입니다'),
      ).toBeInTheDocument();
    });
  });

  it('유효한 데이터 제출 시 updateSettings가 호출된다', async () => {
    render(<SettingsForm />);

    fireEvent.change(screen.getByLabelText('블로그 이름 *'), {
      target: { value: 'YJlogs' },
    });

    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => {
      expect(updateSettings).toHaveBeenCalledWith(
        expect.objectContaining({ blogName: 'YJlogs' }),
      );
    });
  });

  it('저장 성공 시 toast.success가 호출된다', async () => {
    render(<SettingsForm />);

    fireEvent.change(screen.getByLabelText('블로그 이름 *'), {
      target: { value: 'YJlogs' },
    });

    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('설정이 저장되었습니다');
    });
  });
});
