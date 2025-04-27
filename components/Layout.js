import Sidebar from './Sidebar';
import styles from '@/styles/layout.module.css';

export default function Layout({ children }) {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>{children}</main>
    </div>
  );
}