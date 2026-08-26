/**
 * ex2: 다대다 상품 호환성 지식 그래프 (2개 클러스터)
 * 밝은 파스텔 톤 + 깔끔한 실선/점선 연결
 */

export const exampleCompatibilityGraph = {
  coffeeCluster: {
    machine: { id: 'M_NES', label: '네스프레소 에센사 미니<br/><small style="color:#0369a1">캡슐 커피머신</small>' },
    spec: { id: 'S_ORIG', label: '오리지널 캡슐 규격<br/><small style="color:#065f46">37mm 표준</small>' },
    capsule: { id: 'C_STAR', label: '스타벅스 디카페인<br/><small style="color:#0369a1">에스프레소 캡슐</small>' },
    trait: { id: 'T_DECAF', label: '디카페인 / 카페인 0%<br/><small style="color:#78350f">천연 공정</small>' },
    target: { id: 'U_PREG', label: '임산부 / 야간 고객<br/><small style="color:#881337">적합 타깃</small>' }
  },
  digitalCluster: {
    laptop: { id: 'L_MAC', label: '맥북 프로 16인치<br/><small style="color:#6b21a8">M3 Pro/Max</small>' },
    pdSpec: { id: 'S_PD', label: 'USB-PD 100W+ 규격<br/><small style="color:#065f46">고출력 전력 규격</small>' },
    charger: { id: 'C_ANK', label: '앤커 140W GaN<br/><small style="color:#6b21a8">초고속 충전기</small>' },
    portSpec: { id: 'S_PORT', label: 'Type-C 인터페이스<br/><small style="color:#065f46">양방향 포트</small>' },
    user: { id: 'U_PRO', label: '개발자 / 전문 워커<br/><small style="color:#881337">타깃 사용자</small>' }
  }
};

export function buildCompatibilityMermaid(data = exampleCompatibilityGraph) {
  const { coffeeCluster: c, digitalCluster: d } = data;

  return `graph TD
    classDef blueCard fill:#e0f2fe,stroke:#7dd3fc,stroke-width:1.5px,color:#0369a1,rx:12px,ry:12px;
    classDef greenCard fill:#d1fae5,stroke:#6ee7b7,stroke-width:1.5px,color:#065f46,rx:12px,ry:12px;
    classDef purpleCard fill:#f3e8ff,stroke:#d8b4fe,stroke-width:1.5px,color:#6b21a8,rx:12px,ry:12px;
    classDef pinkCard fill:#fce7e7,stroke:#fca5a5,stroke-width:1.5px,color:#881337,rx:12px,ry:12px;
    classDef amberCard fill:#fef3c7,stroke:#fcd34d,stroke-width:1.5px,color:#78350f,rx:12px,ry:12px;

    subgraph Coffee_Cluster ["☕ 커피머신 & 캡슐 호환성 클러스터"]
      ${c.machine.id}["${c.machine.label}"]:::blueCard
      ${c.spec.id}["${c.spec.label}"]:::greenCard
      ${c.capsule.id}["${c.capsule.label}"]:::blueCard
      ${c.trait.id}["${c.trait.label}"]:::amberCard
      ${c.target.id}["${c.target.label}"]:::pinkCard

      ${c.machine.id} -->|사용 규격| ${c.spec.id}
      ${c.capsule.id} -->|캡슐 규격| ${c.spec.id}
      ${c.capsule.id} -->|성분 특성| ${c.trait.id}
      ${c.trait.id} -->|적합 타깃| ${c.target.id}
      ${c.machine.id} -.->|✨ 상호 호환 추천| ${c.capsule.id}
    end

    subgraph Digital_Cluster ["💻 노트북 & 충전기 번들 클러스터"]
      ${d.laptop.id}["${d.laptop.label}"]:::purpleCard
      ${d.pdSpec.id}["${d.pdSpec.label}"]:::greenCard
      ${d.charger.id}["${d.charger.label}"]:::purpleCard
      ${d.portSpec.id}["${d.portSpec.label}"]:::greenCard
      ${d.user.id}["${d.user.label}"]:::pinkCard

      ${d.laptop.id} -->|충전 요구 규격| ${d.pdSpec.id}
      ${d.charger.id} -->|출력 지원 스펙| ${d.pdSpec.id}
      ${d.charger.id} -->|포트 물리 규격| ${d.portSpec.id}
      ${d.laptop.id} -->|타깃 사용자| ${d.user.id}
      ${d.laptop.id} -.->|⚡ 완벽 호환 번들| ${d.charger.id}
    end
`;
}
