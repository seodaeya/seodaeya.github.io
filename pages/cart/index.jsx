import { useState, useEffect } from 'react';
import Head from 'next/head';
import SEO from '@/components/SEO';
import styles from '@/styles/cart.module.css';

const STORAGE_KEY = "cart_in_all_items";

const CATEGORIES = ["전체", "전자기기/IT", "가전/DIY", "패션/뷰티", "생필품/식품", "기타"];

const SAMPLE_ITEMS = [
  {
    id: "sample-1",
    title: "아이트로닉스 싼타페 TM 애프터블로우 (에어컨 습기 자동 건조기)",
    price: 135000,
    description: "블로그 DIY 글 연동: 시동 끄면 블로우 모터가 자동 회전해 곰팡이 냄새 완벽 예방",
    linkUrl: "https://link.coupang.com/a/eevc9hEAOi",
    imageUrl: "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=500&q=80",
    category: "가전/DIY",
    mallName: "쿠팡",
    isPurchased: false,
    createdAt: new Date().toISOString()
  },
  {
    id: "sample-2",
    title: "맥미니 & 아이패드 사이드카용 휴대용 접이식 알루미늄 거치대",
    price: 32000,
    description: "블로그 사이드카 글 연동: 맥미니를 노트북처럼 쓸 때 아이패드 듀얼 모니터 완벽 각도 조절",
    linkUrl: "https://link.coupang.com/a/eevc9hEAOi",
    imageUrl: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&q=80",
    category: "전자기기/IT",
    mallName: "쿠팡",
    isPurchased: false,
    createdAt: new Date().toISOString()
  },
  {
    id: "sample-3",
    title: "판게아 슈퍼푸드 브리딩포뮬러 56g (크레스티드 게코 전용 영양식)",
    price: 22000,
    description: "블로그 게코 글 연동: 반려 도마뱀 봄이 탈피 및 영양 공급용 슈퍼푸드 (기호성 최고)",
    linkUrl: "https://link.coupang.com/a/famuz0vibQ",
    imageUrl: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=500&q=80",
    category: "생필품/식품",
    mallName: "쿠팡",
    isPurchased: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "sample-4",
    title: "로지텍 M750 Flow 무선 무소음 멀티디바이스 마우스",
    price: 49000,
    description: "블로그 리뷰 글 연동: PC 3대 자유 이동 및 저소음 클릭 스위치",
    linkUrl: "https://link.coupang.com/a/eLGj2NLYI0",
    imageUrl: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&q=80",
    category: "전자기기/IT",
    mallName: "쿠팡",
    isPurchased: false,
    createdAt: new Date().toISOString()
  }
];

