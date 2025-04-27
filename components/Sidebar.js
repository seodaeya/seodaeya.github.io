import Link from 'next/link';
import styles from '@/styles/sidebar.module.css'; // CSS Modules import

export default function Sidebar() {
  return (
    <nav className={styles.sidebar}>
      <h2 className={styles.title}>내 블로그</h2>
      <ul className={styles.menu}>
        <li className={styles.menuItem}>
          <Link href="/">홈</Link>
        </li>
        <li className={styles.menuItem}>
          <Link href="/categories">카테고리</Link>
        </li>
      </ul>
    </nav>
  );
}