import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { editReferrerExcludes } from '../_services/edit-referrer-excludes';
import { ReferrerExcludesFormAction } from './referrer-excludes-form.action';

vi.mock('../_services/edit-referrer-excludes', () => ({
  editReferrerExcludes: vi.fn(),
}));

describe('ReferrerExcludesFormAction', () => {
  beforeEach(() => {
    vi.mocked(editReferrerExcludes).mockReset();
  });

  it('규칙이 없으면 안내 문구를 보여준다', () => {
    render(<ReferrerExcludesFormAction excludes={[]} />);
    expect(
      screen.getByText('항상 제외할 유입 경로가 없습니다.')
    ).toBeInTheDocument();
  });

  it('기존 규칙을 칩으로 보여준다', () => {
    render(<ReferrerExcludesFormAction excludes={['t.co']} />);
    expect(screen.getByText('t.co')).toBeInTheDocument();
  });

  it('입력 후 추가 버튼을 누르면 새 규칙과 함께 저장한다', async () => {
    vi.mocked(editReferrerExcludes).mockResolvedValue({ success: true });
    render(<ReferrerExcludesFormAction excludes={['t.co']} />);

    fireEvent.change(screen.getByPlaceholderText('예: t.co'), {
      target: { value: 'l.facebook.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: '추가' }));

    await waitFor(() =>
      expect(editReferrerExcludes).toHaveBeenCalledWith([
        't.co',
        'l.facebook.com',
      ])
    );
  });

  it('칩의 삭제 버튼을 누르면 그 항목을 뺀 목록으로 저장한다', async () => {
    vi.mocked(editReferrerExcludes).mockResolvedValue({ success: true });
    render(<ReferrerExcludesFormAction excludes={['t.co', 'l.facebook.com']} />);

    fireEvent.click(
      screen.getByRole('button', { name: 't.co 제외 목록에서 삭제' })
    );

    await waitFor(() =>
      expect(editReferrerExcludes).toHaveBeenCalledWith(['l.facebook.com'])
    );
  });

  it('저장에 실패하면 에러 메시지를 보여준다', async () => {
    vi.mocked(editReferrerExcludes).mockResolvedValue({
      success: false,
      error: '저장 실패',
    });
    render(<ReferrerExcludesFormAction excludes={[]} />);

    fireEvent.change(screen.getByPlaceholderText('예: t.co'), {
      target: { value: 't.co' },
    });
    fireEvent.click(screen.getByRole('button', { name: '추가' }));

    expect(await screen.findByText('저장 실패')).toBeInTheDocument();
  });
});
