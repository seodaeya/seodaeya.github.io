# Blog Renewal for seodaeya.github.io

Renewing the blog at [seodaeya.github.io](https://seodaeya.github.io/) into a modern, visually stunning, responsive site designed to promote both blog content and YouTube videos. The renewal focuses heavily on:
1. **Trendy Design**: A premium dark-mode theme utilizing glassmorphism, neon violet/teal gradients, smooth micro-animations, and clean typography (Inter & Outfit).
2. **YouTube & Blog Promotion**: Cross-promotes content using featured cards, embedded players, and links to the user's YouTube channel (`https://www.youtube.com/@Na.R.D.`).
3. **SEO & AI Search Optimization**: Uses semantic HTML5, descriptive meta-tags, OpenGraph tags, and JSON-LD structured data (`BlogPosting`, `VideoObject`, `Person`, `WebSite`) to make the site highly indexable by search engines and modern AI crawlers (Perplexity, OpenAI, Gemini).
4. **Human Touch Tagline**: Features the bold, impact-heavy tagline `"나는 사람이다."` (with subtitle `"AI 시대에 남기는 지극히 인간적인 기록들"`) to contrast with the high-tech AI era.

---

## User Review Required

> [!IMPORTANT]
> **Aesthetic Theme Check**
> The design uses a premium, dark-centric theme (`hsl(224, 25%, 8%)` background with violet and teal glow accents). This gives a high-tech developer/creator look.
>
> **Static Export Capability**
> Since this site is hosted on GitHub Pages (`seodaeya.github.io`), it relies on static export (`next export` / `output: 'export'`). Dynamic SSR features are not supported, so all SEO tags, schema marks, and posts will be fully pre-rendered at build time.

---

## Finalized Settings

1. **YouTube Channel**: `https://www.youtube.com/@Na.R.D.`
2. **Hero Title**: `나는 사람이다.`
3. **Hero Subtitle**: `AI 시대에 남기는 지극히 인간적인 기록들 | By NaRD`

---

## Proposed Changes

### 1. Global Styles and Layouts

#### [MODIFY] [globals.css](file:///Users/nard/Projects/seodaeya.github.io/styles/globals.css)
- Import Google Fonts (`Inter` for body, `Outfit` for headings).
- Define custom dark-centric variables (HSL tokens) for colors, spacing, borders, gradients, and box shadows.
- Add base scrollbar styling, code block styling, and custom glassmorphism card class utilities.

#### [MODIFY] [Layout.js](file:///Users/nard/Projects/seodaeya.github.io/components/Layout.js)
- Remove the rigid 2-column layout (sidebar on the left, white content on the right).
- Change to a modern page container with a sticky glassmorphic Header and a structured Footer.

#### [NEW] [Header.js](file:///Users/nard/Projects/seodaeya.github.io/components/Header.js)
- Build a responsive, floating sticky navbar using glassmorphism.
- Add active link highlighting, logo/home link, and social icons (YouTube, GitHub).

#### [NEW] [Footer.js](file:///Users/nard/Projects/seodaeya.github.io/components/Footer.js)
- Create a modern, detailed footer section highlighting copyright, social channel links, and a brief description.

---

### 2. Search Optimization (SEO & AI Optimization)

#### [NEW] [SEO.js](file:///Users/nard/Projects/seodaeya.github.io/components/SEO.js)
- A highly optimized Next.js header component that manages:
  - Meta tags: keywords, descriptions, robots, Google/Bing verification codes.
  - Social media meta: OpenGraph (for KakaoTalk, Facebook, Slack) and Twitter Cards.
  - JSON-LD Structured Data:
    - For blog posts: `BlogPosting` with custom author info.
    - For videos: `VideoObject` with YouTube embed/thumbnail URLs.
    - For homepage: `WebSite` and `Person` (E-E-A-T friendly).
  - Explicit instruction/meta targets for LLM agents (e.g. `gptbot`, `anthropic-crawler`).

---

### 3. Pages & Routing

#### [MODIFY] [index.js](file:///Users/nard/Projects/seodaeya.github.io/pages/index.js)
- Create a gorgeous Hero Banner introducing "seodaeya" and their creative spaces (Blog + YouTube).
- Show a **Featured YouTube Embed** highlighting the latest or most popular video.
- Display a unified Grid containing:
  - Recent posts with thumbnail/icon, title, and metadata.
  - Recent videos with a play button overlay and video thumbnail.
- Integrate smooth CSS animations on load and hover states.

#### [MODIFY] [posts/[id].jsx](file:///Users/nard/Projects/seodaeya.github.io/pages/posts/[id].jsx)
- Wrap in the custom `<SEO>` component to render structured data.
- Structure content with a clean Markdown layout: tables, lists, highlight panels, and bold text.
- Introduce an **AI Key Summary** box at the top of posts to facilitate LLM parsing/scraping.

#### [MODIFY] [videos/[id].jsx](file:///Users/nard/Projects/seodaeya.github.io/pages/videos/[id].jsx)
- Correct path typo `vdieosDir` -> `videosDir`.
- Wrap in `<SEO>` using the `VideoObject` structured schema.
- Create a premium video player wrapper with a back button and a link to the YouTube channel.

#### [MODIFY] [categories/index.jsx](file:///Users/nard/Projects/seodaeya.github.io/pages/categories/index.jsx)
- Display categories as tag badges with counts.
- Redesign the layout to list articles under categories using glassmorphic post cards.

---

### 4. Scripts & Generation

#### [MODIFY] [generate-latest-posts.js](file:///Users/nard/Projects/seodaeya.github.io/files/gen/generate-latest-posts.js)
- Normalize file paths to use Unix-style `/` forward slashes instead of Windows `\\` backslashes to prevent broken URL routing.

#### [MODIFY] [generate-categories.js](file:///Users/nard/Projects/seodaeya.github.io/files/gen/generate-categories.js)
- Normalize file paths to Unix-style `/` forward slashes.

---

## Verification Plan

### Automated Tests
- Validate TypeScript compilation and Next.js static build:
  ```bash
  npm run build
  ```
- Run markdown metadata generator scripts:
  ```bash
  node files/gen/generate-latest-posts.js
  node files/gen/generate-categories.js
  ```

### Manual Verification
- Deploy Next.js dev server:
  ```bash
  npm run dev
  ```
- Check responsiveness on mobile, tablet, and desktop views.
- Test routing: verify clicking home posts redirects to correct paths (e.g. `/posts/20250404-1` and `/videos/20230428-1`).
- Verify metadata extraction using browser developer tools: ensure JSON-LD scripts are injected properly.
