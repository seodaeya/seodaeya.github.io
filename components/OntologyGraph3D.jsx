import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// Comprehensive Nodes covering all topics from the blog post
const ALL_NODES = [
  // --- Cluster 1: Fashion & Semantic Search (소재/의류/시맨틱 추론) ---
  { id: 'f_prod', label: '린넨 드레스 셔츠', category: 'fashion', type: 'Product', color: '#38bdf8', size: 14, desc: '고급 프렌치 린넨 100% 남성 드레스 셔츠', x: -220, y: 120, z: 80 },
  { id: 'f_mat', label: '마 (Linen)', category: 'fashion', type: 'Material', color: '#60a5fa', size: 11, desc: '천연 식물성 섬유 원단', x: -300, y: 180, z: 40 },
  { id: 'f_trait', label: '통기성 우수 / 속건성', category: 'fashion', type: 'Attribute', color: '#f59e0b', size: 10, desc: '공기 순환 및 땀 흡수 배출 우수', x: -260, y: 260, z: 20 },
  { id: 'f_season', label: '여름철 무더위', category: 'fashion', type: 'Season', color: '#ef4444', size: 10, desc: '6~8월 고온다습 기후 조건', x: -180, y: 280, z: 60 },
  { id: 'f_tpo', label: '오피스 / 출근룩 (TPO)', category: 'fashion', type: 'Occasion', color: '#ec4899', size: 11, desc: '단정하고 쾌적한 비즈니스 캐주얼', x: -140, y: 180, z: 120 },
  { id: 'f_search', label: '🔍 "여름 시원한 출근 셔츠"', category: 'fashion', type: 'Query', color: '#22d3ee', size: 12, desc: '고객의 모호한 자연어 검색 의도', x: -100, y: 240, z: 100 },

  // --- Cluster 2: Food & Capsule Compatibility (커피머신/캡슐 호환성) ---
  { id: 'c_machine', label: '네스프레소 에센사 미니', category: 'food', type: 'Product', color: '#38bdf8', size: 14, desc: '컴팩트 캡슐 전용 커피머신', x: -180, y: -120, z: -80 },
  { id: 'c_capsule', label: '스타벅스 디카페인 에스프레소', category: 'food', type: 'Product', color: '#38bdf8', size: 13, desc: '스타벅스 공식 블렌드 캡슐', x: -60, y: -200, z: -120 },
  { id: 'c_spec', label: '오리지널 캡슐 규격 (37mm)', category: 'food', type: 'Spec', color: '#10b981', size: 13, desc: '표준 돔형 캡슐 물리 규격', x: -140, y: -200, z: -60 },
  { id: 'c_trait', label: '디카페인 / 카페인 0%', category: 'food', type: 'Attribute', color: '#f59e0b', size: 10, desc: '천연 스위스 워터 공정 카페인 제거', x: 20, y: -260, z: -140 },
  { id: 'c_target', label: '임산부 / 수유부 / 야간 고객', category: 'food', type: 'Target', color: '#ec4899', size: 11, desc: '카페인 섭취 제한 타깃 소비자', x: 100, y: -280, z: -100 },
  { id: 'c_occasion', label: '홈카페 모닝 루틴', category: 'food', type: 'Occasion', color: '#06b6d4', size: 10, desc: '아침 기상 후 간편 에스프레소 추출', x: -260, y: -140, z: -120 },

  // --- Cluster 3: Digital IT & Charging Specs (디지털/충전 스펙 번들) ---
  { id: 'it_laptop', label: '맥북 프로 16인치 M3', category: 'digital', type: 'Product', color: '#a855f7', size: 15, desc: '애플 최고사양 전문가용 랩탑', x: 180, y: 100, z: -40 },
  { id: 'it_charger', label: '앤커 140W GaN 고속충전기', category: 'digital', type: 'Product', color: '#a855f7', size: 14, desc: '초고속 GaN III 다중 포트 충전기', x: 280, y: -40, z: 20 },
  { id: 'it_pd_spec', label: 'USB-PD 100W+ 초고속 규격', category: 'digital', type: 'Spec', color: '#10b981', size: 13, desc: 'USB Power Delivery 3.1 고출력 규격', x: 220, y: 20, z: -20 },
  { id: 'it_port_spec', label: 'Type-C 인터페이스', category: 'digital', type: 'Spec', color: '#10b981', size: 10, desc: '범용 양방향 C-Type 단자', x: 340, y: -20, z: 60 },
  { id: 'it_user', label: '전문가 / 재택 오피스 워커', category: 'digital', type: 'Target', color: '#ec4899', size: 11, desc: '고출력 데스크탑 대체 작업 환경', x: 120, y: 160, z: -100 },

  // --- Cluster 4: Core Ontology & AI Agent (온톨로지 코어 & AI 추천) ---
  { id: 'core_kg', label: '이커머스 지식 그래프 (Ontology)', category: 'core', type: 'Core', color: '#e2e8f0', size: 18, desc: '개념-속성-관계를 잇는 지식 베이스', x: 0, y: 0, z: 0 },
  { id: 'core_rag', label: 'GraphRAG / 쇼핑 AI 에이전트', category: 'core', type: 'AI', color: '#38bdf8', size: 15, desc: '환각 없는 100% 검증 추천 에이전트', x: 20, y: 80, z: 120 }
];

