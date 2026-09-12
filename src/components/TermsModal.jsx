import { Link } from 'react-router-dom';
import './TermsModal.css';

// 規約同意モーダル（design.md 画面5：初回アクセス時に表示。同意するまで投稿系導線を非活性にする）
export default function TermsModal({ onAgree }) {
  return (
    <div className="terms-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="terms-modal-title">
      <div className="terms-modal">
        <h2 id="terms-modal-title" className="terms-modal__title">
          ご利用にあたって
        </h2>
        <ul className="terms-modal__summary">
          <li>本サービスは投資助言・推奨を行うものではありません。投稿内容は個人の匿名の意見・予想です。</li>
          <li>投稿内容の正確性・結果について運営者は責任を負いません。</li>
          <li>誹謗中傷・スパム・個人情報の投稿・違法行為を目的とした投稿は禁止です。</li>
          <li>通報を受けた投稿は件数に応じて非表示になる場合があります。</li>
        </ul>
        <Link to="/terms" className="terms-modal__link">
          利用規約・免責事項の全文を読む
        </Link>
        <button type="button" className="terms-modal__agree" onClick={onAgree}>
          同意して利用する
        </button>
      </div>
    </div>
  );
}
