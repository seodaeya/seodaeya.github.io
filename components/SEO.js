import Head from 'next/head';

export default function SEO({
  title = '나는 사람이다. | 기술과 일상의 기록',
  description = 'AI 시대에 남기는 지극히 인간적인 기록들을 모아둔 1인 블로그입니다. 웹 개발, IT 기기 리뷰, 일상적인 경험과 팁 등 유익한 이야기를 나눕니다.',
  keywords = 'NaRD, 블로그, 유튜브, 기술, 라이프',
  url = 'https://seodaeya.github.io',
  type = 'website',
  image = '/na_rd.jpeg', // 기본 프로필 이미지 경로
  date,
  videoId,
}) {
  const pageTitle = title.includes('나는 사람이다.') ? title : `${title} | 나는 사람이다.`;
  const defaultImage = 'https://seodaeya.github.io/na_rd.jpeg';
  const finalImage = image && typeof image === 'string' && image.trim() !== '' ? image : '/na_rd.jpeg';
  const ogImage = finalImage.startsWith('http') ? finalImage : `https://seodaeya.github.io${finalImage}`;

  // JSON-LD structured data
  const baseSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': '나는 사람이다. (NaRD Blog)',
    'url': 'https://seodaeya.github.io',
    'description': 'AI 시대에 남기는 지극히 인간적인 기록들',
    'publisher': {
      '@type': 'Person',
      'name': 'NaRD',
      'sameAs': 'https://www.youtube.com/@Na.R.D.'
    }
  };

  let specificSchema = null;

  if (type === 'article') {
    specificSchema = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      'mainEntityOfPage': {
        '@type': 'WebPage',
        '@id': url
      },
      'headline': title,
      'description': description,
      'image': ogImage,
      'datePublished': date ? new Date(date).toISOString() : new Date().toISOString(),
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
  } else if (type === 'video' && videoId) {
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
      'name': title,
      'description': description,
      'thumbnailUrl': thumbnailList,
      'uploadDate': date ? new Date(date).toISOString() : new Date().toISOString(),
      'embedUrl': `https://www.youtube.com/embed/${videoId}`,
      'publisher': {
        '@type': 'Person',
        'name': 'NaRD',
        'url': 'https://www.youtube.com/@Na.R.D.'
      }
    };
  }

  return (
    <Head>
      {/* Basic HTML Meta Tags */}
      <title>{pageTitle}</title>
      <meta name="thumbnail" content={ogImage} />

      {/* Naver Search Advisor Verification */}
      <meta name="naver-site-verification" content="88667ea44fcae091f1e08a616b7908c9720d724d" />
      {/* Google Search Console Verification */}
      <meta name="google-site-verification" content="08GPePNe2hYuPGu3jKQsPQRXOH9X0onaK3Bk0ymQHeQ" />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta charSet="UTF-8" />
      <meta name="author" content="NaRD" />
      <meta name="distribution" content="global" />
      <meta name="rating" content="general" />

      {/* Dublin Core Metadata for Global Search Engines */}
      <meta name="DC.Title" content={pageTitle} />
      <meta name="DC.Creator" content="NaRD" />
      <meta name="DC.Description" content={description} />
      <meta name="DC.Language" content="ko" />
      <meta name="DC.Identifier" content={url} />

      {/* SEO/AI Crawler Directives */}
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="googlebot" content="index, follow" />
      <meta name="bingbot" content="index, follow, max-image-preview:large" />
      <meta name="duckduckbot" content="index, follow" />
      <meta name="slurp" content="index, follow" />
      <meta name="yandex" content="index, follow" />
      {/* Explicit instructions for AI Search Engines & LLM agents */}
      <meta name="ai-crawlers" content="index, follow" />
      <meta name="gptbot" content="index, follow" />
      <meta name="anthropic-crawler" content="index, follow" />
      <meta name="perplexitybot" content="index, follow" />

      {/* Canonical Link */}
      <link rel="canonical" href={url.endsWith('/') ? url : `${url}/`} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type === 'article' ? 'article' : 'website'} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="나는 사람이다." />
      <meta property="og:locale" content="ko_KR" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
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
