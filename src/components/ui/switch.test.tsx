import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Switch } from './switch';

describe('Switch', () => {
  it('기본값은 unchecked이고 클릭하면 checked로 바뀐다', () => {
    render(<Switch aria-label="발행 상태" />);

    const target = screen.getByRole('switch', { name: '발행 상태' });
    expect(target).toHaveAttribute('data-state', 'unchecked');

    fireEvent.click(target);
    expect(target).toHaveAttribute('data-state', 'checked');
  });

  it('defaultChecked를 주면 checked 상태로 렌더된다', () => {
    render(<Switch defaultChecked aria-label="발행 상태" />);
    expect(screen.getByRole('switch', { name: '발행 상태' })).toHaveAttribute(
      'data-state',
      'checked'
    );
  });

  it('onCheckedChange가 새 값과 함께 호출된다', () => {
    const onCheckedChange = vi.fn();
    render(<Switch aria-label="발행 상태" onCheckedChange={onCheckedChange} />);

    fireEvent.click(screen.getByRole('switch', { name: '발행 상태' }));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('disabled면 클릭해도 상태가 바뀌지 않는다', () => {
    render(<Switch disabled aria-label="발행 상태" />);

    const target = screen.getByRole('switch', { name: '발행 상태' });
    fireEvent.click(target);
    expect(target).toHaveAttribute('data-state', 'unchecked');
  });
});
