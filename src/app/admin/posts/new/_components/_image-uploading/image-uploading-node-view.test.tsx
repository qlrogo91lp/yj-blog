import { render, screen } from '@testing-library/react';
import type { NodeViewProps } from '@tiptap/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ImageUploadingNodeView } from './image-uploading-node-view';

vi.mock('@tiptap/react', () => ({
  NodeViewWrapper: ({ children, ...rest }: { children: React.ReactNode }) => (
    <figure {...rest}>{children}</figure>
  ),
}));

const baseProps = {
  node: { attrs: { id: 'abc', previewUrl: 'blob:preview' } },
} as unknown as NodeViewProps;

describe('ImageUploadingNodeView', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('previewUrl로 미리보기 이미지를 렌더한다', () => {
    render(<ImageUploadingNodeView {...baseProps} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'blob:preview');
  });

  it('업로드 중 텍스트가 표시된다', () => {
    render(<ImageUploadingNodeView {...baseProps} />);
    expect(screen.getByText('업로드 중...')).toBeInTheDocument();
  });

  it('unmount 시 URL.revokeObjectURL을 호출한다', () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const { unmount } = render(<ImageUploadingNodeView {...baseProps} />);
    unmount();
    expect(revoke).toHaveBeenCalledWith('blob:preview');
  });
});
