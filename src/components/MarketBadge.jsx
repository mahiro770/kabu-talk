import './MarketBadge.css';

const MARKET_CLASS = {
  プライム: 'market-badge--prime',
  スタンダード: 'market-badge--standard',
  グロース: 'market-badge--growth',
};

export default function MarketBadge({ market }) {
  if (!market) return null;
  const cls = MARKET_CLASS[market] ?? 'market-badge--default';
  return <span className={`market-badge ${cls}`}>{market}</span>;
}
