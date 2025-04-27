import Image from "next/image";

export default function Home() {
  return (
    <div>
      Next.js 13부터 도입된 새로운 라우팅 시스템<br />
      <h1>장점</h1>
      <h2>서버 컴포넌트 (React Server Components)</h2>
      <ul>
        <li>기본적으로 서버에서 렌더링되는 컴포넌트를 지원해 클라이언트 번들 크기를 줄이고 성능을 최적화할 수 있다.</li>
        <li>데이터 fetching이 더 간단해진다(예: async 함수로 직접 처리 가능).</li>
      </ul>
      <h2>중첩 레이아웃</h2>
      <ul>
        <li>layout.js를 통해 페이지별로 중첩된 레이아웃을 쉽게 구성할 수 있어 복잡한 UI 구조에 유리하다.</li>
      </ul>
      <h2>향상된 라우팅</h2>
      <ul>
        <li>동적 라우팅, 병렬 라우팅, 인터셉팅 라우팅 등 고급 기능이 추가</li>
        <li>파일 시스템 기반 라우팅이 더 직관적이고 유연하다</li>
      </ul>
      <h2>미래 지원</h2>
      <ul>
        <li>Next.js 팀이 App Router를 주력으로 개발 중이라 신규 기능(예: 캐싱, 스트리밍 등)이 이쪽에 먼저 적용된다.</li>
      </ul>
      <h1>단점</h1>
      <h2>학습 곡선</h2>
      <ul>
        <li>Pages Router에 익숙한 개발자라면 새로운 개념(서버 컴포넌트, loading.js, error.js 등)을 익혀야 한다.</li>
      </ul>
      <h2>서드파티 호환성</h2>
      <ul>
        <li>일부 기존 라이브러리나 플러그인이 아직 Pages Router에 더 잘 맞춰져 있을 수 있다.</li>
      </ul>
      <h2>정적 사이트 생성(SSG) 설정</h2>
      <ul>
        <li>Pages Router에 비해 정적 내보내기(next export)가 제한적일 수 있다(서버 기능 사용 시).</li>
      </ul>
    </div>
  );
}
