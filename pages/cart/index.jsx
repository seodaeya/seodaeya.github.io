import { useState, useEffect } from 'react';
import Head from 'next/head';
import SEO from '@/components/SEO';
import styles from '@/styles/cart.module.css';

const COUPANG_PARTNERS_URL = "https://link.coupang.com/a/gpEnV0YNfE";
const STORAGE_KEY = "cart_in_all_items";

const CATEGORIES = ["전체", "전자기기/IT", "가전/DIY", "패션/뷰티", "생필품/식품", "기타"];

const SAMPLE_ITEMS = [
  {
    id: "sample-1",
    title: "더클래스 하이브리드 코팅 워터 자동차 물왁스 세트",
    price: 24500,
    description: "싼타페 세차 및 도장면 광택 유지용 코팅제",
    linkUrl: "https://link.coupang.com/a/gpEnV0YNfE",
    imageUrl: "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=500&q=80",
    category: "가전/DIY",
    isPurchased: false,
    createdAt: new Date().toISOString()
  },
  {
    id: "sample-2",
    title: "크레스티드 게코 전용 인섹트 파우더 슈퍼푸드 (무화과맛)",
    price: 18900,
    description: "반려 도마뱀 봄이 영양 간식 (기호성 최고)",
    linkUrl: "https://link.coupang.com/a/gpEnV0YNfE",
    imageUrl: "https://images.unsplash.com/photo-1574781330855-d0db8cc6a79c?w=500&q=80",
    category: "생필품/식품",
    isPurchased: false,
    createdAt: new Date().toISOString()
  },
  {
    id: "sample-3",
    title: "알루미늄 360도 회전식 접이식 노트북 거치대",
    price: 36000,
    description: "맥북 및 태블릿 개발 작업 시 목 피로도 감소용",
    linkUrl: "https://link.coupang.com/a/gpEnV0YNfE",
    imageUrl: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&q=80",
    category: "전자기기/IT",
    isPurchased: true,
    createdAt: new Date().toISOString()
  }
];

