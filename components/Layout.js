import Header from './Header';
import Footer from './Footer';
import CoupangSideBanner from './CoupangSideBanner';
import styles from '@/styles/layout.module.css';

export default function Layout({ children }) {
  return (
    <>
      <div className={styles.layout}>
        <Header />
        <main className={styles.main}>{children}</main>
        <Footer />
      </div>
      {/*
        좌측 여백 배너는 `.layout` 바깥에 둔다.
        애드센스 심사 기간 임시 비활성화:
        <CoupangSideBanner />
      */}
    </>
  );
}
