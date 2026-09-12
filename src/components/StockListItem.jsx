import { Link } from 'react-router-dom';
import MarketBadge from './MarketBadge';
import './StockListItem.css';

// 検索結果1行（design.md 画面2）：銘柄名（大）／コード（小・グレー）／市場区分バッジ
export default function StockListItem({ stock }) {
  return (
    <Link to={`/stocks/${stock.code}`} className="stock-list-item">
      <div className="stock-list-item__main">
        <span className="stock-list-item__name">{stock.name}</span>
        <span className="stock-list-item__code">{stock.code}</span>
      </div>
      <MarketBadge market={stock.market} />
    </Link>
  );
}
