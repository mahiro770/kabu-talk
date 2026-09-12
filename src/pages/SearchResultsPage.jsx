import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ErrorFallback from '../components/ErrorFallback';
import StockListItem from '../components/StockListItem';
import { useStockMaster } from '../context/StockMasterContext';
import { searchStocks } from '../utils/search';
import { messageForErrorKind, ERROR_KIND } from '../utils/errors';
import './SearchResultsPage.css';

export default function SearchResultsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(initialQuery);
  const { stocks, loading, error, reload } = useStockMaster();

  const results = useMemo(() => searchStocks(stocks, initialQuery), [stocks, initialQuery]);

  function handleSubmit(e) {
    e.preventDefault();
    const q = query.trim();
    setSearchParams(q ? { q } : {});
  }

  return (
    <div className="page search-page">
      <Header title="銘柄検索" showBack />

      <form className="search-page__bar" onSubmit={handleSubmit}>
        <button type="button" className="search-page__back" onClick={() => navigate('/')} aria-label="トップへ">
          🏠
        </button>
        <input
          type="search"
          className="search-page__input"
          placeholder="銘柄名またはコードで検索"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <button type="submit" className="search-page__submit">
          検索
        </button>
      </form>

      <main className="search-page__main">
        {loading && <p className="search-page__status">銘柄情報を読み込み中…</p>}

        {!loading && error && (
          <ErrorFallback message={messageForErrorKind(ERROR_KIND.STOCK_MASTER_FAILED)} onRetry={reload} />
        )}

        {!loading && !error && initialQuery && results.length === 0 && (
          <div className="search-page__empty">
            <p>「{initialQuery}」に該当する銘柄が見つかりませんでした。</p>
            <p className="search-page__empty-hint">別のキーワード（銘柄名やコード）で再検索してみてください。</p>
          </div>
        )}

        {!loading && !error && results.length > 0 && (
          <ul className="search-page__list">
            {results.map((stock) => (
              <li key={stock.code}>
                <StockListItem stock={stock} />
              </li>
            ))}
          </ul>
        )}
      </main>

      <Footer />
    </div>
  );
}
