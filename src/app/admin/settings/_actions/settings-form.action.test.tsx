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

// edit-settings mock
vi.mock('../_services/edit-settings', () => ({
  editSettings: vi.fn().mockResolvedValue({ success: true }),
}));

// sonner mock
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { SettingsFormAction } from './settings-form.action';
import { editSettings } from '../_services/edit-settings';
import { toast } from 'sonner';

// -------------------------------------------------------------------
// zod 스키마 단위 테스트
// -------------------------------------------------------------------

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
// SettingsFormAction 컴포넌트 테스트
// -------------------------------------------------------------------

describe('SettingsFormAction', () => {
  it('기본 필드들이 렌더링된다', () => {
    render(<SettingsFormAction />);

    expect(screen.getByLabelText('블로그 이름 *')).toBeInTheDocument();
    expect(screen.getByLabelText('한 줄 소개')).toBeInTheDocument();
    expect(screen.getByLabelText('홈 문구')).toBeInTheDocument();
    expect(screen.getByLabelText('사이트 URL')).toBeInTheDocument();
    expect(screen.getByLabelText('기본 메타 설명')).toBeInTheDocument();
    expect(screen.getByLabelText('GitHub')).toBeInTheDocument();
    expect(screen.getByLabelText('Twitter / X')).toBeInTheDocument();
    expect(screen.getByLabelText('LinkedIn')).toBeInTheDocument();
  });

  it('변경 사항이 없으면 저장 바를 렌더하지 않는다', () => {
    render(<SettingsFormAction />);
    expect(
      screen.queryByRole('button', { name: '저장' })
    ).not.toBeInTheDocument();
  });

  it('필드를 바꾸면 하단 저장 바가 나타난다', () => {
    render(<SettingsFormAction />);
    fireEvent.change(screen.getByLabelText('블로그 이름 *'), {
      target: { value: 'YJlogs' },
    });
    expect(
      screen.getByRole('button', { name: '저장' })
    ).toBeInTheDocument();
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
      referrerExcludes: [],
      updatedAt: new Date(),
    };

    render(<SettingsFormAction defaultValues={defaultValues} />);

    expect(screen.getByLabelText('블로그 이름 *')).toHaveValue('My Blog');
    expect(screen.getByLabelText('한 줄 소개')).toHaveValue('기록하는 블로그');
    expect(screen.getByLabelText('홈 문구')).toHaveValue('개발자');
    expect(screen.getByLabelText('GitHub')).toHaveValue(
      'https://github.com/test',
    );
  });

  it('blogName이 없으면 유효성 에러가 표시된다', async () => {
    render(<SettingsFormAction />);

    // blogName의 기본값이 ''이므로 blogName만 바꿨다가 다시 비우면 값이 defaultValues와
    // 완전히 일치해 isDirty가 false로 되돌아가 저장 바가 사라진다. 다른 필드(한 줄 소개)를
    // 함께 변경해 폼을 dirty 상태로 유지하면서 blogName은 빈 값(무효 상태)으로 남긴다.
    fireEvent.change(screen.getByLabelText('한 줄 소개'), {
      target: { value: '임시' },
    });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => {
      expect(
        screen.getByText('블로그 이름은 필수입니다'),
      ).toBeInTheDocument();
    });
  });

  it('유효한 데이터 제출 시 editSettings가 호출된다', async () => {
    render(<SettingsFormAction />);

    fireEvent.change(screen.getByLabelText('블로그 이름 *'), {
      target: { value: 'YJlogs' },
    });

    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => {
      expect(editSettings).toHaveBeenCalledWith(
        expect.objectContaining({ blogName: 'YJlogs' }),
      );
    });
  });

  it('저장 성공 시 toast.success가 호출되고 저장 바가 사라진다', async () => {
    render(<SettingsFormAction />);

    fireEvent.change(screen.getByLabelText('블로그 이름 *'), {
      target: { value: 'YJlogs' },
    });

    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('설정이 저장되었습니다');
    });
    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: '저장' })
      ).not.toBeInTheDocument();
    });
  });

  it('저장 실패 시 toast.error가 호출된다', async () => {
    vi.mocked(editSettings).mockResolvedValueOnce({
      success: false,
      error: '저장 실패',
    });
    render(<SettingsFormAction />);

    fireEvent.change(screen.getByLabelText('블로그 이름 *'), {
      target: { value: 'YJlogs' },
    });

    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('저장 실패');
    });
  });
});
