import {
  getCoupangProductId,
  isCoupangUrl,
  makeCoupangSignedDate,
  normalizeAllowedOrigins,
  toCoupangProductUrl,
} from './helpers.mjs';

const API_HOST = 'https://api-gateway.coupang.com';
const DEFAULT_SEARCH_PATH = '/v2/providers/affiliate_open_api/apis/openapi/v1/products/search';
const CACHE_SECONDS = 60 * 30;

function responseHeaders(request, env) {
  const origin = request.headers.get('Origin');
  const allowedOrigins = normalizeAllowedOrigins(env.ALLOWED_ORIGINS);
  const allowOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8',
    Vary: 'Origin',
  };
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), { status, headers });
}

function error(code, message, status, headers) {
  return json({ ok: false, code, message }, status, headers);
}

async function signHmac(secret, value) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));

  return [...new Uint8Array(signature)]
    .map((part) => part.toString(16).padStart(2, '0'))
    .join('');
}

async function resolveCoupangUrl(rawUrl) {
  if (getCoupangProductId(rawUrl)) return rawUrl;

  const redirectResponse = await fetch(rawUrl, {
    redirect: 'manual',
    headers: {
      'User-Agent': 'CartInAll product lookup/1.0',
    },
  });
  const location = redirectResponse.headers.get('Location');

  if (!location) return '';

  const resolvedUrl = new URL(location, rawUrl).toString();
  return isCoupangUrl(resolvedUrl) ? resolvedUrl : '';
}

async function getPartnerProduct(productId, env) {
  const accessKey = (env.COUPANG_PARTNERS_ACCESS_KEY || '').trim();
  const secretKey = (env.COUPANG_PARTNERS_SECRET_KEY || '').trim();
  const path = env.COUPANG_AFFILIATE_SEARCH_PATH || DEFAULT_SEARCH_PATH;

  const searchUrl = new URL(`${API_HOST}${path}`);
  searchUrl.searchParams.set('keyword', productId);

  const signedDate = makeCoupangSignedDate();
  const queryString = searchUrl.search.slice(1); // 'keyword=...' (without leading '?')
  const message = `${signedDate}GET${path}${queryString}`;
  const signature = await signHmac(secretKey, message);

  const response = await fetch(searchUrl, {
    headers: {
      'Authorization': `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${signedDate}, signature=${signature}`,
      'Content-Type': 'application/json;charset=UTF-8',
    },
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Coupang Partners API returned ${response.status}: ${errText}`);
  }

  const payload = await response.json();
  const product = payload?.data?.productData?.find(
    (item) => String(item.productId) === String(productId),
  ) || payload?.data?.productData?.[0];

  if (!product) return null;

  return {
    productId: String(product.productId),
    title: product.productName || '',
    price: Number(product.productPrice) || 0,
    imageUrl: product.productImage || '',
    categoryName: product.categoryName || '',
  };
}



async function getAliExpressProduct(rawUrl) {
  try {
    let title = '';
    let price = 0;
    let imageUrl = '';
    const itemIdMatch = rawUrl.match(/item\/([0-9]+)\.html/);
    const itemId = itemIdMatch ? itemIdMatch[1] : '';

    // 1. Extract Price from pdp_npi query parameter if present
    try {
      const urlObj = new URL(rawUrl);
      const pdpNpi = urlObj.searchParams.get('pdp_npi') || rawUrl;
      const decodedNpi = decodeURIComponent(pdpNpi);
      const krwMatches = decodedNpi.match(/(?:KRW|₩|%E2%82%A9)[!+]?\s*([0-9,]+)/g);
      if (krwMatches && krwMatches.length > 0) {
        const prices = krwMatches.map(m => parseInt(m.replace(/[^0-9]/g, ''), 10)).filter(n => !isNaN(n) && n > 0);
        if (prices.length > 1) {
          price = Math.min(...prices); // Discount price
        } else if (prices.length === 1) {
          price = prices[0];
        }
      }
    } catch (e) {
      console.warn("AliExpress pdp_npi parse error:", e);
    }

    // 2. Fetch clean HTML for OG title and image
    try {
      const cleanUrl = itemId ? `https://ko.aliexpress.com/item/${itemId}.html` : rawUrl;
      const res = await fetch(cleanUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'ko-KR,ko;q=0.9',
        },
      });
      const html = await res.text();

      const ogTitleMatch = html.match(/<meta property="og:title" content="(.*?)"/);
      if (ogTitleMatch) {
        title = ogTitleMatch[1].replace(/\s*-\s*AliExpress.*$/i, '').trim();
      }

      const ogImgMatch = html.match(/<meta property="og:image" content="(.*?)"/);
      if (ogImgMatch) {
        imageUrl = ogImgMatch[1];
      }
    } catch (e) {
      console.warn("AliExpress HTML fetch error:", e);
    }

    if (!title && itemId) {
      title = `글로벌 직구 상품 #${itemId}`;
    }

    if (!title) return null;

    return {
      title: `[AliExpress] ${title}`,
      price,
      imageUrl,
      categoryName: '가전/DIY',
      canonicalUrl: itemId ? `https://ko.aliexpress.com/item/${itemId}.html` : rawUrl,
    };
  } catch (e) {
    console.error('AliExpress product parse failed:', e);
    return null;
  }
}

