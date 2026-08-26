import React, { useEffect, useRef, useState, useId } from 'react';

let isMermaidInitialized = false;

function ensureMermaidInit() {
  if (typeof window === 'undefined') return;
  if (!isMermaidInitialized) {
    import('mermaid').then((mermaidModule) => {
      const mermaid = mermaidModule.default || mermaidModule;
      mermaid.initialize({
        startOnLoad: false,
        theme: 'base',
        themeVariables: {
          background: '#ffffff',
          primaryColor: '#fef3c7',
          primaryTextColor: '#1e293b',
          primaryBorderColor: '#f59e0b',
          lineColor: '#64748b',
          secondaryColor: '#fce7e7',
          tertiaryColor: '#d1fae5',
          edgeLabelBackground: '#ffffff',
          clusterBkg: '#f8fafc',
          clusterBorder: '#cbd5e1',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontSize: '13px'
        },
        flowchart: {
          curve: 'basis',
          padding: 16,
          nodeSpacing: 40,
          rankSpacing: 40,
          htmlLabels: true
        },
        securityLevel: 'loose'
      });
      isMermaidInitialized = true;
    });
  }
}

export default function MermaidRenderer({ chart, className = '' }) {
  const containerRef = useRef(null);
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9]/g, '');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function renderChart() {
      if (typeof window === 'undefined' || !chart) return;
      setIsLoading(true);

      try {
        const mermaidModule = await import('mermaid');
        const mermaid = mermaidModule.default || mermaidModule;

        ensureMermaidInit();

        const containerId = `mermaid-container-${uid}`;
        const { svg } = await mermaid.render(containerId, chart);

        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
          setError(null);
          setIsLoading(false);

          // Custom polish on generated SVG
          const svgEl = containerRef.current.querySelector('svg');
          if (svgEl) {
            svgEl.style.maxWidth = '100%';
            svgEl.style.height = 'auto';
            svgEl.style.display = 'block';
            svgEl.style.margin = '0 auto';
          }
        }
      } catch (err) {
        console.error('Mermaid render failed:', err);
        if (!cancelled) {
          setError('그래프를 렌더링하지 못했습니다.');
          setIsLoading(false);
        }
      }
    }

    renderChart();

    return () => {
      cancelled = true;
    };
  }, [chart, uid]);

  if (error) {
    return <div style={{ color: '#ef4444', fontSize: '0.875rem', padding: '12px' }}>{error}</div>;
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: '100%',
        minHeight: isLoading ? '180px' : 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'opacity 0.2s',
        opacity: isLoading ? 0.6 : 1,
        background: '#ffffff',
        borderRadius: '16px',
        padding: '24px 16px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.06)',
        border: '1px solid #e2e8f0'
      }}
    />
  );
}
