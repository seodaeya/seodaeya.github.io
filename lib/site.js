/**
 * 사이트 도메인 상수 및 URL 헬퍼.
 *
 * 환경 변수(NEXT_PUBLIC_SITE_URL / NEXT_PUBLIC_SITE_HOST)가 지정되면 우선 적용되며,
 * 기본값은 정식 도메인(https://nardlog.com)을 사용합니다.
 * CommonJS 빌드 스크립트(files/gen/*.js)는 files/site-config.json 을 참조합니다.
 */
export const SITE_HOST = process.env.NEXT_PUBLIC_SITE_HOST || 'nardlog.com';
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || `https://${SITE_HOST}`
).replace(/\/+$/, '');

/** '/about/' 같은 경로를 절대 URL 로 바꾼다. 이미 절대 URL 이면 그대로 반환한다. */
export function absoluteUrl(path = '/') {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
