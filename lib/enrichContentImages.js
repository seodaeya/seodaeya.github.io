const path = require('path');
const { getImageSize } = require('./imageSize');

/**
 * 마크다운이 렌더링한 HTML 안의 로컬 <img> 태그에
 * 실제 픽셀 크기(width/height)를 주입해 레이아웃 시프트(CLS)를 방지한다.
 *
 * - 마크다운 본문 이미지는 `.content img { max-width:100%; height:auto }` 만 적용되어
 *   로드 전까지 높이가 0이므로, 이미지가 도착하는 순간 아래 내용이 밀린다(CLS).
 * - width/height 속성을 넣으면 브라우저가 종횡비를 미리 알 수 있어 공간을 예약한다.
 *   CSS의 `height:auto` 와 충돌하지 않고 종횡비 계산에만 쓰인다.
 *
 * 외부 URL(YouTube 썸네일 등)은 크기를 알 수 없으므로 그대로 둔다.
 * (빌드 타임 getStaticProps 에서만 호출 — 클라이언트 번들에는 포함되지 않음)
 */

const IMG_TAG = /<img\b[^>]*>/gi;
const SRC_ATTR = /\bsrc\s*=\s*["']([^"']+)["']/i;
const HAS_WIDTH = /\bwidth\s*=/i;
const HAS_HEIGHT = /\bheight\s*=/i;

const enrichLocalImageDimensions = (html, publicDir) => {
  if (!html || !html.includes('<img')) return html;
  const base = publicDir || path.join(process.cwd(), 'public');

  return html.replace(IMG_TAG, (tag) => {
    if (HAS_WIDTH.test(tag) && HAS_HEIGHT.test(tag)) return tag;

    const srcMatch = tag.match(SRC_ATTR);
    if (!srcMatch) return tag;

    const src = srcMatch[1].trim().split(/[?#]/)[0];
    if (!src.startsWith('/')) return tag; // 외부 이미지 — 크기 미상

    const absPath = path.join(base, src.replace(/^\/+/, ''));
    const size = getImageSize(absPath);
    if (!size) return tag;

    const attrs = [];
    if (!HAS_WIDTH.test(tag)) attrs.push(`width="${size.width}"`);
    if (!HAS_HEIGHT.test(tag)) attrs.push(`height="${size.height}"`);
    if (!attrs.length) return tag;

    return tag.replace(/^<img/i, `<img ${attrs.join(' ')}`);
  });
};

module.exports = { enrichLocalImageDimensions };
