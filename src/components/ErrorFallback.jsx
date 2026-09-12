import './ErrorFallback.css';

// エラー/枠上限案内の共通フォールバックUI（design.md 画面6）
export default function ErrorFallback({ message, onRetry }) {
  return (
    <div className="error-fallback" role="alert">
      <div className="error-fallback__icon" aria-hidden="true">
        ⚠
      </div>
      <p className="error-fallback__message">{message}</p>
      {onRetry && (
        <button type="button" className="error-fallback__retry" onClick={onRetry}>
          再読み込み
        </button>
      )}
    </div>
  );
}
