import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CommentAvatar } from './comment-avatar';

describe('CommentAvatar', () => {
  it('이름의 첫 글자를 보여준다', () => {
    render(<CommentAvatar name="서준" />);
    expect(screen.getByText('서')).toBeInTheDocument();
  });

  it('영문 이름은 대문자로 보여준다', () => {
    render(<CommentAvatar name="alice" />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('이름이 비면 물음표를 보여준다', () => {
    render(<CommentAvatar name="" />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('장식 요소이므로 스크린리더에서 숨긴다', () => {
    const { container } = render(<CommentAvatar name="민" />);
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });
});
