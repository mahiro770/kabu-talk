import { Link } from 'react-router-dom';
import './DisclaimerBanner.css';

// 免責バナー（design.md 画面1）：検索ボックス直下に常時表示。タップで規約画面へ。
export default function DisclaimerBanner({ compact = false }) {
  return (
    <Link to="/terms" className={`disclaimer-banner${compact ? ' disclaimer-banner--compact' : ''}`}>
      <span className="disclaimer-banner__icon" aria-hidden="true">
        ⚠
      </span>
      <span>
        {compact
          ? '投稿は個人の予想です。投資判断は自己責任で行ってください'
          : '投稿は個人の予想であり、投資助言ではありません'}
      </span>
    </Link>
  );
}
