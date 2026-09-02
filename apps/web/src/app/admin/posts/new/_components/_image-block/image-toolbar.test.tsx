import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageToolbar } from './image-toolbar';

describe('ImageToolbar', () => {
  const baseProps = {
    size: 'default' as const,
    align: 'center' as const,
    alt: '',
    onSizeChange: vi.fn(),
    onAlignChange: vi.fn(),
    onAltChange: vi.fn(),
    onDelete: vi.fn(),
  };

  it('정렬 3개, 사이즈 3개, 삭제 버튼을 렌더한다', () => {
    render(<ImageToolbar {...baseProps} />);
    expect(screen.getByRole('button', { name: '왼쪽 정렬' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '가운데 정렬' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '오른쪽 정렬' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '40%' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '기본' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '전체 폭' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '이미지 삭제' })).toBeInTheDocument();
  });

  it('사이즈 버튼 클릭 시 onSizeChange 호출', () => {
    const onSizeChange = vi.fn();
    render(<ImageToolbar {...baseProps} onSizeChange={onSizeChange} />);
    fireEvent.click(screen.getByRole('button', { name: '40%' }));
    expect(onSizeChange).toHaveBeenCalledWith('small');
  });

  it('정렬 버튼 클릭 시 onAlignChange 호출', () => {
    const onAlignChange = vi.fn();
    render(<ImageToolbar {...baseProps} size="small" onAlignChange={onAlignChange} />);
    fireEvent.click(screen.getByRole('button', { name: '오른쪽 정렬' }));
    expect(onAlignChange).toHaveBeenCalledWith('right');
  });

  it('삭제 버튼 클릭 시 onDelete 호출', () => {
    const onDelete = vi.fn();
    render(<ImageToolbar {...baseProps} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole('button', { name: '이미지 삭제' }));
    expect(onDelete).toHaveBeenCalled();
  });

  it('size=full 이면 정렬 버튼 3개 모두 disabled', () => {
    render(<ImageToolbar {...baseProps} size="full" />);
    expect(screen.getByRole('button', { name: '왼쪽 정렬' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '가운데 정렬' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '오른쪽 정렬' })).toBeDisabled();
  });

  it('size=default이면 정렬 버튼 3개 모두 disabled', () => {
    render(<ImageToolbar {...baseProps} />);
    expect(screen.getByRole('button', { name: '왼쪽 정렬' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '가운데 정렬' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '오른쪽 정렬' })).toBeDisabled();
  });

  it('현재 size에 해당하는 버튼은 aria-pressed=true', () => {
    render(<ImageToolbar {...baseProps} size="small" />);
    expect(screen.getByRole('button', { name: '40%' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: '기본' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('alt 설정 톱니 버튼이 렌더된다', () => {
    render(<ImageToolbar {...baseProps} />);
    expect(
      screen.getByRole('button', { name: '대체 텍스트 설정' }),
    ).toBeInTheDocument();
  });

  it('톱니 클릭 시 alt input이 표시되고 기존 값을 가진다', () => {
    render(<ImageToolbar {...baseProps} alt="기존 alt" />);
    fireEvent.click(screen.getByRole('button', { name: '대체 텍스트 설정' }));
    expect(screen.getByLabelText('대체 텍스트 (alt)')).toHaveValue('기존 alt');
  });

  it('alt input 변경 시 onAltChange가 호출된다', () => {
    const onAltChange = vi.fn();
    render(<ImageToolbar {...baseProps} onAltChange={onAltChange} />);
    fireEvent.click(screen.getByRole('button', { name: '대체 텍스트 설정' }));
    fireEvent.change(screen.getByLabelText('대체 텍스트 (alt)'), {
      target: { value: '바뀐 alt' },
    });
    expect(onAltChange).toHaveBeenCalledWith('바뀐 alt');
  });

  it('정렬 버튼이 disabled일 때 사유를 title로 안내한다', () => {
    render(<ImageToolbar {...baseProps} size="default" />);
    expect(screen.getByRole('button', { name: '왼쪽 정렬' })).toHaveAttribute(
      'title',
      '40% 크기에서만 정렬할 수 있습니다',
    );
  });

  it('size=small이면 정렬 버튼에 title이 없다', () => {
    render(<ImageToolbar {...baseProps} size="small" />);
    expect(screen.getByRole('button', { name: '왼쪽 정렬' })).not.toHaveAttribute('title');
  });
});
