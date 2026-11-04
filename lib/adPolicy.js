/**
 * 광고(AdSense·제휴) 비노출 경로 정책.
 *
 * 근거: AdSense Program policies — "Placed on any non-content-based page" 는 금지됩니다.
 * (https://support.google.com/adsense/answer/48182)
 * 정책·법적 고지, 문의, 404, 브라우저에서만 동작하는 유틸리티 페이지는
 * 광고 대상 콘텐츠가 아니므로 AdSense 스크립트와 제휴 배너를 모두 제외합니다.
 *
 * 예외: `affiliateAllowedPaths` 에 등록한 경로는 AdSense 는 계속 차단하되
 * 쿠팡 파트너스 배너만 노출합니다. (예: `/edu/` — 제휴 배너만 허용)
 *
 * 단일 원천: files/ad-policy.json
 * (SEO.js 의 AdSense 스크립트, CoupangSideBanner 의 좌측 배너, verify-seo.js 가드레일이 공통 참조)
 */
import policy from '../files/ad-policy.json';

export const NO_AD_PATHS = policy.noAdPaths;
export const AFFILIATE_ALLOWED_PATHS = policy.affiliateAllowedPaths || [];

/** 절대 URL·상대 경로를 trailing slash 형태의 pathname 으로 정규화합니다. */
export function normalizePath(input) {
  if (!input || typeof input !== 'string') return '/';
  let path = input.trim();
  if (/^https?:\/\//i.test(path)) {
    try {
      path = new URL(path).pathname;
    } catch (e) {
      path = '/';
    }
  }
  if (!path.startsWith('/')) path = `/${path}`;
  if (path.length > 1 && !path.endsWith('/')) path = `${path}/`;
  return path;
}

export function isNoAdsPath(input) {
  return NO_AD_PATHS.includes(normalizePath(input));
}

/**
 * 제휴(쿠팡) 배너 비노출 여부. `affiliateAllowedPaths` 예외를 적용합니다.
 * AdSense 노출 여부는 `isNoAdsPath` 를 그대로 사용합니다.
 */
export function isNoAffiliatePath(input) {
  const path = normalizePath(input);
  if (AFFILIATE_ALLOWED_PATHS.includes(path)) return false;
  return NO_AD_PATHS.includes(path);
}
