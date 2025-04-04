const fs = require("fs");
const path = require("path");

const baseUrl = "https://seodaeya.github.io";
const postsJsonPath = path.join(__dirname, "datas/posts.json");
const rssPath = path.join(__dirname, "rss.xml");

const generateRSS = async () => {
    const posts = JSON.parse(fs.readFileSync(postsJsonPath, "utf-8"));

    // 최신순으로 정렬
    posts.sort((a, b) => b.file.split("-")[0].localeCompare(a.file.split("-")[0]));

    // RSS 피드 헤더
    const rssHeader = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
    <title>NaRD's Blog</title>
    <link>${baseUrl}</link>
    <description>NaRD's Blog RSS Feed</description>
    <language>ko</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`;

    // RSS 피드 항목
    const rssItems = posts
        .map(post => {
            const date = post.file.split("-")[0]; // yyyymmdd 추출
            const formattedDate = new Date(
                `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`
            ).toUTCString(); // RFC 822 형식으로 변환
            return `
    <item>
        <title>${post.title}</title>
        <link>${baseUrl}/post.html?file=${post.file}</link>
        <description>${post.title}</description>
        <pubDate>${formattedDate}</pubDate>
        <guid>${baseUrl}/post.html?file=${post.file}</guid>
    </item>`;
        })
        .join("");

    // RSS 피드 푸터
    const rssFooter = `
</channel>
</rss>`;

    // RSS 파일 생성
    const rssContent = `${rssHeader}${rssItems}${rssFooter}`;
    fs.writeFileSync(rssPath, rssContent.trim());
    console.log("rss.xml 생성 완료!");
};

generateRSS();