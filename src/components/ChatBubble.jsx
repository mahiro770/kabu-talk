import Avatar from './Avatar';
import { formatRelativeTime } from '../utils/time';
import './ChatBubble.css';

// LINE風チャット吹き出し（design.md 画面3）
// 自分の投稿は右寄せ・アクセントカラー、他者の投稿は左寄せ・ニュートラルカラー
export default function ChatBubble({ message, isMine, onOpenActions, alreadyReported, liked, onToggleLike }) {
  // 【2026-09-12 追加】個人設定で表示名を設定している場合はその名前を、未設定の場合は
  // 従来どおり「匿名」と表示する（design.mdの匿名性方針は維持しつつ、任意で名乗れるようにする）。
  const displayName = message.authorName || '匿名';
  // 【2026-09-13 追加】連続投稿記録（ストリーク）。2日以上続いている場合のみ表示する
  // （1日だけでは「連続」の演出にならないため）。
  const streak = message.streak ?? 0;
  const likeCount = message.likeCount ?? 0;
  return (
    <div className={`chat-bubble-row${isMine ? ' chat-bubble-row--mine' : ''}`}>
      {!isMine && <Avatar uid={message.anonId} icon={message.authorIcon} />}
      <div className="chat-bubble-col">
        <span className="chat-bubble__name">
          {displayName}
          {streak >= 2 && <span className="chat-bubble__streak">🔥{streak}</span>}
        </span>
        <div className={`chat-bubble${isMine ? ' chat-bubble--mine' : ''}`}>
          <p className="chat-bubble__text">{message.text}</p>
        </div>
        <div className="chat-bubble__meta">
          {alreadyReported && <span className="chat-bubble__reported-label">通報済み</span>}
          <span className="chat-bubble__time">{formatRelativeTime(message.createdAt)}</span>
          <button
            type="button"
            className={`chat-bubble__like${liked ? ' chat-bubble__like--active' : ''}`}
            aria-pressed={liked}
            aria-label="いいね"
            onClick={() => onToggleLike(message)}
          >
            {liked ? '❤️' : '🤍'} {likeCount > 0 ? likeCount : ''}
          </button>
          <button
            type="button"
            className="chat-bubble__kebab"
            aria-label="投稿メニューを開く"
            onClick={() => onOpenActions(message)}
          >
            ⋯
          </button>
        </div>
      </div>
      {isMine && <Avatar uid={message.anonId} icon={message.authorIcon} />}
    </div>
  );
}
