import { useState, useEffect } from 'react';
import Head from 'next/head';
import SEO from '@/components/SEO';
import styles from '@/styles/cart.module.css';

const COUPANG_PARTNERS_URL = "https://link.coupang.com/a/gpEnV0YNfE";
const STORAGE_KEY = "cart_in_all_items";

const CATEGORIES = ["전체", "전자기기/IT", "가전/DIY", "패션/뷰티", "생필품/식품", "기타"];

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
    if (!urlInput.trim()) return;
    setIsLoading(true);

    try {
      const targetUrl = urlInput.trim();
      const res = await fetch(`https://api.microlink.io?url=${encodeURIComponent(targetUrl)}`);
      const data = await res.json();

      if (data.status === 'success' && data.data) {
        const d = data.data;
        setTitleInput(d.title || '');
        setDescInput(d.description || '');
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

        {/* Add Product Form */}
        <section className={styles.addFormCard}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>✨ 새 상품 모아담기</h2>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              링크를 넣고 '정보 가져오기'를 누르면 썸네일과 상품명이 자동 입력됩니다.
            </span>
          </div>

          <form onSubmit={handleAddItem}>
            <div className={styles.urlInputRow}>
              <input 
                type="url"
                placeholder="쇼핑몰 상품 링크(URL)를 붙여넣으세요"
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

            <div className={styles.manualInputsGrid}>
              <input 
                type="text" 
                placeholder="상품명 (필수)"
                className={styles.inputField}
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                required
              />
              <input 
                type="number" 
                placeholder="가격 (숫자만, 원)"
                className={styles.inputField}
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
              />
              <select 
                className={styles.selectField}
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
              >
                {CATEGORIES.filter(c => c !== '전체').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <input 
                type="url" 
                placeholder="이미지 URL (선택)"
                className={styles.inputField}
                value={imageInput}
                onChange={(e) => setImageInput(e.target.value)}
              />
            </div>

            <div style={{ marginTop: '12px' }}>
              <input 
                type="text" 
                placeholder="간단한 메모 (예: 싼타페 교체용 부품, 할인 시 구매)"
                className={styles.inputField}
                style={{ width: '100%' }}
                value={descInput}
                onChange={(e) => setDescInput(e.target.value)}
              />
            </div>

            <div style={{ marginTop: '18px', textAlign: 'right' }}>
              <button type="submit" className={styles.parseButton}>
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
              위 입력창에 쇼핑몰 상품 링크를 넣고 나만의 만능 장바구니를 만들어 보세요!
            </p>
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

      </div>
    </>
  );
}
