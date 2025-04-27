const fs = require("fs");
const path = require("path");
const matter = require("gray-matter"); // gray-matter 라이브러리 사용

// files 디렉토리 경로
const filesDir = path.join(__dirname, ".."); // 상위 디렉토리로 이동
const outputFile = path.join(__dirname, "../latest-posts.json"); // 상위 디렉토리에 latest-posts.json 생성

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

// 파일명에서 날짜(yyyymmdd)를 추출하는 함수
const extractDateFromFilename = (filename) => {
    const match = filename.match(/(\d{8})/); // yyyymmdd 형식 추출
    return match ? match[1] : null;
};

const generateLatestPosts = () => {
    // 모든 Markdown 파일 경로 가져오기
    const files = getAllMarkdownFiles(filesDir);

    if (files.length === 0) {
        console.error("Markdown 파일이 없습니다.");
        return;
    }

    // 파일명에서 날짜를 추출하고 정렬
    const filesWithDates = files
        .map(filePath => {
            const filename = path.basename(filePath);
            const date = extractDateFromFilename(filename);
            return { filePath, date };
        })
        .filter(file => file.date) // 날짜가 없는 파일은 제외
        .sort((a, b) => b.date.localeCompare(a.date)); // 날짜 기준으로 최신순 정렬

    // 최신 글 10개 가져오기
    const latestPosts = filesWithDates.slice(0, 10).map(file => {
        const content = fs.readFileSync(file.filePath, "utf-8");
        const { data } = matter(content); // gray-matter로 frontmatter 파싱

        return {
            title: data.title || path.basename(file.filePath, ".md"),
            category: data.category || "Uncategorized",
            file: path.relative(filesDir, file.filePath), // 상대 경로로 저장
            date: file.date // 파일명에서 추출한 날짜 추가
        };
    });

    // latest-posts.json 파일 생성
    fs.writeFileSync(outputFile, JSON.stringify(latestPosts, null, 2), "utf-8");
    console.log("latest-posts.json 생성 완료!");
};

generateLatestPosts();