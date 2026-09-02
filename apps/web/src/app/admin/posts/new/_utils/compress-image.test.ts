import { describe, expect, it, vi } from 'vitest';
import { compressImage, isCompressible } from './compress-image';

function fileOf(type: string, size = 10) {
  return new File([new Uint8Array(size)], `x.${type.split('/')[1]}`, { type });
}

describe('isCompressible', () => {
  it.each(['image/jpeg', 'image/png', 'image/webp'])(
    '%s 는 압축 대상',
    (type) => {
      expect(isCompressible(fileOf(type))).toBe(true);
    }
  );
  it.each(['image/gif', 'image/svg+xml', 'image/avif', 'text/plain'])(
    '%s 는 대상 아님',
    (type) => {
      expect(isCompressible(fileOf(type))).toBe(false);
    }
  );
});

describe('compressImage', () => {
  it('대상이 아니면 원본을 그대로 돌려준다', async () => {
    const gif = fileOf('image/gif');
    expect(await compressImage(gif)).toBe(gif);
  });

  it('createImageBitmap이 없거나 실패하면 원본을 돌려준다 (jsdom)', async () => {
    const png = fileOf('image/png');
    expect(await compressImage(png)).toBe(png);
  });

  it('압축 결과가 원본보다 크면 원본을 돌려준다', async () => {
    const png = fileOf('image/png', 4);
    const bitmap = { width: 10, height: 10, close: vi.fn() };
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(bitmap));
    const toBlob = vi.fn((cb: (b: Blob | null) => void) =>
      cb(new Blob([new Uint8Array(100)], { type: 'image/webp' }))
    );
    const getContext = vi.fn(() => ({ drawImage: vi.fn() }));
    vi.spyOn(document, 'createElement').mockImplementation(
      () =>
        ({
          width: 0,
          height: 0,
          getContext,
          toBlob,
        }) as unknown as HTMLCanvasElement
    );
    expect(await compressImage(png)).toBe(png);
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('압축 결과가 더 작으면 webp File을 돌려준다', async () => {
    const png = fileOf('image/png', 1000);
    const bitmap = { width: 3200, height: 1600, close: vi.fn() };
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(bitmap));
    const drawImage = vi.fn();
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => ({ drawImage }),
      toBlob: (cb: (b: Blob | null) => void) =>
        cb(new Blob([new Uint8Array(10)], { type: 'image/webp' })),
    };
    vi.spyOn(document, 'createElement').mockImplementation(
      () => canvas as unknown as HTMLCanvasElement
    );
    const out = await compressImage(png);
    expect(out.type).toBe('image/webp');
    expect(out.name).toBe('x.webp');
    expect(canvas.width).toBe(1600);
    expect(canvas.height).toBe(800);
    expect(drawImage).toHaveBeenCalledWith(bitmap, 0, 0, 1600, 800);
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });
});
