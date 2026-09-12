import { useState, useRef } from 'react';
import { MAX_TEXT_LENGTH } from '../utils/chat';
import { checkBlockingNgWords, checkWarningPhrase } from '../utils/ngWordFilter';
import './ComposeBar.css';

const THROTTLE_MS = 3000; // design.md 8章15番：直前の投稿から3秒間は再送信不可（簡易スロットリング）

// 投稿入力欄（design.md 画面3）：画面下部固定
export default function ComposeBar({ disabled, disabledReason, onSubmit }) {
  const [text, setText] = useState('');
  const [blockMessage, setBlockMessage] = useState(null);
  const [pendingWarningText, setPendingWarningText] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const lastSubmitAtRef = useRef(0);

  const trimmed = text.trim();
  const isEmpty = trimmed.length === 0;
  const isTooLong = text.length > MAX_TEXT_LENGTH;

  async function doSubmit(finalText) {
    setSubmitting(true);
    try {
      await onSubmit(finalText);
      setText('');
      lastSubmitAtRef.current = Date.now();
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    setBlockMessage(null);
    if (disabled || submitting) return;
    if (isEmpty || isTooLong) return;

    const now = Date.now();
    if (now - lastSubmitAtRef.current < THROTTLE_MS) {
      setBlockMessage('連続投稿はできません。少し時間をおいてから投稿してください。');
      return;
    }

    const blocking = checkBlockingNgWords(trimmed);
    if (blocking) {
      setBlockMessage(blocking.message);
      return;
    }

    if (checkWarningPhrase(trimmed)) {
      setPendingWarningText(trimmed);
      return;
    }

    doSubmit(trimmed);
  }

  function confirmWarningAndSubmit() {
    const t = pendingWarningText;
    setPendingWarningText(null);
    if (t) doSubmit(t);
  }

  return (
    <div className="compose-bar-wrap">
      {blockMessage && <p className="compose-bar__block-message">{blockMessage}</p>}

      {pendingWarningText && (
        <div className="compose-bar__warning">
          <p>断定的な表現は避け、あくまで個人の予想として投稿してください。このまま投稿しますか？</p>
          <div className="compose-bar__warning-actions">
            <button type="button" onClick={() => setPendingWarningText(null)}>
              修正する
            </button>
            <button type="button" className="compose-bar__warning-confirm" onClick={confirmWarningAndSubmit}>
              このまま投稿する
            </button>
          </div>
        </div>
      )}

      <form className="compose-bar" onSubmit={handleSubmit}>
        <textarea
          className="compose-bar__input"
          placeholder={disabled ? disabledReason ?? '' : '明日の値動きを予想して投稿しよう'}
          value={text}
          disabled={disabled || submitting}
          rows={1}
          onChange={(e) => {
            setText(e.target.value);
            setBlockMessage(null);
          }}
        />
        <div className="compose-bar__side">
          <span className={`compose-bar__count${isTooLong ? ' compose-bar__count--over' : ''}`}>
            {text.length}/{MAX_TEXT_LENGTH}
          </span>
          <button
            type="submit"
            className="compose-bar__submit"
            disabled={disabled || submitting || isEmpty || isTooLong}
          >
            送信
          </button>
        </div>
      </form>
    </div>
  );
}
