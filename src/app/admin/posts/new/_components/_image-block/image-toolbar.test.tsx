import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageToolbar } from './image-toolbar';

describe('ImageToolbar', () => {
  const baseProps = {
    size: 'medium' as const,
    align: 'center' as const,
    onSizeChange: vi.fn(),
    onAlignChange: vi.fn(),
    onDelete: vi.fn(),
  };

  it('정렬 3개, 사이즈 3개, 삭제 버튼을 렌더한다', () => {
    render(<ImageToolbar {...baseProps} />);
    expect(screen.getByRole('button', { name: '왼쪽 정렬' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '가운데 정렬' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '오른쪽 정렬' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '작게' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '중간' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '글 너비' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '이미지 삭제' })).toBeInTheDocument();
  });

  it('사이즈 버튼 클릭 시 onSizeChange 호출', () => {
    const onSizeChange = vi.fn();
    render(<ImageToolbar {...baseProps} onSizeChange={onSizeChange} />);
    fireEvent.click(screen.getByRole('button', { name: '작게' }));
    expect(onSizeChange).toHaveBeenCalledWith('small');
  });

  it('정렬 버튼 클릭 시 onAlignChange 호출', () => {
    const onAlignChange = vi.fn();
    render(<ImageToolbar {...baseProps} onAlignChange={onAlignChange} />);
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

  it('현재 size에 해당하는 버튼은 aria-pressed=true', () => {
    render(<ImageToolbar {...baseProps} size="small" />);
    expect(screen.getByRole('button', { name: '작게' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: '중간' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });
});
