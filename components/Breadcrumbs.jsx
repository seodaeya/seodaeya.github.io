import Link from 'next/link';
import styles from '@/styles/breadcrumbs.module.css';

export default function Breadcrumbs({ category, title }) {
  return (
    <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
      <Link href="/" className={styles.crumbLink}>
        홈
      </Link>
      <span className={styles.separator}>/</span>
      {category && (
        <>
          <Link 
            href={`/categories#category-${category.toUpperCase()}`} 
            className={styles.crumbLink}
          >
            {category}
          </Link>
          <span className={styles.separator}>/</span>
        </>
      )}
      <span className={styles.current}>{title}</span>
    </nav>
  );
}
