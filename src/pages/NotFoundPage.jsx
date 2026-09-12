import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function NotFoundPage() {
  return (
    <div className="page">
      <Header title="ページが見つかりません" showBack />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', color: 'var(--color-text-sub)', fontSize: 14 }}>
          <p>お探しのページが見つかりませんでした。</p>
          <Link to="/" style={{ color: 'var(--color-primary)' }}>
            トップへ戻る
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