const ALL_LINKS = [
  // Fashion links
  { source: 'f_prod', target: 'f_mat', label: 'MADE_OF' },
  { source: 'f_mat', target: 'f_trait', label: 'HAS_TRAIT' },
  { source: 'f_trait', target: 'f_season', label: 'SUITABLE_SEASON' },
  { source: 'f_prod', target: 'f_tpo', label: 'TPO_OCCASION' },
  { source: 'f_search', target: 'f_season', label: 'SEMANTIC_INTENT' },
  { source: 'f_search', target: 'f_prod', label: '💡 의미 추론 추천', highlight: true },

  // Food / Coffee links
  { source: 'c_machine', target: 'c_spec', label: 'REQUIRES_SPEC' },
  { source: 'c_capsule', target: 'c_spec', label: 'MATCHES_SPEC' },
  { source: 'c_capsule', target: 'c_trait', label: 'HAS_INGREDIENT' },
  { source: 'c_trait', target: 'c_target', label: 'TARGET_AUDIENCE' },
  { source: 'c_machine', target: 'c_occasion', label: 'OCCASION' },
  { source: 'c_machine', target: 'c_capsule', label: '✨ 상호 호환 추천', highlight: true },

  // Digital IT links
  { source: 'it_laptop', target: 'it_pd_spec', label: 'POWER_REQ' },
  { source: 'it_charger', target: 'it_pd_spec', label: 'POWER_OUTPUT' },
  { source: 'it_charger', target: 'it_port_spec', label: 'PORT_TYPE' },
  { source: 'it_laptop', target: 'it_user', label: 'TARGET_USER' },
  { source: 'it_laptop', target: 'it_charger', label: '⚡ 완벽 호환 번들', highlight: true },

  // Core Ontology links
  { source: 'core_kg', target: 'f_prod', label: 'ENTITY' },
  { source: 'core_kg', target: 'c_machine', label: 'ENTITY' },
  { source: 'core_kg', target: 'it_laptop', label: 'ENTITY' },
  { source: 'core_kg', target: 'core_rag', label: 'POWERED_BY' },
  { source: 'core_rag', target: 'f_search', label: 'RESOLVES' }
];

