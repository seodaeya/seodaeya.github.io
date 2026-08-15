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
