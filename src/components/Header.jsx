import { useNavigate } from 'react-router-dom';
import './Header.css';

export default function Header({ title = 'カブトーク', showBack = false, subtitle = null, showSettings = false }) {
  const navigate = useNavigate();

  return (
    <header className="app-header">
      {showBack && (
        <button
          type="button"
          className="app-header__back"
          onClick={() => navigate(-1)}
          aria-label="戻る"
        >
          ←
        </button>
      )}
      <div className="app-header__titles">
        <span className="app-header__title">{title}</span>
        {subtitle && <span className="app-header__subtitle">{subtitle}</span>}
      </div>
      {showSettings && (
        <button
          type="button"
          className="app-header__settings"
          onClick={() => navigate('/settings')}
          aria-label="個人設定"
        >
          ⚙
        </button>
      )}
    </header>
  );
}
