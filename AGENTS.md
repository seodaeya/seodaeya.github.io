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

## 6. Mandatory Sitemap.xml <lastmod> & Git History Architecture Rule
- **NEVER use shallow clone (`fetch-depth: 1`) in GitHub Actions workflows** (`.github/workflows/*.yml`).
  - **Root Cause & SEO Impact**:
    - `files/gen/generate-sitemap.js` extracts accurate page modification dates using `git log -1 --format="%cs"`.
    - If `actions/checkout` runs with shallow clone (`fetch-depth: 1`), git history for unmodified files is empty. This previously caused all static pages (`/about/`, `/word-train/`, etc.) to fall back to the CI build execution date ("today").
    - Per Google Search Central documentation ("Google uses the <lastmod> value if it's consistently and verifiably accurate"), Googlebot ignores the <lastmod> signal when it is not verifiably accurate or uniformly overwritten to build dates, leading to missed re-crawling of genuinely updated content.
  - **Golden Standard**:
    1. In `.github/workflows/deploy.yml`, always specify `with: fetch-depth: 0` for `actions/checkout@v4`.
    2. In `generate-sitemap.js`, always evaluate `Math.max(gitDate, frontmatterDate)` for posts and videos, and pass stable historical fallback dates (never "today") for static core pages.
    3. Refer to [`docs/sitemap-lastmod-architecture.md`](docs/sitemap-lastmod-architecture.md) for full architecture rationale.

## 7. Mandatory Agent Communication Channel Rule
- **Always read [`docs/agent-channel.md`](docs/agent-channel.md) before starting any task in this repository.**
  - It is the **agent-to-agent communication channel**: it holds the current plan, design decisions, implementation direction, thread board, open issues, and handover state.
  - It contains the **invariants (I-1 ~ I-4)** that must never be violated, and records which changes are committed vs. uncommitted in the working tree.
- **Always append a new entry to section `7. 대화 로그 (append-only)` when finishing a task.**
  - Use the message format defined in section `0-4` (sender → receiver, thread ID, status, summary, evidence, next action, cautions).
  - Update the matching row in section `2. 스레드 보드` at the same time.
  - **Never delete or overwrite existing entries** — corrections must be added as new entries.
- `docs/` is not deployed (it is not under `public/`), so editing the channel never affects the build or the SEO guardrail.
- **The whole `docs/` directory is gitignored (`.gitignore`: `docs/`) as the agent working area, so the channel exists only on the local working copy.**
  - It is never committed, never pushed, and therefore **absent in fresh clones, git worktrees, and CI runners**.
  - So: **if `docs/agent-channel.md` exists, read it first and append to it.** If it does not exist, skip this section and do not create the file unless the user asks.
  - Do not "fix" the missing file by committing it — that is a deliberate decision, not an oversight.
  - Caveat: because the *entire* directory is ignored, a doc under `docs/` that genuinely *should* be committed needs an explicit `git add -f docs/<file>`. Already-tracked docs (`docs/sitemap-lastmod-architecture.md`, `docs/coupang-product-lookup.md`) are unaffected by the rule and keep being tracked normally.

