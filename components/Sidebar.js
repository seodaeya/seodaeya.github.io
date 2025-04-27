import Link from 'next/link';
import '../styles/sidebar.css';

export default function Sidebar() {
  return (
    <nav className="sidebar">
      <h2>내 블로그</h2>
      <ul>
        <li>
          <Link href="/">홈</Link>
        </li>
        <li>
          <Link href="/categories">카테고리</Link>
        </li>
      </ul>
    </nav>
  );
}