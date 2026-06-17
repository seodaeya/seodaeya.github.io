# Task Checklist for Blog Improvements Implementation

- [x] 1. Styles & Themes
  - [x] Update `styles/globals.css` with light theme variables and page animations
  - [x] Update `styles/layout.module.css` with Theme Toggle styles
- [x] 2. Layout & Theme Logic
  - [x] Modify `pages/_app.js` with theme blocking inline script
  - [x] Modify `components/Header.js` with Theme Toggle button and states
- [x] 3. Page Improvements
  - [x] Modify `pages/index.js` with real-time clientside search input and filter state
  - [x] Create `components/Comments.js` for Giscus comments loader
  - [x] Modify `pages/posts/[id].jsx` to compute reading time and render `<Comments />`
- [x] 4. Feeds & Scripts
  - [x] Create `files/gen/generate-rss.js` script
  - [x] Update `package.json` to trigger sitemap and RSS generation during build
- [x] 5. Verification & Testing
  - [x] Run `npm run build` locally to verify zero build errors
