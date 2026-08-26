import React, { useState } from 'react';

export default function PastelFlowGraph({ mode = 'ex1' }) {
  const [hoveredNode, setHoveredNode] = useState(null);

  return (
    <div style={{
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px 0',
      overflowX: 'auto'
    }}>
      {/* ========================================================
          ex1: 검색어 '여름 시원한 출근 셔츠' + 온톨로지 연역 추론 체인
          ======================================================== */}
      {mode === 'ex1' && (
        <svg
          viewBox="0 0 820 460"
          style={{
            width: '100%',
            maxWidth: '820px',
            height: 'auto',
            display: 'block',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif'
          }}
        >
          {/* Arrowhead Marker Definitions */}
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#64748b" />
            </marker>
            <marker id="arrow-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#0284c7" />
            </marker>
            <marker id="arrow-pink" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#e11d48" />
            </marker>
          </defs>

          {/* =================================================================
              1. STRAIGHT CRISP CONNECTORS & LABELS (절도 있는 직선 연결선)
              ================================================================= */}

          {/* [검색어] -> [린넨 셔츠] (다단계 시맨틱 연역 추론: 수직 직선) */}
          <line x1="165" y1="78" x2="165" y2="128" stroke="#0284c7" strokeWidth="2" markerEnd="url(#arrow-blue)" />
          <text x="175" y="108" fill="#0369a1" fontSize="12.5" fontWeight="700">다단계 시맨틱 연역 추론</text>

          {/* [검색어] -> [여름철 의도 분해] (직선 꺾임 점선) */}
          <path d="M 285 49 L 750 49 L 750 355 L 490 355" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="5 4" markerEnd="url(#arrow)" />
          <text x="740" y="200" textAnchor="end" fill="#64748b" fontSize="11.5" fontWeight="500">자연어 의도 분해 (여름)</text>

          {/* [검색어] -> [출근룩 의도 분해] (직선 꺾임 점선) */}
          <path d="M 285 62 L 600 62 L 600 240" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="5 4" markerEnd="url(#arrow)" />
          <text x="590" y="150" textAnchor="end" fill="#64748b" fontSize="11.5" fontWeight="500">자연어 의도 분해 (출근)</text>

          {/* [린넨 드레스 셔츠] -> [마 / Linen] (가로 직선) */}
          <line x1="245" y1="160" x2="320" y2="160" stroke="#64748b" strokeWidth="1.6" markerEnd="url(#arrow)" />
          <text x="282" y="150" textAnchor="middle" fill="#64748b" fontSize="12" fontWeight="500">소재</text>

          {/* [마 / Linen] -> [통기성 우수] (세로 직선) */}
          <line x1="405" y1="188" x2="405" y2="238" stroke="#64748b" strokeWidth="1.6" markerEnd="url(#arrow)" />
          <text x="445" y="218" textAnchor="start" fill="#64748b" fontSize="12" fontWeight="500">물리적 특성</text>

          {/* [통기성 우수] -> [여름 / 무더위] (세로 직선) */}
          <line x1="405" y1="304" x2="405" y2="350" stroke="#64748b" strokeWidth="1.6" markerEnd="url(#arrow)" />
          <text x="445" y="332" textAnchor="start" fill="#64748b" fontSize="12" fontWeight="500">적합 계절</text>

          {/* [여름 / 무더위] -> [드레스 셔츠 / TPO] (직선 연결) */}
          <line x1="485" y1="383" x2="520" y2="383 L 520 274" stroke="#64748b" strokeWidth="1.6" markerEnd="url(#arrow)" />

          {/* =================================================================
              2. ROUNDED PASTEL CARDS (둥근 파스텔 카드 UI)
              ================================================================= */}

          {/* Card 0: 🔍 검색어: '여름 시원한 출근 셔츠' (최상단 아이스 블루 카드) */}
          <g onMouseEnter={() => setHoveredNode('query')} onMouseLeave={() => setHoveredNode(null)} style={{ cursor: 'pointer' }}>
            <rect x="45" y="20" width="240" height="58" rx="16" ry="16" fill="#e0f2fe" stroke="#7dd3fc" strokeWidth="1.6" />
            <text x="165" y="45" textAnchor="middle" fill="#0369a1" fontSize="14" fontWeight="700">🔍 검색어</text>
            <text x="165" y="65" textAnchor="middle" fill="#0c4a6e" fontSize="13.5" fontWeight="600">"여름 시원한 출근 셔츠"</text>
          </g>

          {/* Card 1: 린넨 드레스 셔츠 (소프트 피치) */}
          <g onMouseEnter={() => setHoveredNode('c1')} onMouseLeave={() => setHoveredNode(null)} style={{ cursor: 'pointer' }}>
            <rect x="45" y="130" width="200" height="60" rx="14" ry="14" fill="#fbf0ee" stroke="#e8c2bd" strokeWidth="1.4" />
            <text x="145" y="156" textAnchor="middle" fill="#881337" fontSize="15" fontWeight="700">린넨 드레스 셔츠</text>
            <text x="145" y="176" textAnchor="middle" fill="#9f1239" fontSize="12" fontWeight="400">남성 슬림핏</text>
          </g>

          {/* Card 2: 마 / Linen (소프트 허니) */}
          <g onMouseEnter={() => setHoveredNode('c2')} onMouseLeave={() => setHoveredNode(null)} style={{ cursor: 'pointer' }}>
            <rect x="325" y="130" width="160" height="58" rx="14" ry="14" fill="#fbf3e6" stroke="#ead2b5" strokeWidth="1.4" />
            <text x="405" y="165" textAnchor="middle" fill="#78350f" fontSize="15.5" fontWeight="600">마 / Linen</text>
          </g>

          {/* Card 3: 통기성 우수 / 땀 흡수 (소프트 허니) */}
          <g onMouseEnter={() => setHoveredNode('c3')} onMouseLeave={() => setHoveredNode(null)} style={{ cursor: 'pointer' }}>
            <rect x="325" y="240" width="160" height="64" rx="14" ry="14" fill="#fbf3e6" stroke="#ead2b5" strokeWidth="1.4" />
            <text x="405" y="267" textAnchor="middle" fill="#78350f" fontSize="15" fontWeight="600">통기성 우수</text>
            <text x="405" y="289" textAnchor="middle" fill="#92400e" fontSize="13" fontWeight="400">땀 흡수</text>
          </g>

          {/* Card 4: 여름 / 무더위 / 적합 시즌 (소프트 민트) */}
          <g onMouseEnter={() => setHoveredNode('c4')} onMouseLeave={() => setHoveredNode(null)} style={{ cursor: 'pointer' }}>
            <rect x="325" y="352" width="160" height="66" rx="14" ry="14" fill="#e8f7f0" stroke="#b2e2cd" strokeWidth="1.4" />
            <text x="405" y="380" textAnchor="middle" fill="#065f46" fontSize="15.5" fontWeight="700">여름 / 무더위</text>
            <text x="405" y="402" textAnchor="middle" fill="#047857" fontSize="13" fontWeight="500">적합 시즌</text>
          </g>

          {/* Card 5: 드레스 셔츠 / 착용 상황 / TPO (소프트 피치) */}
          <g onMouseEnter={() => setHoveredNode('c5')} onMouseLeave={() => setHoveredNode(null)} style={{ cursor: 'pointer' }}>
            <rect x="525" y="242" width="180" height="62" rx="14" ry="14" fill="#fbf0ee" stroke="#e8c2bd" strokeWidth="1.4" />
            <text x="615" y="269" textAnchor="middle" fill="#881337" fontSize="14.5" fontWeight="600">드레스 셔츠</text>
            <text x="615" y="291" textAnchor="middle" fill="#9f1239" fontSize="12.5" fontWeight="500">착용 상황 / TPO</text>
          </g>

          {/* Card 6: 오피스, 출근룩 / 포멀 (소프트 그레이) */}
          <g onMouseEnter={() => setHoveredNode('c6')} onMouseLeave={() => setHoveredNode(null)} style={{ cursor: 'pointer' }}>
            <rect x="525" y="318" width="180" height="52" rx="14" ry="14" fill="#f3f3f2" stroke="#dcdbd8" strokeWidth="1.4" />
            <text x="615" y="342" textAnchor="middle" fill="#44403c" fontSize="13.5" fontWeight="500">오피스, 출근룩</text>
            <text x="615" y="359" textAnchor="middle" fill="#78716c" fontSize="11.5" fontWeight="400">포멀</text>
          </g>
        </svg>
      )}

      {/* ========================================================
          ex2: 상품 호환성 클러스터 (절도 있는 직선 + 파스텔 톤)
          ======================================================== */}
      {mode === 'ex2' && (
        <svg
          viewBox="0 0 740 380"
          style={{
            width: '100%',
            maxWidth: '740px',
            height: 'auto',
            display: 'block',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif'
          }}
        >
          {/* Cluster 1: Coffee */}
          <rect x="20" y="20" width="700" height="155" rx="18" ry="18" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.2" strokeDasharray="5 5" />
          <text x="40" y="46" fill="#0369a1" fontSize="13" fontWeight="700">☕ 커피머신 & 캡슐 호환성 클러스터</text>

          {/* Straight Connectors Cluster 1 */}
          <line x1="210" y1="105" x2="275" y2="105" stroke="#0284c7" strokeWidth="1.6" markerEnd="url(#arrow-blue)" />
          <text x="242" y="93" textAnchor="middle" fill="#64748b" fontSize="11.5" fontWeight="500">사용 규격</text>

          <line x1="455" y1="105" x2="520" y2="105" stroke="#0284c7" strokeWidth="1.6" markerEnd="url(#arrow-blue)" />
          <text x="488" y="93" textAnchor="middle" fill="#64748b" fontSize="11.5" fontWeight="500">규격 매칭</text>

          {/* Dotted Recommendation Arrow */}
          <path d="M 125 135 L 125 155 L 610 155 L 610 135" fill="none" stroke="#e11d48" strokeWidth="1.6" strokeDasharray="4 4" markerEnd="url(#arrow-pink)" />
          <text x="365" y="150" textAnchor="middle" fill="#e11d48" fontSize="11.5" fontWeight="600">✨ 상호 호환 추천</text>

          {/* Cards Cluster 1 */}
          <rect x="40" y="75" width="170" height="60" rx="14" ry="14" fill="#f0f9ff" stroke="#bae6fd" strokeWidth="1.4" />
          <text x="125" y="103" textAnchor="middle" fill="#0369a1" fontSize="14" fontWeight="600">네스프레소 에센사</text>
          <text x="125" y="122" textAnchor="middle" fill="#0284c7" fontSize="12" fontWeight="400">캡슐 커피머신</text>

          <rect x="280" y="75" width="170" height="60" rx="14" ry="14" fill="#e8f7f0" stroke="#b2e2cd" strokeWidth="1.4" />
          <text x="365" y="103" textAnchor="middle" fill="#065f46" fontSize="14" fontWeight="700">오리지널 캡슐 규격</text>
          <text x="365" y="122" textAnchor="middle" fill="#047857" fontSize="12" fontWeight="500">37mm 표준 규격</text>

          <rect x="525" y="75" width="170" height="60" rx="14" ry="14" fill="#fbf3e6" stroke="#ead2b5" strokeWidth="1.4" />
          <text x="610" y="103" textAnchor="middle" fill="#78350f" fontSize="14" fontWeight="600">스타벅스 디카페인</text>
          <text x="610" y="122" textAnchor="middle" fill="#92400e" fontSize="12" fontWeight="400">임산부/야간 추천</text>

          {/* Cluster 2: Digital IT */}
          <rect x="20" y="200" width="700" height="155" rx="18" ry="18" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.2" strokeDasharray="5 5" />
          <text x="40" y="226" fill="#6b21a8" fontSize="13" fontWeight="700">💻 노트북 & 고속충전기 번들 클러스터</text>

          <line x1="210" y1="285" x2="275" y2="285" stroke="#9333ea" strokeWidth="1.6" markerEnd="url(#arrow-purple)" />
          <text x="242" y="273" textAnchor="middle" fill="#64748b" fontSize="11.5" fontWeight="500">요구 전력</text>

          <line x1="455" y1="285" x2="520" y2="285" stroke="#9333ea" strokeWidth="1.6" markerEnd="url(#arrow-purple)" />
          <text x="488" y="273" textAnchor="middle" fill="#64748b" fontSize="11.5" fontWeight="500">출력 지원</text>

          <path d="M 125 315 L 125 335 L 610 335 L 610 315" fill="none" stroke="#e11d48" strokeWidth="1.6" strokeDasharray="4 4" markerEnd="url(#arrow-pink)" />
          <text x="365" y="330" textAnchor="middle" fill="#e11d48" fontSize="11.5" fontWeight="600">⚡ 완벽 호환 번들</text>

          <rect x="40" y="255" width="170" height="60" rx="14" ry="14" fill="#faf5ff" stroke="#e9d5ff" strokeWidth="1.4" />
          <text x="125" y="283" textAnchor="middle" fill="#6b21a8" fontSize="14" fontWeight="600">맥북 프로 16인치</text>
          <text x="125" y="302" textAnchor="middle" fill="#7e22ce" fontSize="12" fontWeight="400">M3 Pro/Max</text>

          <rect x="280" y="255" width="170" height="60" rx="14" ry="14" fill="#e8f7f0" stroke="#b2e2cd" strokeWidth="1.4" />
          <text x="365" y="283" textAnchor="middle" fill="#065f46" fontSize="14" fontWeight="700">USB-PD 100W+ 규격</text>
          <text x="365" y="302" textAnchor="middle" fill="#047857" fontSize="12" fontWeight="500">초고속 전력 표준</text>

          <rect x="525" y="255" width="170" height="60" rx="14" ry="14" fill="#faf5ff" stroke="#e9d5ff" strokeWidth="1.4" />
          <text x="610" y="283" textAnchor="middle" fill="#6b21a8" fontSize="14" fontWeight="600">앤커 140W GaN</text>
          <text x="610" y="302" textAnchor="middle" fill="#7e22ce" fontSize="12" fontWeight="400">초고속 충전기</text>
        </svg>
      )}
    </div>
  );
}
