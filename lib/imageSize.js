const fs = require('fs');

/**
 * 이미지 파일 헤더만 읽어 실제 픽셀 크기를 반환하는 경량 유틸.
 * 외부 의존성 없이 PNG / JPEG / GIF / WebP 를 지원한다.
 * (빌드 타임 getStaticProps 에서만 사용 — 클라이언트 번들에는 포함되지 않음)
 */

const cache = new Map();

const readPng = (buf) => {
  if (buf.length < 24) return null;
  // PNG 시그니처: 89 50 4E 47 0D 0A 1A 0A
  if (buf.readUInt32BE(0) !== 0x89504e47) return null;
  if (buf.readUInt32BE(4) !== 0x0d0a1a0a) return null;
  // IHDR 청크: 16바이트 오프셋에 width(4) / height(4) 빅엔디언
  if (buf.toString('ascii', 12, 16) !== 'IHDR') return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
};

const readJpeg = (buf) => {
  if (buf.length < 4) return null;
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return null; // SOI
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marker = buf[i + 1];
    if (marker === 0xff) {
      i += 1;
      continue;
    }
    // 패딩/재시작 마커는 길이 필드가 없음
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) {
      i += 2;
      continue;
    }
    const len = buf.readUInt16BE(i + 2);
    if (len < 2) return null;
    // SOF0~SOF15 중 DHT(0xC4)/JPG(0xC8)/DAC(0xCC) 제외
    const isSof =
      marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSof) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    i += 2 + len;
  }
  return null;
};

const readGif = (buf) => {
  if (buf.length < 10) return null;
  if (buf.toString('ascii', 0, 3) !== 'GIF') return null;
  return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
};

const readWebp = (buf) => {
  if (buf.length < 30) return null;
  if (buf.toString('ascii', 0, 4) !== 'RIFF') return null;
  if (buf.toString('ascii', 8, 12) !== 'WEBP') return null;
  const fourcc = buf.toString('ascii', 12, 16);
  if (fourcc === 'VP8X') {
    return {
      width: 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16)),
      height: 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16)),
    };
  }
  if (fourcc === 'VP8 ') {
    return {
      width: buf.readUInt16LE(26) & 0x3fff,
      height: buf.readUInt16LE(28) & 0x3fff,
    };
  }
  if (fourcc === 'VP8L') {
    const b0 = buf[21];
    const b1 = buf[22];
    const b2 = buf[23];
    const b3 = buf[24];
    return {
      width: 1 + (((b1 & 0x3f) << 8) | b0),
      height: 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)),
    };
  }
  return null;
};

/**
 * @param {string} absPath 절대 경로
 * @returns {{width:number,height:number}|null}
 */
const getImageSize = (absPath) => {
  if (!absPath) return null;
  if (cache.has(absPath)) return cache.get(absPath);
  let size = null;
  try {
    const buf = fs.readFileSync(absPath);
    size = readPng(buf) || readJpeg(buf) || readGif(buf) || readWebp(buf);
  } catch (e) {
    size = null;
  }
  if (size && (!size.width || !size.height)) size = null;
  cache.set(absPath, size);
  return size;
};

module.exports = { getImageSize };
