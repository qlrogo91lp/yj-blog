import { render, screen, fireEvent } from '@testing-library/react';
import type { NodeViewProps } from '@tiptap/core';
import { describe, expect, it, vi } from 'vitest';
import { GalleryNodeView } from './gallery-node-view';

vi.mock('@tiptap/react', () => ({
  NodeViewWrapper: ({ children, ...rest }: { children: React.ReactNode }) => (
    <div {...rest}>{children}</div>
  ),
}));

const images = [
  { src: 'a.png', alt: '가', caption: '첫째', width: 1600, height: 1067 },
  { src: 'b.png', alt: '나', caption: '', width: 1067, height: 1600 },
  { src: 'c.png', alt: '다', caption: '', width: 800, height: 800 },
];

function setup(overrides: Partial<NodeViewProps> = {}) {
  const updateAttributes = vi.fn();
  const deleteNode = vi.fn();
  const props = {
    node: { attrs: { images } },
    updateAttributes,
    deleteNode,
    selected: true,
    ...overrides,
  } as unknown as NodeViewProps;
  render(<GalleryNodeView {...props} />);
  return { updateAttributes, deleteNode };
}

describe('GalleryNodeView', () => {
  it('이미지 수만큼 렌더한다', () => {
    setup();
    expect(screen.getAllByRole('img')).toHaveLength(3);
  });

  it('오른쪽 이동은 배열 순서를 바꾼다', () => {
    const { updateAttributes } = setup();
    fireEvent.click(screen.getAllByRole('button', { name: '오른쪽으로 이동' })[0]);
    expect(updateAttributes).toHaveBeenCalledWith({
      images: [images[1], images[0], images[2]],
    });
  });

  it('삭제는 해당 항목만 제거한다', () => {
    const { updateAttributes } = setup();
    fireEvent.click(screen.getAllByRole('button', { name: '슬라이드 삭제' })[1]);
    expect(updateAttributes).toHaveBeenCalledWith({
      images: [images[0], images[2]],
    });
  });

  it('마지막 1장을 삭제하면 노드를 통째로 지운다', () => {
    const { deleteNode, updateAttributes } = setup({
      node: { attrs: { images: [images[0]] } },
    } as unknown as Partial<NodeViewProps>);
    fireEvent.click(screen.getByRole('button', { name: '슬라이드 삭제' }));
    expect(deleteNode).toHaveBeenCalled();
    expect(updateAttributes).not.toHaveBeenCalled();
  });

  it('첫 슬라이드의 왼쪽 이동과 마지막 슬라이드의 오른쪽 이동은 비활성이다', () => {
    setup();
    expect(screen.getAllByRole('button', { name: '왼쪽으로 이동' })[0]).toBeDisabled();
    expect(screen.getAllByRole('button', { name: '오른쪽으로 이동' })[2]).toBeDisabled();
  });

  it('선택되지 않으면 조작 바를 렌더하지 않는다', () => {
    setup({ selected: false } as unknown as Partial<NodeViewProps>);
    expect(screen.queryByRole('button', { name: '슬라이드 삭제' })).not.toBeInTheDocument();
  });
});