export default function CartInAll() {
  const [items, setItems] = useState([]);
  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('전자기기/IT');
  const [imageInput, setImageInput] = useState('');
  const [activeFilter, setActiveFilter] = useState('전체');
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load cart items:", e);
    }
  }, []);

  // Save to localStorage
  const saveItems = (newItems) => {
    setItems(newItems);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
    } catch (e) {
      console.error("Failed to save cart items:", e);
    }
  };

  // URL auto-parser using free Microlink API
  const handleParseUrl = async () => {
    if (!urlInput.trim()) {
      alert("먼저 쇼핑몰 상품 URL 링크를 입력해 주세요!");
      return;
    }
    setIsLoading(true);

    try {
      const targetUrl = urlInput.trim();
      const res = await fetch(`https://api.microlink.io?url=${encodeURIComponent(targetUrl)}`);
      const data = await res.json();

      if (data.status === 'success' && data.data) {
        const d = data.data;
        if (d.title) setTitleInput(d.title);
        if (d.description) setDescInput(d.description);
        if (d.image && d.image.url) {
          setImageInput(d.image.url);
        } else if (d.logo && d.logo.url) {
          setImageInput(d.logo.url);
        }
      }
    } catch (e) {
      console.warn("Could not auto-parse URL metadata. Fallback to manual entry.", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Add Item to Cart
  const handleAddItem = (e) => {
    e.preventDefault();
    if (!titleInput.trim()) {
      alert("상품명을 입력해 주세요!");
      return;
    }

    const newItem = {
      id: Date.now().toString(),
      title: titleInput.trim(),
      price: parseInt(priceInput, 10) || 0,
      description: descInput.trim(),
      linkUrl: urlInput.trim() || '#',
      imageUrl: imageInput.trim() || '',
      category: categoryInput,
      isPurchased: false,
      createdAt: new Date().toISOString()
    };

    const updated = [newItem, ...items];
    saveItems(updated);

    // Reset inputs
    setUrlInput('');
    setTitleInput('');
    setPriceInput('');
    setDescInput('');
    setImageInput('');
  };

  // Load sample items
  const handleLoadSamples = () => {
    const combined = [...SAMPLE_ITEMS, ...items.filter(i => !i.id.startsWith('sample-'))];
    saveItems(combined);
    setIsGuideOpen(false);
  };

  // Toggle purchased state
  const togglePurchased = (id) => {
    const updated = items.map(item => 
      item.id === id ? { ...item, isPurchased: !item.isPurchased } : item
    );
    saveItems(updated);
  };

  // Delete item
  const handleDeleteItem = (id) => {
    if (confirm("이 상품을 장바구니에서 삭제하시겠습니까?")) {
      const updated = items.filter(item => item.id !== id);
      saveItems(updated);
    }
  };

  // Export JSON backup
  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(items, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `cart_in_all_backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON backup
  const handleImportJson = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (Array.isArray(imported)) {
          saveItems(imported);
          alert(`성공적으로 ${imported.length}개의 상품을 불러왔습니다!`);
        }
      } catch (err) {
        alert("올바르지 않은 JSON 백업 파일입니다.");
      }
    };
    reader.readAsText(file);
  };

  // Filtered items
  const filteredItems = items.filter(item => {
    if (activeFilter === '전체') return true;
    return item.category === activeFilter;
  });

  // Calculate budget
  const totalPlanned = items.filter(i => !i.isPurchased).reduce((acc, cur) => acc + (cur.price || 0), 0);
  const totalPurchased = items.filter(i => i.isPurchased).reduce((acc, cur) => acc + (cur.price || 0), 0);

  return (
    <>
      <SEO 
        title="Cart In All | 만능 장바구니 & 위시리스트"
        description="쿠팡, 네이버쇼핑, 알리 등 여러 쇼핑몰의 상품 링크를 한곳에 모아 관리하는 스마트 만능 장바구니 서비스입니다."
        url="https://seodaeya.github.io/cart/"
      />

      <div className={styles.cartContainer}>
        
        {/* Header */}
        <header className={styles.cartHeader}>
          <span className={styles.cartBadge}>ALL-IN-ONE WISHLIST</span>
          <h1 className={styles.cartTitle}>Cart In All (모아담는 장바구니)</h1>
          <p className={styles.cartSubtitle}>
            쿠팡, 네이버, 알리, 아마존 등 흩어져 있는 쇼핑몰 링크를 한곳에 모아<br />
            스마트하게 예산을 관리하고 위시리스트를 완성해 보세요.
          </p>
          
          {/* Guide & Sample Trigger Button */}
          <button 
            type="button" 
            className={styles.guideTriggerBtn}
            onClick={() => setIsGuideOpen(true)}
          >
            <span>💡</span> 사용법 및 예시 보기
          </button>
        </header>

        {/* Coupang Partners Support Banner */}
        <section className={styles.coupangBanner} aria-label="쿠팡 파트너스 후원 안내">
          <div className={styles.coupangInfo}>
            <h2 className={styles.coupangTitle}>
              <span>🛍️</span> 쿠팡에서 쇼핑하고 블로그 후원하기
            </h2>
            <p className={styles.coupangDesc}>
              쿠팡에서 필요한 물품을 구매하실 때 아래 전용 링크를 통해 접속하시면, 
              <strong> 추가 비용 없이</strong> 블로그의 지식 나눔과 기술 연구에 큰 도움이 됩니다!
            </p>
            <p className={styles.coupangLegal}>
              ※ 이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
            </p>
          </div>
          <a 
            href={COUPANG_PARTNERS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.coupangBtn}
          >
            <span>🚀</span> 쿠팡 바로가기 & 후원
          </a>
        </section>

        {/* Stats & Budget Summary */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>🛒 담긴 상품 총합</div>
            <div className={styles.statValue}>{items.length}개</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>📝 구매 예정 금액</div>
            <div className={styles.statValue}>{totalPlanned.toLocaleString()}원</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>✅ 구매 완료 금액</div>
            <div className={styles.statValue} style={{ color: '#4ade80' }}>{totalPurchased.toLocaleString()}원</div>
          </div>
        </div>

        {/* Redesigned Add Product Form */}
        <section className={styles.addFormCard}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>
              <span>✨</span> 새 상품 모아담기
            </h2>
            <button 
              type="button" 
              className={styles.guideTriggerBtn}
              onClick={() => setIsGuideOpen(true)}
              style={{ fontSize: '0.8rem', padding: '6px 14px' }}
            >
              사용 가이드
            </button>
          </div>

          <form onSubmit={handleAddItem} className={styles.formGrid}>
            
            {/* Row 1: URL Input with Auto-Parse Button */}
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>쇼핑몰 링크 (쿠팡, 네이버, 알리, 아마존 등)</label>
              <div className={styles.urlInputWrapper}>
                <input 
                  type="url"
                  placeholder="https://www.coupang.com/vp/products/..."
                  className={styles.inputField}
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                />
                <button 
                  type="button" 
                  className={styles.parseButton}
                  onClick={handleParseUrl}
                  disabled={isLoading}
                >
                  {isLoading ? '가져오는 중...' : '🔍 정보 가져오기'}
                </button>
              </div>
            </div>

            {/* Row 2: Product Name & Estimated Price */}
            <div className={styles.formRow}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>상품명 (필수) *</label>
                <input 
                  type="text" 
                  placeholder="예: 싼타페 하이브리드 와이퍼 블레이드"
                  className={styles.inputField}
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>예상 가격 (숫자만, 원)</label>
                <input 
                  type="number" 
                  placeholder="예: 25000"
                  className={styles.inputField}
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                />
              </div>
            </div>

            {/* Row 3: Category & Image URL */}
            <div className={styles.formRow}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>카테고리 분류</label>
                <select 
                  className={styles.selectField}
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                >
                  {CATEGORIES.filter(c => c !== '전체').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>이미지 썸네일 URL (선택)</label>
                <input 
                  type="url" 
                  placeholder="https://.../image.jpg (자동 입력됨)"
                  className={styles.inputField}
                  value={imageInput}
                  onChange={(e) => setImageInput(e.target.value)}
                />
              </div>
            </div>

            {/* Row 4: Memo & Submit Button */}
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>쇼핑 메모 & 용도</label>
              <input 
                type="text" 
                placeholder="예: 가전 정비용, 월급날 구매 예정, 최저가 알림 시 구매"
                className={styles.inputField}
                value={descInput}
                onChange={(e) => setDescInput(e.target.value)}
              />
            </div>

            <div style={{ marginTop: '8px', textAlign: 'right' }}>
              <button type="submit" className={styles.submitBtn}>
                ➕ 장바구니에 담기
              </button>
            </div>
          </form>
        </section>

        {/* Filter Tabs & Backup Tools */}
        <div className={styles.toolbar}>
          <div className={styles.filterTabs}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                className={`${styles.filterTab} ${activeFilter === cat ? styles.filterTabActive : ''}`}
                onClick={() => setActiveFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className={styles.backupActions}>
            <button type="button" className={styles.toolButton} onClick={handleExportJson} title="JSON 파일로 백업">
              💾 백업하기
            </button>
            <label className={styles.toolButton} style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }} title="JSON 백업 파일 복원">
              📂 불러오기
              <input type="file" accept=".json" onChange={handleImportJson} style={{ display: 'none' }} />
            </label>
          </div>
        </div>

        {/* Item List Grid */}
        {filteredItems.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🛒</div>
            <h3 className={styles.emptyTitle}>장바구니가 비어 있습니다</h3>
            <p className={styles.emptyDesc}>
              원하는 쇼핑몰 링크를 넣거나, 아래 예시 데이터를 담아서 테스트해 보세요!
            </p>
            <button 
              type="button" 
              className={styles.guideTriggerBtn}
              onClick={handleLoadSamples}
            >
              🚀 예시 데이터 3개 담아보기
            </button>
          </div>
        ) : (
          <div className={styles.itemsGrid}>
            {filteredItems.map(item => (
              <article 
                key={item.id} 
                className={`${styles.itemCard} ${item.isPurchased ? styles.itemCardPurchased : ''}`}
              >
                <div className={styles.imageWrapper}>
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} className={styles.itemImage} />
                  ) : (
                    <span className={styles.noImage}>📦</span>
                  )}
                  <span className={styles.categoryTag}>{item.category}</span>
                </div>

                <div className={styles.itemBody}>
                  <h3 className={styles.itemTitle} title={item.title}>
                    {item.title}
                  </h3>
                  <div className={styles.itemPrice}>
                    {item.price ? `${item.price.toLocaleString()}원` : '가격 미지정'}
                  </div>
                  {item.description && (
                    <p className={styles.itemDesc}>
                      {item.description}
                    </p>
                  )}

                  <div className={styles.itemFooter}>
                    <button 
                      type="button" 
                      className={`${styles.statusBtn} ${item.isPurchased ? styles.statusBtnPurchased : ''}`}
                      onClick={() => togglePurchased(item.id)}
                    >
                      {item.isPurchased ? '✅ 구매 완료' : '⏳ 구매 예정'}
                    </button>

                    <div className={styles.cardActionBtns}>
                      {item.linkUrl && item.linkUrl !== '#' && (
                        <a 
                          href={item.linkUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className={styles.linkBtn}
                        >
                          쇼핑몰 ↗
                        </a>
                      )}
                      <button 
                        type="button" 
                        className={styles.deleteBtn}
                        onClick={() => handleDeleteItem(item.id)}
                        aria-label="삭제"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Interactive Guide & Sample Layer Popup Modal */}
        {isGuideOpen && (
          <div className={styles.modalOverlay} onClick={() => setIsGuideOpen(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <button 
                className={styles.closeButton}
                onClick={() => setIsGuideOpen(false)}
                aria-label="닫기"
              >
                ✕
              </button>

              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>💡</span> Cart In All 초간단 사용 가이드
              </h3>

              <div className={styles.guideStepCard}>
                <div className={styles.guideStepTitle}>1️⃣ 링크 복사 & 붙여넣기</div>
                <p className={styles.guideStepText}>
                  쿠팡, 네이버, 알리, 아마존 등에서 사고 싶은 상품 링크(URL)를 복사해 입력창에 붙여넣습니다.
                </p>
              </div>

              <div className={styles.guideStepCard}>
                <div className={styles.guideStepTitle}>2️⃣ 🔍 정보 가져오기 클릭</div>
                <p className={styles.guideStepText}>
                  버튼을 누르면 썸네일 이미지와 상품명이 자동으로 채워집니다. 가격이나 메모를 추가하고 <strong>[+ 장바구니에 담기]</strong>를 누르면 끝!
                </p>
              </div>

              <div className={styles.guideStepCard}>
                <div className={styles.guideStepTitle}>3️⃣ 스마트 예산 & 상태 관리</div>
                <p className={styles.guideStepText}>
                  물건을 샀다면 <strong>[✅ 구매 완료]</strong> 버튼을 눌러보세요. 구매 예정 금액과 지출한 금액이 실시간으로 자동 계산됩니다.
                </p>
              </div>

              <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-glass)' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
                  체험해보기
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>
                  실제 예시 데이터(자동차 물왁스, 게코 사료, 노트북 거치대)를 바로 담아 테스트해 보세요!
                </p>
                <button 
                  type="button"
                  className={styles.sampleLoadButton}
                  onClick={handleLoadSamples}
                >
                  🚀 예시 상품 3개 담아서 체험하기
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
