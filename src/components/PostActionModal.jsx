import { useState } from 'react';
import { REPORT_REASONS, MAX_REPORT_COMMENT_LENGTH } from '../utils/chat';
import './PostActionModal.css';

// 投稿詳細/通報モーダル（design.md 画面4）
// step: 'menu' -> 'report-reason' | 'block-confirm'
export default function PostActionModal({ alreadyReported, onClose, onReport, onBlock }) {
  const [step, setStep] = useState('menu');
  const [reason, setReason] = useState('defamation');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  async function handleReportSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onReport({ reason, comment });
      setStep('done');
    } catch (err) {
      if (err?.message === 'already-reported') {
        setSubmitError('この投稿にはすでに通報済みです。');
      } else {
        setSubmitError('通報の送信に失敗しました。しばらくしてから再度お試しください。');
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleBlockConfirm() {
    onBlock();
    onClose();
  }

  return (
    <div className="action-modal-backdrop" onClick={onClose}>
      <div className="action-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        {step === 'menu' && (
          <div className="action-modal__sheet">
            <button
              type="button"
              className="action-modal__item"
              disabled={alreadyReported}
              onClick={() => setStep('report-reason')}
            >
              {alreadyReported ? '通報済み' : '通報する'}
            </button>
            <button type="button" className="action-modal__item" onClick={() => setStep('block-confirm')}>
              この投稿者をブロックする
            </button>
            <button type="button" className="action-modal__item action-modal__item--cancel" onClick={onClose}>
              キャンセル
            </button>
          </div>
        )}

        {step === 'report-reason' && (
          <form className="action-modal__panel" onSubmit={handleReportSubmit}>
            <h3 className="action-modal__title">通報理由を選択してください</h3>
            <div className="action-modal__radio-group">
              {REPORT_REASONS.map((r) => (
                <label key={r.value} className="action-modal__radio">
                  <input
                    type="radio"
                    name="reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                  />
                  {r.label}
                </label>
              ))}
            </div>
            <textarea
              className="action-modal__comment"
              placeholder="任意コメント（最大100文字）"
              maxLength={MAX_REPORT_COMMENT_LENGTH}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <div className="action-modal__comment-count">
              {comment.length}/{MAX_REPORT_COMMENT_LENGTH}
            </div>
            {submitError && <p className="action-modal__error">{submitError}</p>}
            <div className="action-modal__actions">
              <button type="button" className="action-modal__secondary" onClick={onClose} disabled={submitting}>
                キャンセル
              </button>
              <button type="submit" className="action-modal__primary" disabled={submitting}>
                {submitting ? '送信中…' : '通報する'}
              </button>
            </div>
          </form>
        )}

        {step === 'block-confirm' && (
          <div className="action-modal__panel">
            <p className="action-modal__confirm-text">
              以後この投稿者の投稿は表示されなくなります。よろしいですか？
            </p>
            <div className="action-modal__actions">
              <button type="button" className="action-modal__secondary" onClick={onClose}>
                キャンセル
              </button>
              <button type="button" className="action-modal__primary" onClick={handleBlockConfirm}>
                ブロックする
              </button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="action-modal__panel">
            <p className="action-modal__confirm-text">通報を受け付けました</p>
            <div className="action-modal__actions">
              <button type="button" className="action-modal__primary" onClick={onClose}>
                閉じる
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
