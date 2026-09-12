import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import DisclaimerBanner from '../components/DisclaimerBanner';
import TermsModal from '../components/TermsModal';
import ErrorFallback from '../components/ErrorFallback';
import { useStockMaster } from '../context/StockMasterContext';
import { fetchTopStocks } from '../utils/topStocks';
import { hasAgreedToTerms, agreeToTerms } from '../utils/terms';
import { messageForErrorKind, ERROR_KIND } from '../utils/errors';
import './TopPage.css';

export default function TopPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [showTermsModal, setShowTermsModal] = useState(!hasAgreedToTerms());
  const [topStocks, setTopStocks] = useState([]);
  const { error: stockMasterError, reload } = useStockMaster();

  useEffect(() => {
    // 注目銘柄リストはMVP必須要件ではないため、取得失敗は静かに無視する（design.md 画面1）
    fetchTopStocks(10)
      .then(setTopStocks)
      .catch(() => setTopStocks([]));
  }, []);

  function handleAgree() {
    agreeToTerms();
    setShowTermsModal(false);
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <div className="page top-page">
      <Header title="カブトーク" showSettings />

      <main className="top-page__main">
        <form className="top-page__search" onSubmit={handleSearchSubmit}>
          <input
            type="search"
            className="top-page__search-input"
            placeholder="銘柄名またはコードで検索"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button type="submit" className="top-page__search-button">
            検索
          </button>
        </form>

        <DisclaimerBanner />

        {stockMasterError && (
          <div className="top-page__stock-error">
            <ErrorFallback message={messageForErrorKind(ERROR_KIND.STOCK_MASTER_FAILED)} onRetry={reload} />
          </div>
        )}

        {topStocks.length > 0 && (
          <section className="top-page__trending">
            <h2 className="top-page__section-title">注目の銘柄</h2>
            <ul className="top-page__trending-list">
              {topStocks.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className="top-page__trending-item"
                    onClick={() => navigate(`/stocks/${s.id}`)}
                  >
                    <span className="top-page__trending-name">{s.name ?? s.id}</span>
                    <span className="top-page__trending-count">{s.messageCount ?? 0}件の投稿</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="top-page__about">
          <p>
            「カブトーク」は、気になる銘柄について匿名で「明日の値動き」を予想し合うチャットアプリです。
            会員登録は不要。銘柄を検索して、みんなの予想をのぞいてみましょう。
          </p>
        </section>
      </main>

      <Footer />

      {showTermsModal && <TermsModal onAgree={handleAgree} />}
    </div>
  );
}
