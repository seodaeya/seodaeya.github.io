import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import styles from '@/styles/home.module.css'; // CSS Modules import

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
    <div className={styles.homeContainer}>
      <h1>NaRD's Blog.</h1>
      <p>Have a positively radiant day, and may happiness always be with you!</p>
      <div className={styles.latestPosts}>
        {latestPosts.map((post) => (
          <div key={post.file} className={styles.postCard}>
            <h2>
              <Link href={`/${post.file.replace('.md', '')}`}>
                {post.title}
              </Link>
            </h2>
            <p className={styles.postMeta}>
              <span className={styles.category}>{post.category}</span> |{' '}
              <span className={styles.date}>{post.date}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}