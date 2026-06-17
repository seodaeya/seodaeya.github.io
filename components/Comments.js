import { useEffect, useRef } from 'react';

export default function Comments() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 현재 적용된 문서의 테마 상태에 맞는 Giscus 테마를 결정
    const isLight = document.documentElement.classList.contains('light');
    const giscusTheme = isLight ? 'light' : 'dark';

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    
    // Giscus 설정 파라미터 (저장소와 토론을 연동)
    // 💡 실제 사용 시 아래 Repo ID 및 Category ID 값을 본인의 설정값으로 변경해야 작동합니다.
    script.setAttribute('data-repo', 'seodaeya/seodaeya.github.io');
    script.setAttribute('data-repo-id', 'R_kgDONGq17w'); // 👈 본인의 Giscus Repository ID 입력
    script.setAttribute('data-category', 'General');
    script.setAttribute('data-category-id', 'DIC_kwDONGq1784Chl9A'); // 👈 본인의 Giscus Category ID 입력
    
    script.setAttribute('data-mapping', 'pathname');
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'bottom');
    script.setAttribute('data-theme', giscusTheme);
    script.setAttribute('data-lang', 'ko');
    script.setAttribute('data-loading', 'lazy');

    // 컨테이너 초기화 후 스크립트 탑재
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(script);
  }, []);

  return (
    <div style={{ marginTop: '56px', borderTop: '1px solid var(--border-glass)', paddingTop: '40px' }}>
      <h3 style={{ marginBottom: '24px', fontSize: '1.3rem', fontWeight: 700 }}>💬 댓글 나누기</h3>
      {/* Giscus Widget이 렌더링될 영역 */}
      <div ref={containerRef} className="giscus" />
    </div>
  );
}
