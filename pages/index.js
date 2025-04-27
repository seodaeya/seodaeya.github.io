import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import '../styles/home.css';

export async function getStaticProps() {
  const latestPostsPath = path.join(process.cwd(), 'files/latest-posts.json');
  const latestPosts = JSON.parse(fs.readFileSync(latestPostsPath, 'utf-8'));

  return {
    props: {
      latestPosts,
    },
  };
}

export default function Home({ latestPosts }) {
  return (
    <div className="home-container">
      <h1>환영합니다!</h1>
      <p>이곳은 내 블로그입니다. 최신 글을 확인하세요.</p>
      <div className="latest-posts">
        {latestPosts.map((post) => (
          <div key={post.file} className="post-card">
            <h2>
              <Link href={`/${post.file.replace('.md', '')}`}>
                {post.title}
              </Link>
            </h2>
            <p className="post-meta">
              <span className="category">{post.category}</span> |{' '}
              <span className="date">{post.date}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}