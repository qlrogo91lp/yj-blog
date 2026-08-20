const maxEdgePx = 1600;
const webpQuality = 0.85;
const compressibleTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function isCompressible(file: File): boolean {
  return compressibleTypes.has(file.type);
}

/**
 * 업로드 전 클라이언트 압축: 긴 변 1600px, webp 0.85.
 * - gif(애니메이션)·svg·avif는 건드리지 않는다.
 * - 실패하거나 결과가 원본보다 크면 원본을 그대로 쓴다.
 * 썸네일(OG 이미지로 원본 URL이 노출됨)·본문 이미지 모두 이 함수를 거친다.
 */
export async function compressImage(file: File): Promise<File> {
  if (!isCompressible(file)) return file;
  if (typeof createImageBitmap !== 'function') return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxEdgePx / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', webpQuality),
    );
    if (!blob || blob.size >= file.size) return file;

    const baseName = file.name.replace(/\.[^.]+$/, '');
    return new File([blob], `${baseName}.webp`, { type: 'image/webp' });
  } catch {
    return file;
  }
}
