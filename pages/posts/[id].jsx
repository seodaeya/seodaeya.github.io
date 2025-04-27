import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';
import '@/styles/post.css';

export async function getStaticPaths() {
  const postsDir = path.join(process.cwd(), '/files/posts');
  const filenames = fs.readdirSync(postsDir);
  const paths = filenames.map((filename) => ({
    params: { id: filename.replace('.md', '') },
  }));

  return { paths, fallback: false };
}

export async function getStaticProps({ params }) {
  const filePath = path.join(process.cwd(), '/files/posts', `${params.id}.md`);
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);

  return {
    props: {
      frontmatter: data,
      content: marked(content),
    },
  };
}

export default function Post({ frontmatter, content }) {
  return (
    <div>
      <h1>{frontmatter.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
}