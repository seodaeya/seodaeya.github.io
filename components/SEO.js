import Head from 'next/head';

export default function SEO({
  title = '여전히, 나는 사람이다. | 기술과 일상의 기록',
  description = '인공지능(AI) 트렌드와 소프트웨어 아키텍처 분석부터 손끝의 일상까지, 직접 겪고 기록하는 테크 블로그입니다. 실무 백엔드 개발 트러블슈팅, 최신 LLM·코딩 에이전트 가이드, IT 기기 리뷰와 생활 밀착형 DIY 노하우를 깊이 있게 나눕니다.',
  keywords = 'NaRD, 블로그, 유튜브, 기술, 라이프',
  url = 'https://seodaeya.github.io',
  type = 'website',
  image = '/na_rd.jpeg', // 기본 프로필 이미지 경로
  date,
  dateModified,
  videoId,
  noindex = false,
}) {
  const siteSuffix = ' | 여전히, 나는 사람이다.';
  let pageTitle = (!title.includes('여전히, 나는 사람이다.') && title.length + siteSuffix.length <= 60)
    ? `${title}${siteSuffix}`
    : title;

  // Bing/Google SERP: 최대 65자 초과 시 공통 말줄임 처리
  if (pageTitle.length > 65) {
    pageTitle = `${pageTitle.slice(0, 62)}...`;
  }

  // Next.js trailingSlash: true 환경과 100% 일치하도록 정규화 (도메인 내 '.' 때문에 슬래시가 누락되던 버그 수정)
  const normalizeCanonicalUrl = (rawUrl) => {
    if (!rawUrl) return 'https://seodaeya.github.io/';
    const [base] = rawUrl.split(/[?#]/);
    const pathPart = base.replace(/^https?:\/\/[^/]+/, '');
    const lastSegment = pathPart.split('/').filter(Boolean).pop() || '';
    const hasFileExt = /\.[a-zA-Z0-9]+$/.test(lastSegment) && !lastSegment.endsWith('.html');
    return base.endsWith('/') || hasFileExt ? base : `${base}/`;
  };
  const canonicalUrl = normalizeCanonicalUrl(url);

  // Core page dedicated 135~155 char descriptions (preserves git history of static page files)
  const coreDescriptions = {
    'https://seodaeya.github.io/':
      '인공지능(AI) 트렌드와 소프트웨어 아키텍처 분석부터 손끝의 일상까지, 직접 겪고 기록하는 테크 블로그입니다. 실무 백엔드 개발 트러블슈팅, 최신 LLM·코딩 에이전트 가이드, IT 기기 리뷰와 생활 밀착형 DIY 노하우를 깊이 있게 나눕니다.',
    'https://seodaeya.github.io/categories/':
      '전체 카테고리별 기술 아티클 및 유튜브 영상을 한눈에 분류하여 확인하실 수 있습니다. AI & Intelligence, 개발 트러블슈팅, 클라우드 인프라, IT 기기 리뷰, DIY 가이드 등 관심 분야별 콘텐츠를 빠르게 탐색해 보세요.',
    'https://seodaeya.github.io/ranking/':
      '매월 1일 기준 순위표를 바탕으로 한 달간 독자 반응과 Google Analytics 4(GA4) 실시간 페이지뷰 변화를 감지하여 매일 자정 자동 갱신하는 월간 인기 아티클 종합 순위표(Monthly Leaderboard)입니다.',
    'https://seodaeya.github.io/cart/':
      '쿠팡, 네이버 스마트스토어, 알리익스프레스 등 여러 온라인 쇼핑몰의 상품 링크를 한곳에 모아 가격과 이미지를 비교하고 카테고리별로 깔끔하게 관리하는 서버리스 기반 스마트 만능 장바구니 실험실 웹 서비스입니다.',
    'https://seodaeya.github.io/word-train/':
      '기차 여행 테마의 인터랙티브 단어 맞추기 웹 게임입니다. 유아부터 성인까지 단계별 난이도에 맞춰 한글·영어 필수 어휘와 힌트를 추리하며 어휘력과 두뇌 회전을 키우고, 최종 점수를 친구들과 간편하게 공유해 보세요.',
    'https://seodaeya.github.io/about/':
      '완벽하지 않기에 배우고, 실수하기에 끊임없이 도전합니다. 생성형 AI 시대 속에서도 사람이 직접 부딪히며 얻은 소프트웨어 엔지니어링 인사이트와 일상의 온기, 그리고 성장의 여정을 진솔하게 기록하는 NaRD 블로그 소개 페이지입니다.',
    'https://seodaeya.github.io/privacy/':
      "'여전히, 나는 사람이다.' 블로그의 공식 개인정보처리방침 안내 페이지입니다. 방문자 개인정보 보호 원칙, Google Analytics 4·구글 애드센스·Microsoft Clarity 등 제3자 쿠키 활용 및 옵트아웃 방법을 명시합니다.",
    'https://seodaeya.github.io/bookmarks/':
      '나중에 다시 읽기 위해 저장한 북마크 아티클 목록과 내 관심 태그·주제 유사도 분석을 기반으로 맞춤형 연관 기술 아티클 및 영상을 추천해 주는 개인화 큐레이션 서재 페이지입니다.',
    'https://seodaeya.github.io/planner/':
      'AI로 정리한 안내문을 일정과 준비물로 나눠 브라우저에만 저장하는 로컬 우선 가족 일정 관리 서비스입니다. 일정과 준비물·할 일을 양방향으로 연결하고, 서버 없이 JSON 백업과 구글 캘린더·ICS 내보내기를 지원합니다. 설치 없이 무료로 사용하세요.',
  };

  // Bing/Google SEO: Ensure description is between 120 and 158 characters
  const buildSafeDescription = (rawDesc) => {
    let base = (coreDescriptions[canonicalUrl] || rawDesc || '').replace(/\s+/g, ' ').trim();
    if (base.length < 120) {
      const cleanTitle = pageTitle.replace(siteSuffix, '').trim();
      const suffix = `'여전히, 나는 사람이다.' 테크 블로그에서 '${cleanTitle}' 주제의 핵심 원리, 실전 가이드 및 상세 인사이트를 확인해 보세요.`;
      base = base ? `${base} ${suffix}` : suffix;
      base = base.replace(/\s+/g, ' ').trim();
    }
    if (base.length > 158) {
      return `${base.slice(0, 155).trim()}...`;
    }
    return base;
  };
  const safeDescription = buildSafeDescription(description);
  const defaultImage = 'https://seodaeya.github.io/na_rd.jpeg';
  const finalImage = image && typeof image === 'string' && image.trim() !== '' ? image : '/na_rd.jpeg';
  const ogImage = finalImage.startsWith('http') ? finalImage : `https://seodaeya.github.io${finalImage}`;

  // JSON-LD structured data
  const baseSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': '여전히, 나는 사람이다. (NaRD Blog)',
    'url': 'https://seodaeya.github.io/',
    'description': 'AI 시대에 남기는 지극히 인간적인 기록들',
    'inLanguage': 'ko',
    'publisher': {
      '@type': 'Person',
      'name': 'NaRD',
      'sameAs': 'https://www.youtube.com/@Na.R.D.'
    }
  };

  let specificSchema = null;

  if (type === 'article') {
    const publishedIso = date ? new Date(date).toISOString() : new Date().toISOString();
    const modifiedIso = (dateModified || date) ? new Date(dateModified || date).toISOString() : publishedIso;
    specificSchema = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      'mainEntityOfPage': {
        '@type': 'WebPage',
        '@id': canonicalUrl
      },
      'headline': pageTitle,
      'description': safeDescription,
      'image': ogImage,
      'datePublished': publishedIso,
      'dateModified': modifiedIso,
      'author': {
        '@type': 'Person',
        'name': 'NaRD',
        'url': 'https://www.youtube.com/@Na.R.D.'
      },
      'publisher': {
        '@type': 'Person',
        'name': 'NaRD',
        'logo': {
          '@type': 'ImageObject',
          'url': defaultImage
        }
      }
    };
  } else if ((type === 'video' || type === 'video.other') && videoId) {
    const publishedIso = date ? new Date(date).toISOString() : new Date().toISOString();
    const modifiedIso = (dateModified || date) ? new Date(dateModified || date).toISOString() : publishedIso;
    const thumbnailList = [
      `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    ];
    if (finalImage && finalImage !== '/na_rd.jpeg') {
      thumbnailList.unshift(ogImage);
    }
    specificSchema = {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      'name': pageTitle,
      'description': safeDescription,
      'thumbnailUrl': thumbnailList,
      'uploadDate': publishedIso,
      'datePublished': publishedIso,
      'dateModified': modifiedIso,
      'embedUrl': `https://www.youtube.com/embed/${videoId}`,
      'publisher': {
        '@type': 'Person',
        'name': 'NaRD',
        'url': 'https://www.youtube.com/@Na.R.D.'
      }
    };
  }

  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-QEKBH49RMK';

  return (
    <Head>
      {/* Basic HTML Meta Tags (Placed at top of <head> for crawler priority) */}
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="content-language" content="ko" />
      <meta name="language" content="ko" />
      <title>{pageTitle}</title>
      <meta name="description" content={safeDescription} />
      <meta name="keywords" content={keywords} />
      <meta name="thumbnail" content={ogImage} />
      <meta name="author" content="NaRD" />
      <meta name="distribution" content="global" />
      <meta name="rating" content="general" />

      {/* Naver Search Advisor & Google Search Console Verification */}
      <meta name="naver-site-verification" content="88667ea44fcae091f1e08a616b7908c9720d724d" />
      <meta name="google-site-verification" content="08GPePNe2hYuPGu3jKQsPQRXOH9X0onaK3Bk0ymQHeQ" />

      {/* Google AdSense Script (Strictly loaded only on indexable publisher content pages) */}
      {!noindex && (
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9646087317436086"
          crossOrigin="anonymous"
        />
      )}

      {/* Google Analytics 4 (GA4) Tracking Tag */}
      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />

      {/* Dublin Core Metadata for Global Search Engines */}
      <meta name="DC.Title" content={pageTitle} />
      <meta name="DC.Creator" content="NaRD" />
      <meta name="DC.Description" content={safeDescription} />
      <meta name="DC.Language" content="ko" />
      <meta name="DC.Identifier" content={canonicalUrl} />

      {/* SEO/AI Crawler Directives (noindex pages opt out of indexing) */}
      <meta name="robots" content={noindex ? "noindex, follow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"} />
      <meta name="googlebot" content={noindex ? "noindex, follow" : "index, follow"} />
      <meta name="bingbot" content={noindex ? "noindex, follow" : "index, follow, max-image-preview:large"} />
      <meta name="duckduckbot" content={noindex ? "noindex, follow" : "index, follow"} />
      <meta name="slurp" content={noindex ? "noindex, follow" : "index, follow"} />
      <meta name="yandex" content={noindex ? "noindex, follow" : "index, follow"} />
      {/* Explicit instructions for AI Search Engines & LLM agents */}
      <meta name="ai-crawlers" content={noindex ? "noindex, follow" : "index, follow"} />
      <meta name="gptbot" content={noindex ? "noindex, follow" : "index, follow"} />
      <meta name="anthropic-crawler" content={noindex ? "noindex, follow" : "index, follow"} />
      <meta name="perplexitybot" content={noindex ? "noindex, follow" : "index, follow"} />

      {/* Canonical Link & RSS Auto-Discovery */}
      <link rel="canonical" href={canonicalUrl} />
      <link
        rel="alternate"
        type="application/rss+xml"
        title="여전히, 나는 사람이다. RSS Feed"
        href="https://seodaeya.github.io/rss.xml"
      />

      {/* Language hreflang tags (ko & x-default only to prevent single-URL multi-language conflict) */}
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />
      <link rel="alternate" hrefLang="ko" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type === 'article' ? 'article' : 'website'} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={safeDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="여전히, 나는 사람이다." />
      <meta property="og:locale" content="ko_KR" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={safeDescription} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:creator" content="@Na.R.D." />

      {/* Favicon & Theme Color */}
      <meta name="theme-color" content="#0f172a" />
      <link rel="icon" href="/favicon.ico" />

      {/* JSON-LD Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(baseSchema) }}
      />
      {specificSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(specificSchema) }}
        />
      )}
    </Head>
  );
}
