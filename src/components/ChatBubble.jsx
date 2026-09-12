import Avatar from './Avatar';
import { formatRelativeTime } from '../utils/time';
import './ChatBubble.css';

// LINE風チャット吹き出し（design.md 画面3）
// 自分の投稿は右寄せ・アクセントカラー、他者の投稿は左寄せ・ニュートラルカラー
export default function ChatBubble({ message, isMine, onOpenActions, alreadyReported }) {
  return (
    <div className={`chat-bubble-row${isMine ? ' chat-bubble-row--mine' : ''}`}>
      {!isMine && <Avatar uid={message.anonId} />}
      <div className="chat-bubble-col">
        <div className={`chat-bubble${isMine ? ' chat-bubble--mine' : ''}`}>
          <p className="chat-bubble__text">{message.text}</p>
        </div>
        <div className="chat-bubble__meta">
          {alreadyReported && <span className="chat-bubble__reported-label">通報済み</span>}
          <span className="chat-bubble__time">{formatRelativeTime(message.createdAt)}</span>
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
      {isMine && <Avatar uid={message.anonId} />}
    </div>
  );
}
