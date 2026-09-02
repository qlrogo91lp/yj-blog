import { fireEvent, render, screen } from '@testing-library/react';
import type { NodeViewProps } from '@tiptap/core';
import { describe, expect, it, vi } from 'vitest';
import { ImageNodeView } from './image-node-view';

vi.mock('@tiptap/react', () => ({
  NodeViewWrapper: ({
    children,
    as: _as,
    ...rest
  }: {
    children: React.ReactNode;
    as?: string;
  }) => <figure {...rest}>{children}</figure>,
}));

function setup(overrides: Partial<NodeViewProps> = {}) {
  const updateAttributes = vi.fn();
  const props = {
    node: {
      attrs: {
        src: 'https://cdn/a.png',
        alt: '',
        size: 'default',
        align: 'center',
        caption: '',
      },
    },
    updateAttributes,
    deleteNode: vi.fn(),
    selected: false,
    ...overrides,
  } as unknown as NodeViewProps;
  const utils = render(<ImageNodeView {...props} />);
  return { ...utils, updateAttributes };
}

describe('ImageNodeView', () => {
  it('img가 드래그 핸들이다 (data-drag-handle)', () => {
    // alt=""인 <img>는 접근성 트리에서 role="presentation"으로 계산되어
    // getByRole('img')로 찾을 수 없다 — querySelector로 직접 조회한다.
    const { container } = setup();
    expect(container.querySelector('img')).toHaveAttribute('data-drag-handle');
  });

  it('선택되지 않았고 캡션이 없으면 캡션 input을 렌더하지 않는다', () => {
    setup();
    expect(
      screen.queryByPlaceholderText('캡션 추가...')
    ).not.toBeInTheDocument();
  });

  it('선택되면 캡션 input을 렌더하고 입력 시 updateAttributes({ caption })', () => {
    const { updateAttributes } = setup({ selected: true });
    const input = screen.getByPlaceholderText('캡션 추가...');
    fireEvent.change(input, { target: { value: '설명' } });
    expect(updateAttributes).toHaveBeenCalledWith({ caption: '설명' });
  });

  it('NodeView 안에 툴바(정렬·삭제 버튼)를 렌더하지 않는다 — BubbleMenu로 이전', () => {
    setup({ selected: true });
    expect(
      screen.queryByRole('button', { name: '이미지 삭제' })
    ).not.toBeInTheDocument();
  });
});
