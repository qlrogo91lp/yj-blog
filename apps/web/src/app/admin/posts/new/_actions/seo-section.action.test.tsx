import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useNewPostStore } from '../_store';
import { SeoSectionAction } from './seo-section.action';

vi.mock('../_services/generate-excerpt', () => ({
  generateExcerpt: vi.fn(),
}));

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
      screen.getByRole('button', { name: /AI로 요약 생성/ })
    ).toBeDisabled();
  });

  it('본문이 있으면 AI 생성 버튼이 활성화된다', () => {
    useNewPostStore.getState().setContent('<p>본문 내용</p>');
    render(<SeoSectionAction />);
    fireEvent.click(screen.getByRole('button', { name: /SEO 설정/ }));
    expect(
      screen.getByRole('button', { name: /AI로 요약 생성/ })
    ).toBeEnabled();
  });

  it('slug 입력 필드가 있고 입력 시 store가 업데이트된다', () => {
    render(<SeoSectionAction />);
    fireEvent.click(screen.getByRole('button', { name: /SEO 설정/ }));
    const input = screen.getByLabelText('URL slug');
    fireEvent.change(input, { target: { value: 'my-post' } });
    expect(useNewPostStore.getState().slug).toBe('my-post');
  });

  it('slug가 비어 있으면 제목 기반 자동 slug를 placeholder로 보여준다', () => {
    useNewPostStore.getState().setTitle('Hello World');
    render(<SeoSectionAction />);
    fireEvent.click(screen.getByRole('button', { name: /SEO 설정/ }));
    expect(screen.getByLabelText('URL slug')).toHaveAttribute(
      'placeholder',
      'hello-world'
    );
  });

  it('허용되지 않는 문자가 있으면 안내문을 보여준다', () => {
    render(<SeoSectionAction />);
    fireEvent.click(screen.getByRole('button', { name: /SEO 설정/ }));
    fireEvent.change(screen.getByLabelText('URL slug'), {
      target: { value: 'Hello World!' },
    });
    expect(
      screen.getByText('영소문자, 숫자, 한글, 하이픈만 사용할 수 있습니다')
    ).toBeInTheDocument();
  });
});
