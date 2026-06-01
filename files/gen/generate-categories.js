const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const filesDir = path.join(__dirname, "..");
const outputFile = path.join(__dirname, "../categories.json");

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

const generateCategories = () => {
    const categories = {};
    const files = getAllMarkdownFiles(filesDir);

    if (files.length === 0) {
        console.error("Markdown 파일이 없습니다.");
        return;
    }

    files.forEach(filePath => {
        const content = fs.readFileSync(filePath, "utf-8");
        const { data } = matter(content);

        if (data.category) {
            if (!categories[data.category]) {
                categories[data.category] = [];
            }
            
            // 경로 구분자를 Unix-style (/)로 표준화
            const relativePath = path.relative(filesDir, filePath).split(path.sep).join('/');

            categories[data.category].push({
                title: data.title || path.basename(filePath, ".md"),
                file: relativePath
            });
        }
    });

    fs.writeFileSync(outputFile, JSON.stringify(categories, null, 2), "utf-8");
    console.log("categories.json 생성 완료!");
};

generateCategories();
