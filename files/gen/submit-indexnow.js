const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');
const matter = require('gray-matter');

/**
 * IndexNow 제출 스크립트 (Bing / Yandex / Naver / Seznam.cz / Yep)
 *
 * ⚠️ Google 은 IndexNow 를 지원하지 않는다. Google 색인 가속은 Search Console 수동 요청만 가능.
 *
 * 기본 동작은 "변경분만 제출"이다. 매 배포마다 전량을 제출하면
 * 검색엔진에 노이즈가 쌓여 신호 가치가 떨어지므로, 직전 커밋과 diff 하여
 * 실제로 바뀐 콘텐츠 URL 만 보낸다.
 *
 * 사용법:
 *   node files/gen/submit-indexnow.js                     # HEAD~1..HEAD 변경분
 *   node files/gen/submit-indexnow.js --base <ref>        # 특정 기준점 이후 변경분
 *   node files/gen/submit-indexnow.js --include-listing   # 변경 시 목록 페이지도 포함
 *   node files/gen/submit-indexnow.js --all               # 전량 제출 (수동 복구용)
 *   node files/gen/submit-indexnow.js --dry-run           # 네트워크 전송 없이 목록만 확인
 */

const host = 'seodaeya.github.io';
const apiKey = 'd757d9f030cc4789bb023a4b38e3ccf4';
const keyLocation = `https://${host}/${apiKey}.txt`;

const root = path.join(__dirname, '../..');

// 콘텐츠 디렉터리 → URL 경로 매핑
const contentDirs = [
  { dir: 'files/posts', urlBase: 'posts' },
  { dir: 'files/videos', urlBase: 'videos' },
];

// 콘텐츠 변경 시 함께 갱신되는 목록/집계 페이지
const listingPages = [
  `https://${host}/`,
  `https://${host}/categories/`,
  `https://${host}/ranking/`,
];

/* ────────────────────────── CLI 파싱 ────────────────────────── */
const args = process.argv.slice(2);
const hasFlag = (flag) => args.includes(flag);
const getOpt = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const submitAll = hasFlag('--all');
const dryRun = hasFlag('--dry-run');
const includeListing = hasFlag('--include-listing');
const baseRef = getOpt('--base', 'HEAD~1');

/* ────────────────────────── 유틸 ────────────────────────── */
const isIndexable = (absPath) => {
  try {
    return matter(fs.readFileSync(absPath, 'utf8')).data.noindex !== true;
  } catch (e) {
    return true;
  }
};

const urlForContentFile = (relPath) => {
  for (const { dir, urlBase } of contentDirs) {
    if (relPath.startsWith(`${dir}/`) && relPath.endsWith('.md')) {
      return `https://${host}/${urlBase}/${path.basename(relPath, '.md')}/`;
    }
  }
  return null;
};

const getAllContentFiles = () => {
  const files = [];
  for (const { dir } of contentDirs) {
    const absDir = path.join(root, dir);
    if (!fs.existsSync(absDir)) continue;
    for (const name of fs.readdirSync(absDir)) {
      if (name.endsWith('.md')) files.push(path.posix.join(dir, name));
    }
  }
  return files;
};

/**
 * 직전 커밋과의 diff 로 변경된 콘텐츠 파일 목록을 얻는다.
 * 실패(shallow clone, 존재하지 않는 ref 등)하면 null 을 반환한다.
 */
const getChangedContentFiles = () => {
  const paths = contentDirs.map((c) => c.dir).join(' ');
  try {
    const out = execSync(
      `git -c core.quotepath=false diff --name-only --diff-filter=ACMR --no-renames ${baseRef}..HEAD -- ${paths}`,
      { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }
    ).toString();
    return out
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
  } catch (e) {
    return null;
  }
};

const buildUrlList = () => {
  let files;
  let mode;

  if (submitAll) {
    files = getAllContentFiles();
    mode = '전량 제출 (--all)';
  } else {
    files = getChangedContentFiles();
    if (files === null) {
      console.warn(
        `  ⚠️  git diff 실패 (base=${baseRef}). shallow clone 이거나 유효하지 않은 ref 입니다.`
      );
      console.warn('      검색엔진 오신호를 막기 위해 제출을 생략합니다.');
      return { urls: [], mode: `변경분 조회 실패 (${baseRef})`, skipped: 0 };
    }
    mode = `변경분 제출 (${baseRef}..HEAD)`;
  }

  const urls = [];
  const seen = new Set();
  let skipped = 0;

  for (const rel of files) {
    const abs = path.join(root, rel);
    if (!fs.existsSync(abs)) {
      skipped += 1; // 삭제된 파일
      continue;
    }
    if (!isIndexable(abs)) {
      skipped += 1; // noindex 콘텐츠는 색인 대상 아님
      continue;
    }
    const url = urlForContentFile(rel);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    urls.push(url);
  }

  if (!submitAll && includeListing && urls.length > 0) {
    for (const url of listingPages) {
      if (seen.has(url)) continue;
      seen.add(url);
      urls.push(url);
    }
  }

  return { urls, mode, skipped };
};

/* ────────────────────────── 메인 ────────────────────────── */
const main = () => {
  const { urls, mode, skipped } = buildUrlList();

  console.log(`📡 IndexNow — ${mode}`);
  console.log(`   변경 콘텐츠 파일에서 제외(삭제/noindex): ${skipped}건`);
  console.log(`   제출 대상 URL: ${urls.length}개`);
  urls.forEach((u) => console.log(`     · ${u}`));

  if (urls.length === 0) {
    console.log('   ✅ 제출할 변경 URL 이 없습니다. 종료.');
    return;
  }

  if (dryRun) {
    console.log('   🔍 --dry-run: 네트워크 전송을 생략했습니다.');
    return;
  }

  const payload = JSON.stringify({ host, key: apiKey, keyLocation, urlList: urls });

  const options = {
    hostname: 'api.indexnow.org',
    port: 443,
    path: '/indexnow',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': Buffer.byteLength(payload),
    },
  };

  const req = https.request(options, (res) => {
    console.log(`   응답: ${res.statusCode} ${res.statusMessage}`);
    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });
    res.on('end', () => {
      if (res.statusCode === 200 || res.statusCode === 202) {
        console.log('   ✅ IndexNow 제출 성공 (Bing / Yandex / Naver 등).');
      } else {
        console.error(`   ❌ IndexNow 제출 실패: ${body}`);
        process.exitCode = 1;
      }
    });
  });

  req.on('error', (e) => {
    console.error(`   ❌ 요청 오류: ${e.message}`);
    process.exitCode = 1;
  });

  req.write(payload);
  req.end();
};

main();