export default function OntologyGraph3D() {
  const mountRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = 520;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#080b14');
    scene.fog = new THREE.FogExp2('#080b14', 0.0018);

    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 2000);
    camera.position.set(0, 50, 650);

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x38bdf8, 2.5, 1200);
    pointLight1.position.set(200, 300, 300);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xa855f7, 2, 1000);
    pointLight2.position.set(-300, -200, -200);
    scene.add(pointLight2);

    // 4. Background Starfield / Particle Cloud
    const particleCount = 400;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 1600;
      particlePositions[i + 1] = (Math.random() - 0.5) * 1200;
      particlePositions[i + 2] = (Math.random() - 0.5) * 1200;
    }
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 2.5,
      transparent: true,
      opacity: 0.35,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // 5. Build 3D Spheres & Sprite Labels
    const nodeObjects = [];
    const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);

    const createTextSprite = (text, type, colorHex) => {
      const canvas = document.createElement('canvas');
      canvas.width = 380;
      canvas.height = 110;
      const ctx = canvas.getContext('2d');

      // Pill Background for Type
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = colorHex;
      ctx.lineWidth = 2;
      ctx.roundRect(10, 8, 360, 94, 16);
      ctx.fill();
      ctx.stroke();

      // Entity / Type Header badge
      ctx.fillStyle = colorHex;
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`• ${type} •`, 190, 40);

      // Korean Label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(text, 190, 78);

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(65, 19, 1);
      return sprite;
    };

    ALL_NODES.forEach((node) => {
      const material = new THREE.MeshPhongMaterial({
        color: new THREE.Color(node.color),
        emissive: new THREE.Color(node.color),
        emissiveIntensity: node.type === 'Core' ? 0.6 : 0.3,
        shininess: 100,
        specular: 0xffffff,
      });

      const mesh = new THREE.Mesh(sphereGeometry, material);
      mesh.scale.set(node.size, node.size, node.size);
      mesh.position.set(node.x, node.y, node.z);
      mesh.userData = node;

      // Glow halo ring
      const ringGeo = new THREE.RingGeometry(node.size * 1.15, node.size * 1.35, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(node.color),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.4,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.lookAt(camera.position);
      mesh.add(ring);

      // Text Sprite Label
      const sprite = createTextSprite(node.label, node.type, node.color);
      sprite.position.set(0, node.size + 16, 0);
      mesh.add(sprite);

      scene.add(mesh);
      nodeObjects.push(mesh);
    });

    // 6. Build 3D Links / Relationship Lines
    const nodeMap = new Map(nodeObjects.map((obj) => [obj.userData.id, obj]));
    const linkLines = [];

    ALL_LINKS.forEach((link) => {
      const src = nodeMap.get(link.source);
      const tgt = nodeMap.get(link.target);
      if (!src || !tgt) return;

      const points = [src.position, tgt.position];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);

      const lineColor = link.highlight ? 0xec4899 : 0x64748b;
      const lineMat = new THREE.LineBasicMaterial({
        color: lineColor,
        transparent: true,
        opacity: link.highlight ? 0.9 : 0.4,
        linewidth: link.highlight ? 3 : 1,
      });

      const line = new THREE.Line(lineGeo, lineMat);
      line.userData = link;
      scene.add(line);
      linkLines.push({ line, src, tgt, data: link });
    });

    // 7. Interactive Mouse / Touch Orbit Controls
    let isMouseDown = false;
    let prevMousePos = { x: 0, y: 0 };
    let spherical = { radius: 650, theta: 0, phi: Math.PI / 2.2 };

    const updateCameraPos = () => {
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
      camera.position.x = spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
      camera.position.y = spherical.radius * Math.cos(spherical.phi);
      camera.position.z = spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
      camera.lookAt(0, 0, 0);
    };
    updateCameraPos();

    const onMouseDown = (e) => {
      isMouseDown = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      if (!isMouseDown) return;
      const deltaX = e.clientX - prevMousePos.x;
      const deltaY = e.clientY - prevMousePos.y;

      spherical.theta -= deltaX * 0.006;
      spherical.phi -= deltaY * 0.006;
      updateCameraPos();

      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isMouseDown = false;
    };

    const onWheel = (e) => {
      e.preventDefault();
      spherical.radius = Math.max(300, Math.min(1100, spherical.radius + e.deltaY * 0.6));
      updateCameraPos();
    };

    // Raycaster for Node Selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodeObjects);

      if (intersects.length > 0) {
        const clicked = intersects[0].object.userData;
        setSelectedNode(clicked);
      } else {
        setSelectedNode(null);
      }
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domEl.addEventListener('wheel', onWheel, { passive: false });
    domEl.addEventListener('click', onClick);

    // 8. Animation Loop
    let animationId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Gentle auto-rotation
      if (autoRotate && !isMouseDown) {
        spherical.theta += 0.003;
        updateCameraPos();
      }

      // Gentle floating physics for nodes
      nodeObjects.forEach((mesh, idx) => {
        mesh.position.y += Math.sin(elapsedTime * 1.5 + idx) * 0.15;
      });

      // Update line connections
      linkLines.forEach(({ line, src, tgt }) => {
        const posAttr = line.geometry.attributes.position;
        posAttr.setXYZ(0, src.position.x, src.position.y, src.position.z);
        posAttr.setXYZ(1, tgt.position.x, tgt.position.y, tgt.position.z);
        posAttr.needsUpdate = true;
      });

      // Rotate particle stars slowly
      particles.rotation.y = elapsedTime * 0.02;

      renderer.render(scene, camera);
    };

    animate();

    const onResize = () => {
      const w = container.clientWidth;
      camera.aspect = w / height;
      camera.updateProjectionMatrix();
      renderer.setSize(w, height);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animationId);
      domEl.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domEl.removeEventListener('wheel', onWheel);
      domEl.removeEventListener('click', onClick);
      window.removeEventListener('resize', onResize);
      if (container.contains(domEl)) {
        container.removeChild(domEl);
      }
      renderer.dispose();
    };
  }, [autoRotate]);

  return (
    <div style={{
      position: 'relative',
      margin: '32px 0',
      borderRadius: '20px',
      overflow: 'hidden',
      border: '1px solid rgba(56, 189, 248, 0.3)',
      boxShadow: '0 16px 48px rgba(0, 0, 0, 0.6), inset 0 0 80px rgba(56, 189, 248, 0.08)',
      background: '#080b14'
    }}>
      {/* 3D Visualizer Top Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.3rem' }}>🌐</span>
          <div>
            <strong style={{ color: '#38bdf8', fontSize: '0.95rem', display: 'block' }}>
              3D WebGL 이커머스 온톨로지 지식 그래프 (Interactive 3D Universe)
            </strong>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              마우스 드래그로 360° 3D 궤도 회전 | 휠로 줌인/아웃 | 노드 구체 클릭 시 상세 조회
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              background: autoRotate ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.06)',
              color: autoRotate ? '#38bdf8' : '#94a3b8',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
          >
            {autoRotate ? '🔄 자동 3D 회전 중' : '⏸️ 회전 정지'}
          </button>
          <button
            onClick={() => setSelectedNode(null)}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              background: 'rgba(255, 255, 255, 0.06)',
              color: '#cbd5e1',
              cursor: 'pointer',
              fontSize: '0.75rem'
            }}
          >
            선택 해제
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas Mount */}
      <div ref={mountRef} style={{ width: '100%', height: '520px', cursor: 'grab' }} />

      {/* Interactive Node Inspection Popup Card */}
      {selectedNode && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          right: '20px',
          padding: '16px 20px',
          borderRadius: '14px',
          background: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(16px)',
          border: `1.5px solid ${selectedNode.color}`,
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <strong style={{ color: selectedNode.color, fontSize: '1.05rem' }}>{selectedNode.label}</strong>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '6px',
                background: selectedNode.color + '25',
                color: selectedNode.color,
                border: `1px solid ${selectedNode.color}55`
              }}>
                {selectedNode.type}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                도메인: {selectedNode.category.toUpperCase()}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#e2e8f0' }}>{selectedNode.desc}</p>
          </div>
          <button
            onClick={() => setSelectedNode(null)}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              color: '#cbd5e1',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.9rem'
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
