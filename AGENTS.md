# Agent Customization & Markdown Formatting Rules

## 1. Mandatory Korean Markdown Bolding Rule
- **NEVER use raw markdown double asterisks (`**bold text**`) in Korean markdown files** (`files/posts/*.md` and `files/videos/*.md`).
- Korean particles and quotes (e.g. `**드래그 앤 드롭(Drag & Drop)**`, `**"문장"**입니다`) fail regex word-boundary parsing in `marked`, rendering ugly raw `**` text to users.
- **ALWAYS use HTML `<strong>` and `</strong>` tags directly** for all bolding in Korean markdown files (e.g., `<strong>텍스트</strong>`).

## 2. Mandatory Tilde (~) Strikethrough Prevention Rule
- **NEVER write unescaped tildes (`~`) in markdown body text** (e.g., `$2~$3`, `15~20개`, `수일~4주`).
- Markdown / GFM parsers interpret multiple tildes (`~text~` or `~~text~~`) as strikethrough tags (`<del>`), turning text between tildes into struck-through text (e.g. `$2~$3/$10~$15` -> `$3/$10` struck through).
- **ALWAYS escape tildes as `\~`** (e.g., `$2\~$3 / $10\~$15`, `15\~20개`, `수일\~4주`).

## 3. Automatic Build-Time Fail-Safes
- The automated generator script `files/gen/generate-latest-posts.js` runs automatic regex passes during data generation to:
  1. Convert any raw `**` to `<strong>` tags.
  2. Escape any unescaped `~` into `\~`.

## 4. Mandatory No-Raw-LaTeX / MathJax Rule
- The blog markdown renderer uses standard `marked` without KaTeX/MathJax support.
- **NEVER write raw LaTeX math syntax** (e.g. `$$...$$`, `$...$`, `\text{}`, `\times`, `\rightarrow`) in markdown posts (`files/posts/*.md` and `files/videos/*.md`).
- **ALWAYS use standard markdown and unicode characters**:
  - Formulas: Blockquotes with bold text (e.g. `> <strong>필요 커넥션 수 = RPS × 처리 시간</strong>`).
  - Mathematical symbols: Unicode `×`, `÷`, `➔`, `+`, `-`, `=`.

## 5. Mandatory SEO/GEO Title Length Rule (Max 44 Characters)
- **NEVER write post titles exceeding 44 characters** in markdown frontmatter (`files/posts/*.md` and `files/videos/*.md`).
- **Root Cause & Calculation**:
  - The site suffix is ` | 여전히, 나는 사람이다.` (**16 characters**).
  - Search engines (Google SERP, Naver, Bing) and SEO/GEO inspection tools enforce a strict **60-character limit** (approx. 580~600px).
  - If a title exceeds 44 characters (`44 + 16 > 60`), the final `<title>` tag exceeds the 60-character threshold, causing search result snippet truncation (`...`) and triggering the error: `❌ 오류: 너무 긴 제목` (Too Long Title).
- **Golden Standard**:
  - Keep raw post titles concise and impact-driven within **32 ~ 42 characters** (optimal: **35 ~ 38 characters**).
  - Prioritize 3~4 core search keywords (`인물/기업`, `핵심 주제`, `분석/가이드`) while pruning redundant English subtitles.

