const fs = require('fs');
const path = require('path');

const siteUrl = 'https://seodaeya.github.io';
const outDir = path.join(process.cwd(), 'out');
const sitemapPath = path.join(process.cwd(), 'public/sitemap.xml');

function walkHtmlFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (entry === '_next') continue;
      results = results.concat(walkHtmlFiles(fullPath));
    } else if (entry.endsWith('.html')) {
      if (entry.startsWith('google')) continue;
      results.push(fullPath);
    }
  }
  return results;
}

function verifySEO() {
  const errors = [];

  if (!fs.existsSync(outDir)) {
    console.error('❌ [SEO Guardrail] out/ 디렉토리가 존재하지 않습니다. next build 이후 실행하세요.');
    process.exit(1);
  }

  const htmlFiles = walkHtmlFiles(outDir);
  const robotsByRelPath = new Map();
  const canonicalByRelPath = new Map();

  // 1. 전수 HTML 메타데이터 검사 (Canonical 단일성, Trailing Slash, Redirect 페이지 noindex, hreflang 충돌)
  for (const file of htmlFiles) {
    const relPath = path.relative(outDir, file).split(path.sep).join('/');
    const html = fs.readFileSync(file, 'utf8');

    // Canonical 태그 개수 및 형식 검증
    const canonicalMatches = [...html.matchAll(/<link\s+rel="canonical"\s+href="([^"]+)"/g)];
    if (canonicalMatches.length === 0) {
      errors.push(`[Canonical 누락] ${relPath}: <link rel="canonical"> 태그가 없습니다.`);
    } else if (canonicalMatches.length > 1) {
      errors.push(`[Canonical 중복] ${relPath}: <link rel="canonical"> 태그가 ${canonicalMatches.length}개 중복 선언되었습니다.`);
    } else {
      const canonicalHref = canonicalMatches[0][1];
      canonicalByRelPath.set(relPath, canonicalHref);
      if (!canonicalHref.startsWith(siteUrl)) {
        errors.push(`[Canonical 도메인 불일치] ${relPath}: ${canonicalHref}`);
      }
      if (!canonicalHref.endsWith('/')) {
        errors.push(`[Canonical 슬래시(/) 누락] ${relPath}: ${canonicalHref} (trailingSlash: true 환경에서는 반드시 '/'로 끝나야 301 리디렉션 충돌이 발생하지 않습니다)`);
      }
    }

    // Robots 메타 태그 확인
    const robotsMatch = html.match(/<meta\s+name="robots"\s+content="([^"]+)"/);
    const robotsContent = robotsMatch ? robotsMatch[1] : '';
    robotsByRelPath.set(relPath, robotsContent);

    // 단축 URL 리디렉션 페이지 (예: posts/20260805-2/index.html) 검증
    const isShortRedirectPage = /^(posts|videos)\/\d{8}-\d+\/index\.html$/.test(relPath);
    if (isShortRedirectPage) {
      if (!robotsContent.includes('noindex')) {
        errors.push(`[리디렉션 페이지 index 노출] ${relPath}: 단축 URL 리디렉션 페이지는 중복 색인 방지를 위해 반드시 noindex여야 합니다. (현재: ${robotsContent})`);
      }
      const refreshMatch = html.match(/http-equiv="refresh"\s+content="0;url=([^"]+)"/i);
      if (refreshMatch && !refreshMatch[1].endsWith('/')) {
        errors.push(`[리디렉션 타깃 슬래시(/) 누락] ${relPath}: meta refresh url(${refreshMatch[1]})이 '/'로 끝나지 않습니다.`);
      }
    }

    // 허위 다국어 hreflang 충돌 검증 (동일 URL에 en/ja 선언 금지)
    if (/<link\s+rel="alternate"\s+hrefLang="(en|ja)"/i.test(html)) {
      errors.push(`[Hreflang 다국어 자기참조 충돌] ${relPath}: 단일 한국어 URL에 en/ja hreflang이 중복 선언되어 있습니다.`);
    }
  }

  // 2. Sitemap.xml 무결성 검사 (noindex 포함 여부, Trailing Slash, Lastmod 일괄 덮어쓰기 방지)
  if (!fs.existsSync(sitemapPath)) {
    errors.push(`[Sitemap 누락] public/sitemap.xml 파일이 존재하지 않습니다.`);
  } else {
    const sitemapXml = fs.readFileSync(sitemapPath, 'utf8');
    const urlBlocks = [...sitemapXml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => m[1]);
    const lastmodSet = new Set();
    const sitemapLocs = [];

    for (const block of urlBlocks) {
      const locMatch = block.match(/<loc>([^<]+)<\/loc>/);
      const lastmodMatch = block.match(/<lastmod>([^<]+)<\/lastmod>/);
      if (!locMatch) continue;

      const loc = locMatch[1].trim();
      sitemapLocs.push(loc);

      if (!loc.endsWith('/')) {
        errors.push(`[Sitemap 슬래시(/) 누락] ${loc}: 사이트맵의 모든 URL은 '/'로 끝나야 합니다.`);
      }

      const relUrlPath = loc.replace(siteUrl, '').replace(/^\//, '');
      const expectedHtmlRelPath = relUrlPath ? `${relUrlPath}index.html` : 'index.html';

      if (!robotsByRelPath.has(expectedHtmlRelPath)) {
        errors.push(`[Sitemap 데드 링크] ${loc} -> out/${expectedHtmlRelPath} 파일이 존재하지 않습니다.`);
      } else {
        const pageRobots = robotsByRelPath.get(expectedHtmlRelPath) || '';
        if (pageRobots.includes('noindex')) {
          errors.push(`[Sitemap 내 noindex 페이지 포함] ${loc}: noindex 설정된 페이지가 사이트맵에 포함되어 있습니다.`);
        }
        const pageCanonical = canonicalByRelPath.get(expectedHtmlRelPath);
        if (pageCanonical && pageCanonical !== loc) {
          errors.push(`[Sitemap <-> Canonical 불일치] ${expectedHtmlRelPath}: sitemap(${loc}) !== canonical(${pageCanonical})`);
        }
      }

      if (lastmodMatch) {
        const lastmod = lastmodMatch[1].trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(lastmod)) {
          errors.push(`[Sitemap lastmod 형식 오류] ${loc}: ${lastmod}`);
        }
        lastmodSet.add(lastmod);
      }
    }

    if (urlBlocks.length > 10 && lastmodSet.size === 1) {
      errors.push(`[Sitemap lastmod 전체 동일 날짜 오염] 사이트맵 내 ${urlBlocks.length}개 URL의 <lastmod>가 모두 단일 날짜(${[...lastmodSet][0]})로 고정되어 있습니다.`);
    }

    // 3. 고아 페이지(Orphan Page) 검증: 메인(/) 및 카테고리(/categories/) 정적 HTML에서 모든 색인 대상 글로 내부 링크가 연결되어 있는지 확인
    const indexHtml = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
    const categoriesHtml = fs.readFileSync(path.join(outDir, 'categories/index.html'), 'utf8');

    const extractInternalPaths = (html) =>
      new Set(
        [...html.matchAll(/href="(\/[^"#?]*)"/g)].map((m) => {
          const p = m[1];
          return p.endsWith('/') ? p : `${p}/`;
        })
      );

    const homeLinks = extractInternalPaths(indexHtml);
    const categoryLinks = extractInternalPaths(categoriesHtml);

    for (const loc of sitemapLocs) {
      const pathOnly = loc.replace(siteUrl, '');
      if (pathOnly.startsWith('/posts/') || pathOnly.startsWith('/videos/')) {
        if (!homeLinks.has(pathOnly)) {
          errors.push(`[홈페이지(/) 내부 링크 누락 - 고아 페이지 위험] ${pathOnly} 링크가 out/index.html 정적 DOM에 존재하지 않습니다.`);
        }
        if (!categoryLinks.has(pathOnly)) {
          errors.push(`[카테고리(/categories/) 내부 링크 누락] ${pathOnly} 링크가 out/categories/index.html 정적 DOM에 존재하지 않습니다.`);
        }
      }
    }
  }

  // 4. CSS 초기 투명도(opacity: 0) 차단 검증 (.page-reveal)
  const cssDir = path.join(outDir, '_next/static/css');
  if (fs.existsSync(cssDir)) {
    for (const cssFile of fs.readdirSync(cssDir)) {
      if (!cssFile.endsWith('.css')) continue;
      const cssContent = fs.readFileSync(path.join(cssDir, cssFile), 'utf8');
      if (/\.page-reveal\s*\{[^}]*opacity\s*:\s*0\b/.test(cssContent)) {
        errors.push(`[CSS 초기 가시성 차단] ${cssFile}: .page-reveal에 opacity: 0이 포함되어 구글봇 렌더링 스냅샷에서 본문이 누락될 수 있습니다.`);
      }
    }
  }

  if (errors.length > 0) {
    console.error(`\n🚨 [SEO Guardrail] 총 ${errors.length}건의 색인/SEO 결함이 감지되었습니다:\n`);
    errors.forEach((err, idx) => console.error(`  ${idx + 1}. ${err}`));
    process.exit(1);
  }

  console.log(`✅ [SEO Guardrail] 전수 검증 통과! (총 ${htmlFiles.length}개 HTML 페이지, Canonical/TrailingSlash/Sitemap/내부링크 무결성 100% 정상)`);
}

verifySEO();
