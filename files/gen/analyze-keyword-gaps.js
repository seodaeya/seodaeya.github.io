const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

/**
 * Google Search Console(GSC) Queries.csv 기반 키워드 갭 분석기
 * - Vaultaire(Rasty Turek) SEO 전략의 "고노출 · 저클릭(순위 11~50위)" 발굴 루프를
 *   nardlog.com 정적 블로그 구조에 맞게 경량화한 도구입니다.
 *
 * 사용법:
 *   node files/gen/analyze-keyword-gaps.js [path/to/Queries.csv]
 *   (인자를 생략하면 files/gsc-queries.csv 를 기본 탐색합니다)
 */

function parseCsvRecords(rawCsv) {
  const records = [];
  let row = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < rawCsv.length; i += 1) {
    const ch = rawCsv[i];
    if (ch === '"') {
      if (inQuotes && rawCsv[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      row.push(cur.trim());
      cur = '';
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && rawCsv[i + 1] === '\n') i += 1;
      row.push(cur.trim());
      if (row.some((cell) => cell.length > 0)) {
        records.push(row);
      }
      row = [];
      cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur.length > 0 || row.length > 0) {
    row.push(cur.trim());
    if (row.some((cell) => cell.length > 0)) {
      records.push(row);
    }
  }
  return records;
}

function normalizeHeader(name) {
  return name.replace(/^\uFEFF/, '').trim().toLowerCase();
}

function loadExistingPosts() {
  const postsDir = path.join(process.cwd(), 'files/posts');
  if (!fs.existsSync(postsDir)) return [];
  return fs
    .readdirSync(postsDir)
    .filter((fn) => fn.endsWith('.md'))
    .map((filename) => {
      const raw = fs.readFileSync(path.join(postsDir, filename), 'utf8');
      const { data } = matter(raw);
      const tags = Array.isArray(data.tags) ? data.tags.join(' ') : '';
      const searchable = `${data.title || ''} ${tags} ${data.excerpt || ''}`.toLowerCase();
      return {
        filename,
        title: data.title || filename,
        searchable,
      };
    });
}

function findMatchingPosts(query, posts) {
  const tokens = query
    .toLowerCase()
    .split(/[\s/+·,]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
  if (tokens.length === 0) return [];

  return posts
    .map((post) => {
      const hits = tokens.filter((tk) => post.searchable.includes(tk)).length;
      return { post, ratio: hits / tokens.length, hits };
    })
    .filter((item) => item.hits >= 1 && item.ratio >= 0.5)
    .sort((a, b) => b.ratio - a.ratio || b.hits - a.hits)
    .slice(0, 2)
    .map((item) => item.post);
}

function parseNumber(val) {
  if (!val) return 0;
  return Number(String(val).replace(/[%,"\s]/g, '')) || 0;
}

function main() {
  const targetArg = process.argv[2];
  const csvPath = targetArg
    ? path.resolve(process.cwd(), targetArg)
    : path.join(process.cwd(), 'files/gsc-queries.csv');

  if (!fs.existsSync(csvPath)) {
    console.log('ℹ️ [Keyword Gap Analyzer] GSC CSV 파일이 아직 없습니다:', csvPath);
    console.log('');
    console.log('사용 방법:');
    console.log('1. Google Search Console → 실적 → 검색 결과(최근 28일) → 우측 상단 [내보내기] → CSV 다운로드');
    console.log('2. 압축 해제 후 Queries.csv 파일을 files/gsc-queries.csv 로 저장 (또는 경로를 인자로 전달)');
    console.log('3. 실행: npm run seo:gaps  (또는 node files/gen/analyze-keyword-gaps.js <CSV경로>)');
    process.exit(0);
  }

  const rawCsv = fs.readFileSync(csvPath, 'utf8');
  const records = parseCsvRecords(rawCsv);
  if (records.length < 2) {
    console.log('⚠️ CSV 데이터가 비어 있습니다.');
    process.exit(0);
  }

  const headers = records[0].map(normalizeHeader);
  const idxQuery = headers.findIndex((h) => h.includes('quer') || h.includes('검색어'));
  const idxClicks = headers.findIndex((h) => h.includes('click') || h.includes('클릭'));
  const idxImpr = headers.findIndex((h) => h.includes('impr') || h.includes('노출'));
  const idxCtr = headers.findIndex((h) => h.includes('ctr'));
  const idxPos = headers.findIndex((h) => h.includes('pos') || h.includes('순위'));

  if (idxQuery === -1 || idxImpr === -1 || idxPos === -1) {
    console.error('❌ GSC Queries CSV 헤더를 인식하지 못했습니다:', headers);
    process.exit(1);
  }

  const posts = loadExistingPosts();
  const rows = records.slice(1).map((cols) => {
    const query = cols[idxQuery] || '';
    const clicks = idxClicks !== -1 ? parseNumber(cols[idxClicks]) : 0;
    const impressions = parseNumber(cols[idxImpr]);
    const ctr = idxCtr !== -1 ? parseNumber(cols[idxCtr]) : 0;
    const position = parseNumber(cols[idxPos]);
    return { query, clicks, impressions, ctr, position };
  });

  const maxImpr = Math.max(...rows.map((r) => r.impressions), 0);
  const isEarlyDomain = rows.length < 50 || maxImpr < 20;
  const minImpr = isEarlyDomain ? 1 : 10;
  const maxPos = isEarlyDomain ? 200 : 55;

  // [A] 1페이지(1~10위) 진입했으나 클릭이 저조한 제목/CTR 개선 대상
  const ctrOpportunities = rows
    .filter((r) => r.query && r.position > 0 && r.position <= 10.4 && r.impressions >= minImpr && r.ctr < 3)
    .sort((a, b) => b.impressions - a.impressions || a.position - b.position);

  // [B] 2페이지 이후(11위~)에 걸려있는 순위 상승/신규 공략 대상
  const gaps = rows
    .filter((r) => r.query && r.position >= 10.5 && r.position <= maxPos && r.impressions >= minImpr && r.ctr < 3)
    .sort((a, b) => b.impressions - a.impressions || a.position - b.position);

  const refreshCandidates = [];
  const newTopicCandidates = [];

  for (const item of gaps) {
    const matched = findMatchingPosts(item.query, posts);
    if (matched.length > 0) {
      refreshCandidates.push({ ...item, matched });
    } else {
      newTopicCandidates.push(item);
    }
  }

  console.log('======================================================================');
  console.log(
    `🔍 [GSC Keyword Gap Report] 총 ${rows.length}개 쿼리 (${isEarlyDomain ? '초기 도메인 전수 모드: 노출≥1' : '표준 모드: 노출≥10'})`
  );
  console.log('======================================================================\n');

  console.log('🎯 [1] 1페이지(1~10위) CTR/제목 개선 추천 (노출 대비 클릭 확보 가능)');
  if (ctrOpportunities.length === 0) {
    console.log('  - 해당 조건의 대상이 없습니다.\n');
  } else {
    ctrOpportunities.slice(0, 10).forEach((c, i) => {
      const matched = findMatchingPosts(c.query, posts);
      console.log(
        `  ${String(i + 1).padStart(2, '0')}. "${c.query}" | 노출 ${c.impressions} | 클릭 ${c.clicks} | 순위 ${c.position.toFixed(1)}`
      );
      matched.forEach((m) => console.log(`      ↳ 매칭 글: ${m.filename} (${m.title})`));
    });
    console.log('');
  }

  console.log(`📌 [2] 기존 글 보강 추천 (11~${maxPos}위권 · 본문 H2/요약/내부링크 보강 대상)`);
  if (refreshCandidates.length === 0) {
    console.log('  - 해당 조건의 보강 대상이 없습니다.\n');
  } else {
    refreshCandidates.slice(0, 10).forEach((c, i) => {
      console.log(
        `  ${String(i + 1).padStart(2, '0')}. "${c.query}" | 노출 ${c.impressions} | 클릭 ${c.clicks} | 순위 ${c.position.toFixed(1)}`
      );
      c.matched.forEach((m) => console.log(`      ↳ 매칭 글: ${m.filename} (${m.title})`));
    });
    console.log('');
  }

  console.log('🆕 [3] 신규 글감 추천 (기존 글과 매칭 약함 · 고노출 저클릭 TOP 15)');
  if (newTopicCandidates.length === 0) {
    console.log('  - 해당 조건의 신규 글감 후보가 없습니다.\n');
  } else {
    newTopicCandidates.slice(0, 15).forEach((c, i) => {
      console.log(
        `  ${String(i + 1).padStart(2, '0')}. "${c.query}" | 노출 ${c.impressions} | 클릭 ${c.clicks} | CTR ${c.ctr}% | 순위 ${c.position.toFixed(1)}`
      );
    });
    console.log('');
  }
}

main();
