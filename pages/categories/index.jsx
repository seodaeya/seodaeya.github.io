import Link from "next/link";
import fs from "fs";
import path from "path";

export async function getStaticProps() {
  const categoriesFile = path.join(process.cwd(), "files/categories.json");
  const categories = JSON.parse(fs.readFileSync(categoriesFile, "utf-8"));

  return {
    props: {
      categories
    }
  };
}

export default function Categories({ categories }) {
  return (
    <div>
      <h1>카테고리별 글 목록</h1>
      {Object.keys(categories).map(category => (
        <div key={category}>
          <h2>{category}</h2>
          <ul>
            {categories[category].map(post => (
              <li key={post.file}>
                <Link href={`/${post.file.replace(".md", "")}`}>
                  {post.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}