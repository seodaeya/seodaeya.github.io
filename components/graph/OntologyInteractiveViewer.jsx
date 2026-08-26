import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import PastelFlowGraph from './PastelFlowGraph';

const OntologyGraph3D = dynamic(() => import('../OntologyGraph3D'), { ssr: false });

export default function OntologyInteractiveViewer() {
  const [activeTab, setActiveTab] = useState('ex1');

  const tabStyle = (tabKey) => ({
    padding: '8px 16px',
    borderRadius: '10px',
    border: '1px solid',
    borderColor: activeTab === tabKey ? '#0284c7' : '#e2e8f0',
    background: activeTab === tabKey ? '#e0f2fe' : '#ffffff',
    color: activeTab === tabKey ? '#0369a1' : '#64748b',
    fontWeight: activeTab === tabKey ? 700 : 500,
    fontSize: '0.85rem',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    boxShadow: activeTab === tabKey ? '0 2px 6px rgba(2, 132, 199, 0.12)' : 'none'
  });

  return (
    <div style={{
      margin: '36px 0',
      background: 'transparent'
    }}>
      {/* Top Switcher Tabs */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
        gap: '10px'
      }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
          📊 온톨로지 시각화 스튜디오 (Interactive Diagram)
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setActiveTab('ex1')} style={tabStyle('ex1')}>
            ⚡ ex1: 추론 체인 (선형 플로우)
          </button>
          <button onClick={() => setActiveTab('ex2')} style={tabStyle('ex2')}>
            🧩 ex2: 호환성 그래프 (클러스터)
          </button>
          <button onClick={() => setActiveTab('3d')} style={tabStyle('3d')}>
            🌌 3D 지식 우주 (WebGL)
          </button>
        </div>
      </div>

      {/* Main Diagram Area */}
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        border: '1px solid #e2e8f0',
        padding: '24px 20px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)'
      }}>
        {activeTab === 'ex1' && (
          <div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '16px' }}>
              <strong>📌 단일 경로 선형 추론</strong>: 린넨 셔츠 ➔ 마/Linen ➔ 통기성 우수 ➔ 여름 무더위로 이어지는 절도 있는 직선 흐름과 드레스 셔츠(TPO) 정보입니다.
            </div>
            <PastelFlowGraph mode="ex1" />
          </div>
        )}

        {activeTab === 'ex2' && (
          <div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '16px' }}>
              <strong>📌 상품 호환성 클러스터</strong>: 커피머신과 노트북 번들의 규격 매칭(실선) 및 상호 추천(점선) 관계망입니다.
            </div>
            <PastelFlowGraph mode="ex2" />
          </div>
        )}

        {activeTab === '3d' && (
          <div>
            <OntologyGraph3D />
          </div>
        )}
      </div>
    </div>
  );
}