async function getNaverProduct(rawUrl) {
  try {
    const urlObj = new URL(rawUrl);
    const cleanUrl = `${urlObj.origin}${urlObj.pathname}`;

    const res = await fetch(cleanUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Accept-Language': 'ko-KR,ko;q=0.9',
      },
    });

    const html = await res.text();

    // 1. Title
    let title = '';
    const nameMatch = html.match(/"name":\s*"([^"]{3,120})"/);
    if (nameMatch && !nameMatch[1].includes('택배') && !nameMatch[1].includes('배송')) {
      title = nameMatch[1];
    }
    if (!title) {
      const ogTitleMatch = html.match(/<meta property="og:title" content="(.*?)"/);
      if (ogTitleMatch) {
        title = ogTitleMatch[1].replace(/^이런 상품 어때요\?\s*/i, '').replace(/\s*:\s*네이버\s*(쇼핑|스마트스토어).*$/i, '').trim();
      }
    }

    // 2. Price (discounted price or sale price)
    let price = 0;
    const discountMatch = html.match(/"discountedSalePrice":\s*([0-9]+)/);
    if (discountMatch) {
      price = parseInt(discountMatch[1], 10);
    } else {
      const saleMatch = html.match(/"salePrice":\s*([0-9]+)/);
      if (saleMatch) price = parseInt(saleMatch[1], 10);
    }

    // 3. Image
    let imageUrl = '';
    const ogImgMatch = html.match(/<meta property="og:image" content="(.*?)"/);
    if (ogImgMatch) imageUrl = ogImgMatch[1];

    if (!title) return null;

    return {
      title,
      price,
      imageUrl,
      categoryName: '생필품/식품',
      canonicalUrl: cleanUrl,
    };
  } catch (e) {
    console.error('Naver product parse failed:', e);
    return null;
  }
}

async function readCachedProduct(cacheKey) {
  const response = await caches.default.match(cacheKey);
  return response ? response.json() : null;
}

function cacheProduct(cacheKey, product) {
  return caches.default.put(
    cacheKey,
    new Response(JSON.stringify(product), {
      headers: {
        'Cache-Control': `public, max-age=${CACHE_SECONDS}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
    }),
  );
}

export default {
  async fetch(request, env, ctx) {
    const headers = responseHeaders(request, env);
    const origin = request.headers.get('Origin');
    const allowedOrigins = normalizeAllowedOrigins(env.ALLOWED_ORIGINS);

    if (origin && !allowedOrigins.includes(origin)) {
      return error('origin_not_allowed', '허용되지 않은 요청 출처입니다.', 403, headers);
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    const requestUrl = new URL(request.url);
    if (request.method !== 'GET') {
      return error('method_not_allowed', 'GET 요청만 지원합니다.', 405, headers);
    }

    const rawUrl = requestUrl.searchParams.get('url')?.trim() || '';

    // Route: AliExpress Handler
    if (rawUrl.includes('aliexpress.com') || rawUrl.includes('aliexpress.us')) {
      const aliData = await getAliExpressProduct(rawUrl);
      if (!aliData || !aliData.title) {
        return error('ali_parse_failed', '알리익스프레스 상품 정보를 불러오지 못했습니다.', 404, headers);
      }
      return json({ ok: true, data: aliData, cached: false }, 200, headers);
    }

    // Route: Naver Shopping Handler (/naver/product or /coupang/product when URL is naver)
    if (requestUrl.pathname === '/naver/product' || (requestUrl.pathname === '/coupang/product' && rawUrl.includes('naver.com'))) {
      if (!rawUrl || !rawUrl.includes('naver.com')) {
        return error('invalid_naver_url', '네이버 쇼핑 또는 스마트스토어 링크를 입력해 주세요.', 400, headers);
      }

      const naverData = await getNaverProduct(rawUrl);
      if (!naverData || !naverData.title) {
        return error('naver_parse_failed', '네이버 상품 정보를 불러오지 못했습니다.', 404, headers);
      }

      return json({ ok: true, data: naverData, cached: false }, 200, headers);
    }

    if (requestUrl.pathname !== '/coupang/product') {
      return error('not_found', '요청한 경로를 찾을 수 없습니다.', 404, headers);
    }

    if (!env.COUPANG_PARTNERS_ACCESS_KEY || !env.COUPANG_PARTNERS_SECRET_KEY) {
      return error('service_not_configured', '쿠팡 상품 조회 서비스가 아직 설정되지 않았습니다.', 503, headers);
    }

    if (!isCoupangUrl(rawUrl)) {
      return error('invalid_coupang_url', '쿠팡 상품 또는 쿠팡 파트너스 링크만 조회할 수 있습니다.', 400, headers);
    }

    let resolvedUrl;
    try {
      resolvedUrl = await resolveCoupangUrl(rawUrl);
    } catch {
      return error('link_resolution_failed', '쿠팡 링크를 상품 주소로 확인하지 못했습니다.', 422, headers);
    }

    const productId = getCoupangProductId(resolvedUrl);
    if (!productId) {
      return error('product_id_not_found', '링크에서 쿠팡 상품 번호를 찾지 못했습니다.', 422, headers);
    }

    const cacheKey = new Request(`${requestUrl.origin}/cache/coupang/${productId}`);
    const cachedProduct = await readCachedProduct(cacheKey);
    if (cachedProduct) {
      return json({ ok: true, data: cachedProduct, cached: true }, 200, headers);
    }

    try {
      const product = await getPartnerProduct(productId, env);
      if (!product?.title || !product.price) {
        return error('product_not_found', '쿠팡 파트너스 API에서 해당 상품 정보를 찾지 못했습니다.', 404, headers);
      }

      const data = {
        ...product,
        canonicalUrl: toCoupangProductUrl(resolvedUrl),
      };
      ctx.waitUntil(cacheProduct(cacheKey, data));

      return json({ ok: true, data, cached: false }, 200, headers);
    } catch (cause) {
      console.error('Coupang product lookup failed', cause);
      return error('provider_error', '쿠팡 상품 정보를 불러오지 못했습니다. (' + cause.message + ')', 502, headers);
    }
  },
};
