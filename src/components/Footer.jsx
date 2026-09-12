import { Link } from 'react-router-dom';
import './Footer.css';

// フッター：利用規約・免責事項へのリンクを常時表示（design.md 1章）
export default function Footer() {
  return (
    <footer className="app-footer">
      <Link to="/terms" className="app-footer__link">
        利用規約・免責事項
      </Link>
      <span className="app-footer__copy">カブトーク（仮称）</span>
    </footer>
  );
}
