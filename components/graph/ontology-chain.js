/**
 * ex1: 단일 경로 선형 추론 체인 (속성 -> 속성 -> 결론)
 * 밝고 부드러운 파스텔 톤 카드 스타일
 */

export const exampleInferenceChain = {
  rootProduct: { id: 'P_LINEN', label: '린넨 셔츠' },
  material: { id: 'M_LINEN', label: '마 / Linen', relation: '소재' },
  trait: { id: 'T_BREATH', label: '통기성 우수<br/><small style="color:#78350f">땀 흡수</small>', relation: '물리적 특성' },
  season: { id: 'S_SUMMER', label: '여름 / 무더위<br/><small style="color:#065f46">적합 시즌</small>', relation: '적합 계절' },
  tpo: { id: 'O_DRESS', label: '드레스 셔츠<br/><small style="color:#881337">착용 상황 / TPO</small>' },
  context: { id: 'C_CONTEXT', label: '오피스, 출근룩<br/><small style="color:#475569">포멀</small>' }
};

export function buildInferenceChainMermaid(data = exampleInferenceChain) {
  return `graph TD
    classDef pinkCard fill:#fce7e7,stroke:#fca5a5,stroke-width:1.5px,color:#881337,rx:12px,ry:12px;
    classDef amberCard fill:#fef3c7,stroke:#fcd34d,stroke-width:1.5px,color:#78350f,rx:12px,ry:12px;
    classDef mintCard fill:#d1fae5,stroke:#6ee7b7,stroke-width:1.5px,color:#065f46,rx:12px,ry:12px;
    classDef grayCard fill:#f1f5f9,stroke:#cbd5e1,stroke-width:1.5px,color:#334155,rx:12px,ry:12px;

    ${data.rootProduct.id}["${data.rootProduct.label}"]:::pinkCard
    ${data.material.id}["${data.material.label}"]:::amberCard
    ${data.trait.id}["${data.trait.label}"]:::amberCard
    ${data.season.id}["${data.season.label}"]:::mintCard
    ${data.tpo.id}["${data.tpo.label}"]:::pinkCard
    ${data.context.id}["${data.context.label}"]:::grayCard

    ${data.rootProduct.id} -->|${data.material.relation}| ${data.material.id}
    ${data.material.id} -->|${data.trait.relation}| ${data.trait.id}
    ${data.trait.id} -->|${data.season.relation}| ${data.season.id}
    ${data.season.id} --> ${data.tpo.id}
    ${data.tpo.id} --- ${data.context.id}
`;
}
