/**
 * 업로드 전 파일에서 원본 픽셀 크기를 읽는다.
 * 갤러리 img의 width/height 속성에 넣어 브라우저가 종횡비를 미리 알게 한다.
 * 측정에 실패해도 갤러리는 동작해야 하므로 0으로 폴백한다.
 */
export function readImageSize(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ width: 0, height: 0 });
    };
    image.src = url;
  });
}
