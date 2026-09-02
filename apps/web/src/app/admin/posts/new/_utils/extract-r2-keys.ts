/**
 * 본문 HTML 문자열에서 R2 public URL로 시작하는 src의 키를 모은다.
 * 서버(savePost)에서 post_images와 대조해 고아 파일을 찾는 데 쓴다.
 * TipTap 없이 문자열만으로 동작해야 하므로 정규식으로 처리한다.
 */
export function extractR2Keys(html: string, publicUrl: string): Set<string> {
  const keys = new Set<string>();
  if (!publicUrl) return keys;

  const prefix = `${publicUrl}/`;
  const srcPattern = /\ssrc=["']([^"']+)["']/g;
  let match: RegExpExecArray | null;
  while ((match = srcPattern.exec(html)) !== null) {
    const src = match[1];
    if (src.startsWith(prefix)) keys.add(src.slice(prefix.length));
  }
  return keys;
}
