import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';
import '@/styles/video.css';

export async function getStaticPaths() {
  const vdieosDir = path.join(process.cwd(), '/files/videos');
  const filenames = fs.readdirSync(vdieosDir);
  const paths = filenames.map((filename) => ({
    params: { id: filename.replace('.md', '') },
  }));

  return { paths, fallback: false };
}

export async function getStaticProps({ params }) {
  const filePath = path.join(process.cwd(), '/files/videos', `${params.id}.md`);
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);

  return {
    props: {
      frontmatter: data,
      content: marked(content),
    },
  };
}

export default function Video({ frontmatter, content }) {
  return (
    <div>
      <h1>{frontmatter.title}</h1>
      {frontmatter?.videoId && (
        <div className="video-container">
          <iframe
            src={`https://www.youtube.com/embed/${frontmatter?.videoId}`}
            allowFullScreen
          ></iframe>
        </div>
      )}
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
}