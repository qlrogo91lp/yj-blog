import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../_services/generate-excerpt', () => ({
  generateExcerpt: vi.fn(),
}));

import { SeoSectionAction } from './seo-section.action';
import { useNewPostStore } from '../_store';

describe('SeoSectionAction', () => {
  beforeEach(() => {
    useNewPostStore.getState().reset();
  });

  it('토글 버튼이 보이고 클릭 시 입력 필드가 펼쳐진다', () => {
    render(<SeoSectionAction />);
    expect(screen.queryByLabelText('요약 (excerpt)')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /SEO 설정/ }));
    expect(screen.getByLabelText('요약 (excerpt)')).toBeInTheDocument();
    expect(screen.getByLabelText('SEO 제목 (meta title)')).toBeInTheDocument();
  });

  it('excerpt 입력 시 store가 업데이트된다', () => {
    render(<SeoSectionAction />);
    fireEvent.click(screen.getByRole('button', { name: /SEO 설정/ }));
    fireEvent.change(screen.getByLabelText('요약 (excerpt)'), {
      target: { value: '직접 입력한 요약' },
    });
    expect(useNewPostStore.getState().excerpt).toBe('직접 입력한 요약');
  });

  it('metaTitle 입력 시 store가 업데이트된다', () => {
    render(<SeoSectionAction />);
    fireEvent.click(screen.getByRole('button', { name: /SEO 설정/ }));
    fireEvent.change(screen.getByLabelText('SEO 제목 (meta title)'), {
      target: { value: '검색용 제목' },
    });
    expect(useNewPostStore.getState().metaTitle).toBe('검색용 제목');
  });

  it('본문이 비어 있으면 AI 생성 버튼이 비활성화된다', () => {
    render(<SeoSectionAction />);
    fireEvent.click(screen.getByRole('button', { name: /SEO 설정/ }));
    expect(
      screen.getByRole('button', { name: /AI로 요약 생성/ }),
    ).toBeDisabled();
  });

  it('본문이 있으면 AI 생성 버튼이 활성화된다', () => {
    useNewPostStore.getState().setContent('<p>본문 내용</p>');
    render(<SeoSectionAction />);
    fireEvent.click(screen.getByRole('button', { name: /SEO 설정/ }));
    expect(
      screen.getByRole('button', { name: /AI로 요약 생성/ }),
    ).toBeEnabled();
  });
});
