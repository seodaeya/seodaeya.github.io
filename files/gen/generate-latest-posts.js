const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const filesDir = path.join(__dirname, "..");
const outputFile = path.join(__dirname, "../latest-posts.json");

const getAllMarkdownFiles = (dir) => {
    let results = [];
    const list = fs.readdirSync(dir);

    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat && stat.isDirectory()) {
            results = results.concat(getAllMarkdownFiles(filePath));
        } else if (file.endsWith(".md")) {
            results.push(filePath);
        }
    });

    return results;
};

const extractDateFromFilename = (filename) => {
    const match = filename.match(/(\d{8})/);
    return match ? match[1] : null;
};

const generateLatestPosts = () => {
    const files = getAllMarkdownFiles(filesDir);

    if (files.length === 0) {
        console.error("Markdown 파일이 없습니다.");
        return;
    }

    const filesWithDates = files
        .map(filePath => {
            const filename = path.basename(filePath);
            const date = extractDateFromFilename(filename);
            return { filePath, date };
        })
        .filter(file => file.date)
        .sort((a, b) => b.date.localeCompare(a.date));

    const latestPosts = filesWithDates.slice(0, 10).map(file => {
        const content = fs.readFileSync(file.filePath, "utf-8");
        const { data } = matter(content);

        // 경로 구분자를 Unix-style (/)로 표준화
        const relativePath = path.relative(filesDir, file.filePath).split(path.sep).join('/');

        return {
            title: data.title || path.basename(file.filePath, ".md"),
            category: data.category || "Uncategorized",
            file: relativePath,
            date: file.date
        };
    });

    fs.writeFileSync(outputFile, JSON.stringify(latestPosts, null, 2), "utf-8");
    console.log("latest-posts.json 생성 완료!");
};

generateLatestPosts();
