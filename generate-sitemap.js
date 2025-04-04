const fs = require("fs");
const path = require("path");

const baseUrl = "https://seodaeya.github.io";
const videosJsonPath = path.join(__dirname, "datas/videos.json");
const postsJsonPath = path.join(__dirname, "datas/posts.json");
const sitemapPath = path.join(__dirname, "sitemap.xml");

const generateSitemap = async () => {
    const urls = [];

    // 기본 페이지 추가
    urls.push({ loc: `${baseUrl}/index.html`, lastmod: "2025-04-04", priority: "1.0" });
    urls.push({ loc: `${baseUrl}/videos.html`, lastmod: "2025-04-04", priority: "0.8" });
    urls.push({ loc: `${baseUrl}/categories.html`, lastmod: "2025-04-04", priority: "0.8" });

    // posts.json에서 글 URL 추가
    const posts = JSON.parse(fs.readFileSync(postsJsonPath, "utf-8"));
    posts.forEach(post => {
        const date = post.file.split("-")[0]; // yyyymmdd 추출
        urls.push({
            loc: `${baseUrl}/post.html?file=${post.file}`,
            lastmod: `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`,
            priority: "0.7"
        });
    });

    // videos.json에서 영상 URL 추가
    const videos = JSON.parse(fs.readFileSync(videosJsonPath, "utf-8"));
    videos.forEach(video => {
        if (video.post) {
            const date = video.post.split("/").pop().split("-")[0]; // yyyymmdd 추출
            urls.push({
                loc: `${baseUrl}/post.html?file=${video.post.split("/").pop()}`,
                lastmod: `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`,
                priority: "0.7"
            });
        }
    });

    // sitemap.xml 생성
    const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
        .map(
            url => `
    <url>
        <loc>${url.loc}</loc>
        <lastmod>${url.lastmod}</lastmod>
        <priority>${url.priority}</priority>
    </url>`
        )
        .join("\n")}
</urlset>`;

    fs.writeFileSync(sitemapPath, sitemapContent.trim());
    console.log("sitemap.xml 생성 완료!");
};

generateSitemap();