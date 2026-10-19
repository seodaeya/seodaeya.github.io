import Link from 'next/link';
import styles from '@/styles/breadcrumbs.module.css';

export default function Breadcrumbs({ category, title }) {
  const siteUrl = 'https://seodaeya.github.io';
  const categoryAnchorUrl = category
    ? `${siteUrl}/categories/#category-${encodeURIComponent(category)}`
    : `${siteUrl}/categories/`;

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: '홈',
        item: `${siteUrl}/`,
      },
      ...(category
        ? [
            {
              '@type': 'ListItem',
              position: 2,
              name: category,
              item: categoryAnchorUrl,
            },
          ]
        : []),
      {
        '@type': 'ListItem',
        position: category ? 3 : 2,
        name: title,
      },
    ],
  };

  return (
    <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Link href="/" className={styles.crumbLink}>
        홈
      </Link>
      <span className={styles.separator}>/</span>
      {category && (
        <>
          <Link 
            href={`/categories/#category-${category}`} 
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
