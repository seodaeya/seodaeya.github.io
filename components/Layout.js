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
        `.layout` 의 overflow-x: clip 과 main 내부 transform 애니메이션에 영향을 받지 않아야
        position: fixed 가 뷰포트 기준으로 정확히 동작한다.
      */}
      <CoupangSideBanner />
    </>
  );
}
