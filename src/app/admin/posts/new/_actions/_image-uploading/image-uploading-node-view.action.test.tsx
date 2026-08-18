import { render, screen } from '@testing-library/react';
import type { NodeViewProps } from '@tiptap/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ImageUploadingNodeViewAction } from './image-uploading-node-view.action';

vi.mock('@tiptap/react', () => ({
  NodeViewWrapper: ({ children, ...rest }: { children: React.ReactNode }) => (
    <figure {...rest}>{children}</figure>
  ),
}));

const baseProps = {
  node: { attrs: { id: 'abc', previewUrl: 'blob:preview' } },
} as unknown as NodeViewProps;

describe('ImageUploadingNodeViewAction', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('previewUrl로 미리보기 이미지를 렌더한다', () => {
    render(<ImageUploadingNodeViewAction {...baseProps} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'blob:preview');
  });

  it('업로드 중 텍스트가 표시된다', () => {
    render(<ImageUploadingNodeViewAction {...baseProps} />);
    expect(screen.getByText('업로드 중...')).toBeInTheDocument();
  });

  it('unmount 시 URL.revokeObjectURL을 호출한다', () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const { unmount } = render(<ImageUploadingNodeViewAction {...baseProps} />);
    unmount();
    expect(revoke).toHaveBeenCalledWith('blob:preview');
  });

  it('total이 2 이상이면 장수를 표시한다', () => {
    const props = {
      node: { attrs: { id: 'abc', previewUrl: 'blob:preview', total: 3 } },
    } as unknown as NodeViewProps;
    render(<ImageUploadingNodeViewAction {...props} />);
    expect(screen.getByText('3장 업로드 중...')).toBeInTheDocument();
  });
});
