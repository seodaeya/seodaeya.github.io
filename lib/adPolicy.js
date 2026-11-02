/**
 * 광고(AdSense·제휴) 비노출 경로 정책.
 *
 * 근거: AdSense Program policies — "Placed on any non-content-based page" 는 금지됩니다.
 * (https://support.google.com/adsense/answer/48182)
 * 정책·법적 고지, 문의, 404, 브라우저에서만 동작하는 유틸리티 페이지는
 * 광고 대상 콘텐츠가 아니므로 AdSense 스크립트와 제휴 배너를 모두 제외합니다.
 *
 * 단일 원천: files/ad-policy.json
 * (SEO.js 의 AdSense 스크립트, CoupangSideBanner 의 좌측 배너, verify-seo.js 가드레일이 공통 참조)
 */
import policy from '../files/ad-policy.json';

export const NO_AD_PATHS = policy.noAdPaths;

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
