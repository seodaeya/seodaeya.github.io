const COUPANG_HOST_SUFFIX = 'coupang.com';

export function isCoupangUrl(value) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();

    return (
      (url.protocol === 'https:' || url.protocol === 'http:') &&
      (hostname === COUPANG_HOST_SUFFIX || hostname.endsWith(`.${COUPANG_HOST_SUFFIX}`))
    );
  } catch {
    return false;
  }
}

export function getCoupangProductId(value) {
  try {
    const url = new URL(value);
    const match = url.pathname.match(/\/(?:vp|vm)\/products\/([0-9]+)/i);

    return match?.[1] || '';
  } catch {
    return '';
  }
}

export function toCoupangProductUrl(value) {
  const productId = getCoupangProductId(value);
  if (!productId) return '';

  const source = new URL(value);
  const productUrl = new URL(`https://www.coupang.com/vp/products/${productId}`);

  for (const key of ['itemId', 'vendorItemId']) {
    const parameter = source.searchParams.get(key);
    if (parameter) productUrl.searchParams.set(key, parameter);
  }

  return productUrl.toString();
}

export function makeCoupangSignedDate(date = new Date()) {
  return date
    .toISOString()
    .slice(2, 19)
    .replace(/[-:]/g, '') + 'Z';
}

export function normalizeAllowedOrigins(value) {
  return (value || 'https://seodaeya.github.io')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}
