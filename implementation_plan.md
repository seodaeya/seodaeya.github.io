# Implementation Plan: Blog Improvements

We are adding the proposed improvements to [seodaeya.github.io](https://seodaeya.github.io/):
1. **Interactive Search**: Real-time clientside search bar on the homepage.
2. **Giscus Comments Integration**: A clean comment widget on blog posts using GitHub Discussions.
3. **Read Time Calculator**: Automatic calculation of reading time for posts based on text length.
4. **RSS Feed Generator**: Automatic generation of `public/rss.xml` during the build process.
5. **Dark/Light Theme Toggle**: System-synchronized theme toggle using CSS variables and local storage.
6. **Smooth Page Transitions**: CSS fade-in-up animations for content reveal when navigating.

---

## User Review Required

> [!IMPORTANT]
> **Giscus Setup Checklist**
> To make the Giscus comments functional on your live website, you must:
> 1. Enable **Discussions** in your GitHub repository settings (`seodaeya.github.io` repository -> Settings -> General -> Features -> Check "Discussions").
> 2. Install the **Giscus GitHub App** on your repository (from [giscus.app](https://giscus.app/)).
> 3. Retrieve your **Repository ID** and **Discussion Category ID** from the [giscus.app](https://giscus.app/) config helper and update them in `components/Comments.js` (I will provide placeholders and clear comments in the file).

---

## Proposed Changes

### 1. Style & Theme Updates

#### [MODIFY] [globals.css](file:///Users/nard/Projects/seodaeya.github.io/styles/globals.css)
- Add a `.light` theme selector block to override HSL variables for a sleek, light-slate look.
- Define theme toggle button variables and transition speeds.
- Add CSS page entry animations (`@keyframes fadeInUp`).

#### [MODIFY] [layout.module.css](file:///Users/nard/Projects/seodaeya.github.io/styles/layout.module.css)
- Add styles for the Theme Toggle button (sun/moon switch) in the sticky header.
- Create transitions to avoid blinking backgrounds during theme swaps.

---

### 2. Global Layout & Theme Logic

#### [MODIFY] [_app.js](file:///Users/nard/Projects/seodaeya.github.io/pages/_app.js)
- Inject a blocking inline script in `<Head>` to read the theme from `localStorage` (or match system preferences) before rendering, preventing FOUC (Flash of Unstyled Content).

#### [MODIFY] [Header.js](file:///Users/nard/Projects/seodaeya.github.io/components/Header.js)
- Add the Theme Toggle button with sun and moon inline SVGs.
- Bind theme toggle logic (managing `document.documentElement.classList`).

---

### 3. Pages & Features

#### [MODIFY] [index.js](file:///Users/nard/Projects/seodaeya.github.io/pages/index.js)
- Add a search input state `searchQuery`.
- Filter both blog posts and videos in real-time as the user types.
- Design a beautiful, glowing search bar in the UI.

#### [NEW] [Comments.js](file:///Users/nard/Projects/seodaeya.github.io/components/Comments.js)
- Build a Giscus comments loader component.
- Supports light/dark theme switching dynamically (giscus theme adapts when the blog theme toggles).

#### [MODIFY] [posts/[id].jsx](file:///Users/nard/Projects/seodaeya.github.io/pages/posts/[id].jsx)
- Calculate reading time inside `getStaticProps` (formula: character count / 500 characters per min).
- Render `⏱️ 읽는 시간: 약 X분` under the title.
- Render the `<Comments />` widget at the bottom of the article.

---

### 4. Feed & Automation Scripts

#### [NEW] [generate-rss.js](file:///Users/nard/Projects/seodaeya.github.io/files/gen/generate-rss.js)
- Create a script that generates `public/rss.xml` with all posts and videos sorted by date.

#### [MODIFY] [package.json](file:///Users/nard/Projects/seodaeya.github.io/package.json)
- Add `node files/gen/generate-rss.js` to the build pipeline sequence.

---

## Verification Plan

### Automated Tests
- Build verification:
  ```bash
  npm run build
  ```
- Ensure `public/rss.xml` is successfully generated.

### Manual Verification
- Test light/dark theme toggle: ensure background, borders, and text update smoothly and theme persists on page reload.
- Test search bar: type keywords and verify feed lists shrink to match.
- Test reading time: verify different blog posts display different reading time values.
- Verify Giscus loading frame at the bottom of blog posts.
