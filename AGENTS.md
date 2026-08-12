# Agent Customization & Bolding Rules

## Mandatory Korean Markdown Bolding Rule
1. **NEVER use raw markdown double asterisks (`**bold text**`) in Korean markdown files** (`files/posts/*.md` and `files/videos/*.md`).
2. Korean particles and quotes (e.g. `**드래그 앤 드롭(Drag & Drop)**`, `**"문장"**입니다`) fail regex word-boundary parsing in `marked`, rendering ugly raw `**` text to users.
3. **ALWAYS use HTML `<strong>` and `</strong>` tags directly** for all bolding in Korean markdown files (e.g., `<strong>드래그 앤 드롭(Drag & Drop)</strong>`).
4. The automated generator script `files/gen/generate-latest-posts.js` includes a fail-safe that converts any raw `**` to `<strong>` tags during data generation.
