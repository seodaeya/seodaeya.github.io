/**
 * Mermaid 지연 로더 (클라이언트 전용)
 *
 * 과거에는 CDN의 `mermaid@10/dist/mermaid.min.js`(gzip 약 993KB, 원본 3.4MB)를
 * <script>로 주입했다. 이 파일은 모든 다이어그램 종류를 한 번에 포함하는 UMD 빌드라
 * 다이어그램 2개를 그리기 위해 1MB 가까운 JS를 내려받고 파싱해야 했다.
 *
 * 대신 npm `mermaid@11`의 ESM 코어를 동적 import하면 webpack이 다이어그램별 청크로
 * 자동 분할한다. 실제로 쓰는 flowchart 청크만 추가로 받고, 나머지 다이어그램 코드는
 * 네트워크로 내려오지 않는다. (CDN 의존성과 v10/v11 버전 불일치도 함께 제거)
 */

let mermaidPromise = null;

export function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then((mod) => mod.default || mod.mermaid || mod);
  }
  return mermaidPromise;
}