export default function CartInAll() {
  const [items, setItems] = useState([]);
  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [activeFilter, setActiveFilter] = useState('전체');
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', price: 0, category: '기타', description: '' });

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

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // Helper to extract Mall Name from URL
  const getMallName = (url) => {
    try {
      const host = new URL(url).hostname;
      if (host.includes('aliexpress')) return 'AliExpress';
      if (host.includes('naver')) return '네이버';
      if (host.includes('11st')) return '11번가';
      if (host.includes('amazon')) return '아마존';
      if (host.includes('coupang')) return '쿠팡';
      if (host.includes('musinsa')) return '무신사';
      if (host.includes('gmarket')) return 'G마켓';
      if (host.includes('auction')) return '옥션';
      return host.replace('www.', '').split('.')[0].toUpperCase();
    } catch (e) {
      return '쇼핑몰';
    }
  };

  // Safe Price Extractor: Extracts only valid prices accompanied by currency symbols or within realistic bounds
  const extractPrice = (text) => {
    if (!text || typeof text !== 'string') return 0;
    
    // Prefix pattern: KRW 24,500 or ₩24,500 or $24.50
    const prefixMatch = text.match(/(?:₩|KRW|\$)\s*([1-9][0-9]{0,2}(?:,[0-9]{3})+|[1-9][0-9]{2,7})/i);
    if (prefixMatch) {
      const num = parseInt(prefixMatch[1].replace(/,/g, ''), 10);
      if (!isNaN(num) && num > 0 && num < 100000000) return num;
    }

    // Suffix pattern: 24,500원 or 24,500 KRW
    const suffixMatch = text.match(/([1-9][0-9]{0,2}(?:,[0-9]{3})+|[1-9][0-9]{2,7})\s*(?:원|KRW|₩)/i);
    if (suffixMatch) {
      const num = parseInt(suffixMatch[1].replace(/,/g, ''), 10);
      if (!isNaN(num) && num > 0 && num < 100000000) return num;
    }

    return 0;
  };

  // Detect whether fetched title is useless query parameters or bot error
  const isGarbageTitle = (title) => {
    if (!title || typeof title !== 'string') return true;
    const t = title.trim();
    if (t.length < 3) return true;
    if (/^[0-9]{6,}/.test(t)) return true; // Starts with long product ID number
    if (t.includes('?n_media=') || t.includes('&n_rank=') || t.includes('?pvid=')) return true;
    if (t.includes('Access denied') || t.includes('접근할 수 있는') || t.includes('Sign in') || t.includes('로봇이 아닙니다')) return true;
    return false;
  };

  // ONE-CLICK MULTI-PLATFORM SMART URL PARSER
  const handleQuickAdd = async (e) => {
    e.preventDefault();
    const targetUrl = urlInput.trim();
    if (!targetUrl) {
      alert("쇼핑몰 상품 링크(URL)를 입력해 주세요!");
      return;
    }

    setIsLoading(true);
    const mallName = getMallName(targetUrl);

    let title = "";
    let description = "쇼핑몰 링크에서 직접 담긴 상품입니다.";
    let imageUrl = "";
    let price = 0;
    let category = "기타";

    try {
      // 1. Fetch via metadata scraper API (Amazon & standard OpenGraph websites)
      try {
        const res = await fetch(`https://api.microlink.io?url=${encodeURIComponent(targetUrl)}`);
        const data = await res.json();

        if (data.status === 'success' && data.data) {
          const d = data.data;
          const rawTitle = d.title || "";
          
          if (!isGarbageTitle(rawTitle)) {
            title = rawTitle;
            description = d.description || description;
            price = extractPrice(rawTitle) || extractPrice(d.description);
            if (d.image && d.image.url && !d.image.url.includes('favicon') && !d.image.url.includes('logo')) {
              imageUrl = d.image.url;
            }
          }
        }
      } catch (fetchErr) {
        console.warn("API scraper failed, falling back to smart URL engine:", fetchErr);
      }

      // 2. MALL-SPECIFIC DEEP PARSING & ALGORITHM

      // 2-A. AliExpress (알리익스프레스: pdp_npi 파라미터 기반 가격/상품 분석)
      if (mallName === 'AliExpress') {
        category = "전자기기/IT";
        try {
          const parsedUrl = new URL(targetUrl);
          const pdpNpi = parsedUrl.searchParams.get('pdp_npi') || targetUrl;
          const decodedNpi = decodeURIComponent(pdpNpi);
          
          // pdp_npi format: 6@dis!KRW!₩+6,690!₩+1,000!...
          const krwMatches = decodedNpi.match(/(?:KRW|₩|%E2%82%A9)[!+]?\s*([0-9,]+)/g);
          if (krwMatches && krwMatches.length > 0) {
            const prices = krwMatches.map(m => {
              const num = m.replace(/[^0-9]/g, '');
              return parseInt(num, 10);
            }).filter(n => !isNaN(n) && n > 0);
            
            if (prices.length > 1) {
              price = Math.min(...prices); // 할인 판매가 우선 적용
            } else if (prices.length === 1) {
              price = prices[0];
            }
          }
        } catch (e) {
          console.warn("AliExpress pdp_npi parser error:", e);
        }

        const aliItemIdMatch = targetUrl.match(/item\/([0-9]+)\.html/);
        const itemId = aliItemIdMatch ? aliItemIdMatch[1] : "";
        if (!title || isGarbageTitle(title)) {
          title = `[AliExpress] 글로벌 직구 상품 #${itemId}`;
          description = `알리익스프레스 직구 상품 (할인 판매가 ${price > 0 ? price.toLocaleString() + '원' : '적용'})`;
        }
        if (!imageUrl) {
          imageUrl = "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&q=80";
        }
      }

      // 2-B. Naver Smartstore / Shopping (네이버 스마트스토어)
      else if (mallName === '네이버') {
        category = "생필품/식품";
        const storeMatch = targetUrl.match(/smartstore\.naver\.com\/([^/]+)\/products\/([0-9]+)/);
        const storeName = storeMatch ? storeMatch[1] : "스마트스토어";
        const prodId = storeMatch ? storeMatch[2] : "";
        if (!title || isGarbageTitle(title)) {
          title = `[네이버] ${storeName} 스토어 상품 #${prodId}`;
          description = `네이버 쇼핑(${storeName}) 상품입니다. (✏️ 수정 버튼으로 상품명/금액을 변경할 수 있습니다)`;
        }
        if (!imageUrl) {
          imageUrl = "https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&q=80";
        }
      }

      // 2-C. 11st (11번가)
      else if (mallName === '11번가') {
        category = "패션/뷰티";
        const prodMatch = targetUrl.match(/products\/([0-9]+)/);
        const prodId = prodMatch ? prodMatch[1] : "";
        if (!title || isGarbageTitle(title)) {
          title = `[11번가] 추천 특가 상품 #${prodId}`;
          description = "11번가 오픈마켓 상품 (✏️ 수정 버튼으로 변경 가능)";
        }
        if (!imageUrl) {
          imageUrl = "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=500&q=80";
        }
      }

      // 2-D. Amazon (아마존)
      else if (mallName === '아마존') {
        category = "전자기기/IT";
        const asinMatch = targetUrl.match(/\/dp\/([A-Z0-9]+)/);
        const asin = asinMatch ? asinMatch[1] : "";
        const pathTitleMatch = targetUrl.match(/amazon\.com\/([^/]+)\/dp/);
        const cleanPathTitle = pathTitleMatch ? decodeURIComponent(pathTitleMatch[1]).replace(/-/g, ' ') : "아마존 해외 직구 상품";
        if (!title || isGarbageTitle(title)) {
          title = `[아마존] ${cleanPathTitle} (ASIN: ${asin})`;
          description = "Amazon 해외 직구 상품";
        }
        if (!imageUrl) {
          imageUrl = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80";
        }
      }

      // 2-E. Coupang (쿠팡)
      else if (mallName === '쿠팡') {
        category = "가전/DIY";
        const productIdMatch = targetUrl.match(/products\/([0-9]+)/);
        const productId = productIdMatch ? productIdMatch[1] : Date.now().toString().slice(-4);
        if (!title || isGarbageTitle(title)) {
          title = `[쿠팡] 추천 상품 #${productId}`;
          description = "쿠팡 추천 상품 (✏️ 수정 버튼으로 가격/상품명 변경 가능)";
        }
        if (!imageUrl) {
          imageUrl = "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=500&q=80";
        }
      }

      // Final default fallback
      if (!title) {
        title = `[${mallName}] 관심 상품`;
      }

      const newItem = {
        id: Date.now().toString(),
        title,
        price,
        description,
        linkUrl: targetUrl,
        imageUrl,
        category,
        mallName,
        isPurchased: false,
        createdAt: new Date().toISOString()
      };

      const updated = [newItem, ...items];
      saveItems(updated);
      setUrlInput('');
      showToast(`🎉 '[${mallName}]' 상품이 장바구니에 성공적으로 담겼습니다!`);

    } catch (err) {
      console.warn("Auto parse failed, creating fallback item", err);
      const fallbackItem = {
        id: Date.now().toString(),
        title: `[${mallName}] 관심 상품`,
        price: 0,
        description: "쇼핑몰 링크에서 담긴 상품",
        linkUrl: targetUrl,
        imageUrl: "",
        category: "기타",
        mallName,
        isPurchased: false,
        createdAt: new Date().toISOString()
      };
      saveItems([fallbackItem, ...items]);
      setUrlInput('');
      showToast(`🎉 관심 상품이 장바구니에 담겼습니다!`);
    } finally {
      setIsLoading(false);
    }
  };

  // Load sample items
  const handleLoadSamples = () => {
    const combined = [...SAMPLE_ITEMS, ...items.filter(i => !i.id.startsWith('sample-'))];
    saveItems(combined);
    setIsGuideOpen(false);
    showToast("🚀 실제 블로그 글과 연동된 쿠팡 예시 상품 4개가 추가되었습니다!");
  };

  // Toggle purchased state
  const togglePurchased = (id) => {
    const updated = items.map(item => 
      item.id === id ? { ...item, isPurchased: !item.isPurchased } : item
    );
    saveItems(updated);
  };

  // Clear entire cart
  const handleClearAll = () => {
    if (items.length === 0) {
      alert("장바구니가 이미 비어 있습니다.");
      return;
    }
    if (confirm(`장바구니에 담긴 모든 상품(총 ${items.length}개)을 완전히 비우시겠습니까?\n(필요한 목록은 [내려받기]로 먼저 백업해 두세요!)`)) {
      saveItems([]);
      showToast("🗑️ 장바구니의 모든 상품을 비웠습니다.");
    }
  };

  // Clear all purchased items
  const handleClearPurchased = () => {
    const purchasedList = items.filter(i => i.isPurchased);
    if (purchasedList.length === 0) {
      alert("구매 완료된 상품이 없습니다.");
      return;
    }
    if (confirm(`구매 완료된 ${purchasedList.length}개의 상품을 장바구니에서 모두 삭제하시겠습니까?`)) {
      const updated = items.filter(i => !i.isPurchased);
      saveItems(updated);
      showToast(`🧹 구매 완료된 상품 ${purchasedList.length}개가 깔끔하게 정리되었습니다!`);
    }
  };

  // Delete item
  const handleDeleteItem = (id) => {
    if (confirm("이 상품을 장바구니에서 삭제하시겠습니까?")) {
      const updated = items.filter(item => item.id !== id);
      saveItems(updated);
      showToast("🗑️ 상품이 장바구니에서 삭제되었습니다.");
    }
  };

  // Start In-Place Editing
  const startEdit = (item) => {
    setEditingId(item.id);
    setEditForm({
      title: item.title,
      price: item.price || 0,
      category: item.category || '기타',
      description: item.description || ''
    });
  };

  // Save In-Place Editing
  const saveEdit = (id) => {
    const updated = items.map(i => i.id === id ? { ...i, ...editForm } : i);
    saveItems(updated);
    setEditingId(null);
    showToast("✏️ 상품 정보가 수정되었습니다.");
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
    showToast("💾 내 장바구니 백업 파일(JSON)을 PC로 내려받았습니다!");
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
          showToast(`📂 성공적으로 ${imported.length}개의 상품을 불러와 이어서 시작합니다!`);
        }
      } catch (err) {
        alert("올바르지 않은 JSON 백업 파일 형식입니다.");
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
        title="모두모아 장바구니 | 실험 서비스"
        description="쿠팡, 네이버쇼핑, 알리 등 여러 쇼핑몰의 상품 링크를 한곳에 모아 관리하는 스마트 만능 장바구니 서비스입니다."
        url="https://seodaeya.github.io/cart/"
      />

      <div className={styles.cartContainer}>
        
        {/* Header */}
        <header className={styles.cartHeader}>
          <span className={styles.cartBadge}>LAB EXPERIMENT</span>
          <h1 className={styles.cartTitle}>모두모아 장바구니</h1>
          <p className={styles.cartSubtitle}>
            쿠팡, 네이버, 알리, 아마존 등 흩어져 있는 쇼핑몰 링크를 붙여넣으면<br />
            <strong>링크 하나로 상품 정보와 가격을 한곳에 쏙 모아</strong> 예산을 관리해 줍니다.
          </p>
          
          <button 
            type="button" 
            className={`${styles.guideTriggerBtn} ${isGuideOpen ? styles.guideTriggerBtnActive : ''}`}
            onClick={() => setIsGuideOpen(!isGuideOpen)}
            aria-expanded={isGuideOpen}
          >
            <span>💡</span> {isGuideOpen ? '사용 가이드 닫기 ✕' : '사용법 & 예시 보기'}
          </button>
        </header>

        {/* IN-PLACE EXPANDABLE GUIDE & SAMPLE SECTION (Directly below button, 0 scroll jump) */}
        {isGuideOpen && (
          <section className={styles.inlineGuideWrapper} aria-label="사용법 및 예시 안내">
            <div className={styles.inlineGuideHeader}>
              <h2 className={styles.inlineGuideTitle}>
                <span>💡</span> 모두모아 장바구니 초간단 사용법
              </h2>
              <button 
                type="button"
                className={styles.guideTriggerBtn}
                style={{ fontSize: '0.8rem', padding: '4px 14px' }}
                onClick={() => setIsGuideOpen(false)}
              >
                닫기 ✕
              </button>
            </div>

            <div className={styles.inlineGuideGrid}>
              <div className={styles.guideStepCard}>
                <div className={styles.guideStepTitle}>1️⃣ 링크 복사 & 붙여넣기</div>
                <p className={styles.guideStepText}>
                  쿠팡, 네이버, 알리, 아마존 등에서 사고 싶은 상품 링크(URL)를 복사해 아래 입력창에 넣고 <strong>[➕ 링크로 즉시 담기]</strong>를 누릅니다.
                </p>
              </div>

              <div className={styles.guideStepCard}>
                <div className={styles.guideStepTitle}>2️⃣ 스마트 예산 & 구매 체크</div>
                <p className={styles.guideStepText}>
                  물건을 샀다면 <strong>[✅ 구매 완료]</strong> 버튼을 눌러보세요. 구매 예정 금액과 지출한 금액이 실시간으로 자동 계산됩니다.
                </p>
              </div>

              <div className={styles.guideStepCard}>
                <div className={styles.guideStepTitle}>3️⃣ PC 내려받기 & 이어쓰기</div>
                <p className={styles.guideStepText}>
                  브라우저 캐시 삭제 시 데이터가 지워지는 것을 방지하기 위해 <strong>[📥 PC로 내려받기]</strong>로 백업해 두고, 언제든 <strong>[📤 파일 업로드]</strong>로 불러올 수 있습니다.
                </p>
              </div>
            </div>

            <div className={styles.samplePreviewArea}>
              <div className={styles.samplePreviewTitle}>
                <span>🎁</span> 블로그 실제 콘텐츠 연동 예시 상품 4종 미리보기
              </div>
              <div className={styles.sampleList}>
                <div className={styles.samplePill}>🚗 아이트로닉스 싼타페 애프터블로우 (13.5만)</div>
                <div className={styles.samplePill}>💻 맥미니&아이패드 알루미늄 거치대 (3.2만)</div>
                <div className={styles.samplePill}>🦎 게코 봄이 판게아 슈퍼푸드 (2.2만)</div>
                <div className={styles.samplePill}>🖱️ 로지텍 M750 무소음 마우스 (4.9만)</div>
              </div>
              <button 
                type="button"
                className={styles.sampleLoadButton}
                onClick={handleLoadSamples}
              >
                🚀 위 실제 블로그 예시 상품 4개 바로 담아서 체험하기
              </button>
            </div>
          </section>
        )}

        {/* LocalStorage Security & Warning Notice */}
        <div className={styles.storageWarningBanner}>
          <span className={styles.warningIcon}>🔒</span>
          <div className={styles.warningContent}>
            <div className={styles.warningTitle}>브라우저 스토리지(LocalStorage) 보관 안내</div>
            <p className={styles.warningText}>
              본 서비스는 개인정보 유출 방지 및 서버비 0원을 위해 별도의 회원가입 없이 <strong>사용자 브라우저의 로컬 스토리지</strong>에만 안전하게 보관됩니다.<br />
              브라우저 방문 기록이나 캐시를 초기화하면 데이터가 삭제될 수 있으니, 아래 <strong>[💾 내 장바구니 내려받기]</strong> 기능을 통해 주기적으로 백업 파일을 보관해 주세요!
            </p>
          </div>
        </div>

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
            <div className={styles.statLabel}>✅ 구매 완료 금액 ({items.filter(i => i.isPurchased).length}개)</div>
            <div className={styles.statValue} style={{ color: '#4ade80' }}>{totalPurchased.toLocaleString()}원</div>
            {items.some(i => i.isPurchased) && (
              <button 
                type="button"
                className={styles.statClearBtn}
                onClick={handleClearPurchased}
                title="구매 완료된 모든 상품 일괄 삭제"
              >
                🧹 구매완료 일괄 비우기
              </button>
            )}
          </div>
        </div>

        {/* ONE-CLICK QUICK PASTE & ADD CARD */}
        <section className={styles.quickAddCard}>
          <div className={styles.quickAddHeader}>
            <h2 className={styles.quickAddTitle}>
              <span>⚡</span> 쇼핑몰 링크 복사 후 바로 담기
            </h2>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              쿠팡, 네이버, 알리, 아마존 등 상품 링크를 넣고 Enter를 누르세요.
            </span>
          </div>

          <form onSubmit={handleQuickAdd}>
            <div className={styles.quickInputRow}>
              <input 
                type="url"
                placeholder="https://www.coupang.com/vp/products/... (쇼핑몰 상품 상세 링크 붙여넣기)"
                className={styles.mainUrlInput}
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                required
              />
              <button 
                type="submit" 
                className={styles.quickAddBtn}
                disabled={isLoading}
              >
                {isLoading ? '가져오는 중...' : '➕ 링크로 즉시 담기'}
              </button>
            </div>
            <p className={styles.quickHelpText}>
              💡 링크를 넣고 담기만 누르면 상품명, 이미지, 가격 정보를 자동으로 스크랩하여 장바구니에 쏙 추가합니다.
            </p>
          </form>

          {/* Toast Notification */}
          {toastMsg && (
            <div className={styles.toastMessage}>
              <span>✨</span> {toastMsg}
            </div>
          )}
        </section>

        {/* DEDICATED BACKUP & RESTORE TOOLBAR */}
        <div className={styles.backupBar}>
          <div>
            <div className={styles.backupInfoTitle}>
              <span>💾</span> 내 장바구니 PC 내려받기 & 이어쓰기
            </div>
            <p className={styles.backupInfoDesc}>
              소중한 위시리스트를 JSON 파일로 다운로드하거나, 다른 기기에서 불러와서 계속 사용할 수 있습니다.
            </p>
          </div>

          <div className={styles.backupButtons}>
            <button 
              type="button" 
              className={styles.downloadBackupBtn}
              onClick={handleExportJson}
              title="내 장바구니를 JSON 파일로 다운로드"
            >
              <span>📥</span> PC로 내려받기 (백업)
            </button>
            
            <label className={styles.uploadBackupBtn} title="백업 파일(JSON)을 업로드하여 이어서 사용">
              <span>📤</span> 파일 업로드 (복원)
              <input 
                type="file" 
                accept=".json" 
                onChange={handleImportJson} 
                style={{ display: 'none' }} 
              />
            </label>
          </div>
        </div>

        {/* Filter Tabs & Bulk Actions (Clear Purchased & Clear All) */}
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

          {items.length > 0 && (
            <div className={styles.cartActionGroup}>
              {items.some(i => i.isPurchased) && (
                <button 
                  type="button" 
                  className={styles.clearPurchasedBtn}
                  onClick={handleClearPurchased}
                  title="구매 완료된 상품들만 정리"
                >
                  <span>🧹</span> 구매완료 비우기 ({items.filter(i => i.isPurchased).length})
                </button>
              )}

              <button 
                type="button" 
                className={styles.clearAllBtn}
                onClick={handleClearAll}
                title="장바구니의 모든 상품을 한 번에 비우기"
              >
                <span>🗑️</span> 전체 비우기
              </button>
            </div>
          )}
        </div>

        {/* Item List Grid */}
        {filteredItems.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🛒</div>
            <h3 className={styles.emptyTitle}>장바구니가 비어 있습니다</h3>
            <p className={styles.emptyDesc}>
              원하는 쇼핑몰 링크를 상단에 붙여넣거나, 아래 예시 데이터를 담아서 테스트해 보세요!
            </p>
            <button 
              type="button" 
              className={styles.guideTriggerBtn}
              onClick={handleLoadSamples}
            >
              🚀 실제 블로그 예시 4개 담아보기
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
                  {item.mallName && (
                    <span className={styles.mallBadge}>{item.mallName}</span>
                  )}
                </div>

                <div className={styles.itemBody}>
                  {editingId === item.id ? (
                    /* IN-PLACE CARD EDITOR */
                    <div className={styles.editCardForm}>
                      <input 
                        type="text" 
                        className={styles.editInput}
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        placeholder="상품명"
                      />
                      <input 
                        type="number" 
                        className={styles.editInput}
                        value={editForm.price || ''}
                        onChange={(e) => setEditForm({ ...editForm, price: parseInt(e.target.value, 10) || 0 })}
                        placeholder="가격(원)"
                      />
                      <select 
                        className={styles.editInput}
                        value={editForm.category}
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      >
                        {CATEGORIES.filter(c => c !== '전체').map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <input 
                        type="text" 
                        className={styles.editInput}
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        placeholder="메모"
                      />
                      <div className={styles.editActionRow}>
                        <button type="button" className={styles.cancelEditBtn} onClick={() => setEditingId(null)}>
                          취소
                        </button>
                        <button type="button" className={styles.saveEditBtn} onClick={() => saveEdit(item.id)}>
                          💾 저장
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* NORMAL VIEW */
                    <>
                      <h3 className={styles.itemTitle} title={item.title} onClick={() => startEdit(item)} style={{ cursor: 'pointer' }}>
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
                          title={item.isPurchased ? '구매 예정으로 다시 변경' : '구매 완료로 표시'}
                        >
                          {item.isPurchased ? '✅ 구매 완료' : '⏳ 구매 예정'}
                        </button>

                        <div className={styles.cardActionBtns}>
                          <button 
                            type="button" 
                            className={styles.linkBtn}
                            onClick={() => startEdit(item)}
                            title="수정하기"
                          >
                            ✏️
                          </button>
                          {item.linkUrl && item.linkUrl !== '#' && (
                            <a 
                              href={item.linkUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className={styles.linkBtn}
                              title="쇼핑몰 바로가기"
                            >
                              쇼핑몰 ↗
                            </a>
                          )}
                          <button 
                            type="button" 
                            className={styles.deleteBtn}
                            onClick={() => handleDeleteItem(item.id)}
                            title="삭제"
                            aria-label="삭제"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

      </div>
    </>
  );
}
