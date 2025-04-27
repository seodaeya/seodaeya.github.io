const fs = require("fs");
const path = require("path");
const matter = require("gray-matter"); // gray-matter 라이브러리 사용

// files 디렉토리 경로 수정
const filesDir = path.join(__dirname, ".."); // 상위 디렉토리로 이동
const outputFile = path.join(__dirname, "../categories.json"); // 상위 디렉토리에 categories.json 생성

// 디렉토리를 재귀적으로 탐색하여 모든 Markdown 파일 경로를 가져오는 함수
const getAllMarkdownFiles = (dir) => {
    let results = [];
    const list = fs.readdirSync(dir);

    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat && stat.isDirectory()) {
            // 디렉토리인 경우 재귀적으로 탐색
            results = results.concat(getAllMarkdownFiles(filePath));
        } else if (file.endsWith(".md")) {
            // Markdown 파일인 경우 결과에 추가
            results.push(filePath);
        }
    });

    return results;
};

const generateCategories = () => {
    const categories = {};

    // 모든 Markdown 파일 경로 가져오기
    const files = getAllMarkdownFiles(filesDir);

    if (files.length === 0) {
        console.error("Markdown 파일이 없습니다.");
        return;
    }

    files.forEach(filePath => {
        const content = fs.readFileSync(filePath, "utf-8");
        const { data } = matter(content); // gray-matter로 frontmatter 파싱

        if (data.category) {
            if (!categories[data.category]) {
                categories[data.category] = [];
            }
            categories[data.category].push({
                title: data.title || path.basename(filePath, ".md"),
                file: path.relative(filesDir, filePath) // 상대 경로로 저장
            });
        }
    });

    // categories.json 파일 생성
    fs.writeFileSync(outputFile, JSON.stringify(categories, null, 2), "utf-8");
    console.log("categories.json 생성 완료!");
};

generateCategories();