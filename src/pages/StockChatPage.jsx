import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '../components/Header';
import DisclaimerBanner from '../components/DisclaimerBanner';
import ChatBubble from '../components/ChatBubble';
import ComposeBar from '../components/ComposeBar';
import PostActionModal from '../components/PostActionModal';
import ErrorFallback from '../components/ErrorFallback';
import Toast from '../components/Toast';
import { useStockMaster, findStockByCode } from '../context/StockMasterContext';
import { useAuthState } from '../context/AuthContext';
import { fetchMessages, postMessage, submitReport } from '../utils/chat';
import { getBlockedIds, blockAnonId } from '../utils/blockList';
import { hasReported, markReported } from '../utils/reportedList';
import { hasAgreedToTerms } from '../utils/terms';
import { classifyFirebaseError, messageForErrorKind } from '../utils/errors';
import './StockChatPage.css';

export default function StockChatPage() {
  const { code } = useParams();
  const { stocks, loading: stockMasterLoading } = useStockMaster();
  const { uid, loading: authLoading } = useAuthState();

  const [messages, setMessages] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [readError, setReadError] = useState(null);
  const [writeErrorMessage, setWriteErrorMessage] = useState(null);
  const [blockedIds, setBlockedIds] = useState(() => getBlockedIds());
  const [activeMessage, setActiveMessage] = useState(null);
  const [toast, setToast] = useState(null);
  const [agreed] = useState(hasAgreedToTerms());

  const stock = useMemo(() => findStockByCode(stocks, code), [stocks, code]);
  const stockNotFound = !stockMasterLoading && !stock;

  const loadInitial = useCallback(async () => {
    setLoadingMessages(true);
    setReadError(null);
    try {
      const { messages: msgs, nextCursor } = await fetchMessages(code);
      setMessages(msgs);
      setCursor(nextCursor);
    } catch (err) {
      console.error('[loadInitial]', err);
      setReadError(classifyFirebaseError(err, { operation: 'read' }));
    } finally {
      setLoadingMessages(false);
    }
  }, [code]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    const handler = () => setToast(null);
    if (!toast) return undefined;
    const timer = setTimeout(handler, 2400);
    return () => clearTimeout(timer);
  }, [toast]);

  async function handleLoadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const { messages: more, nextCursor } = await fetchMessages(code, cursor);
      setMessages((prev) => [...prev, ...more]);
      setCursor(nextCursor);
    } catch {
      setToast(messageForErrorKind('read_failed'));
    } finally {
      setLoadingMore(false);
    }
  }

  async function handlePostSubmit(text) {
    if (!uid) return;
    setWriteErrorMessage(null);
    try {
      const newId = await postMessage({ code, name: stock?.name ?? code, uid, text });
      // 送信直後は先頭に楽観的に追加する（再取得は行わず読み取り回数を節約）。
      // 通報・ブロック等で後から参照できるよう、Firestoreが実際に発行したIDを使う。
      setMessages((prev) => [
        { id: newId, text, anonId: uid, createdAt: new Date(), reportCount: 0, hidden: false },
        ...prev,
      ]);
    } catch (err) {
      console.error('[handlePostSubmit]', err);
      const kind = classifyFirebaseError(err, { operation: 'write' });
      setWriteErrorMessage(messageForErrorKind(kind));
    }
  }

  function handleBlock(targetUid) {
    const updated = blockAnonId(targetUid);
    setBlockedIds(updated);
    setToast('この投稿者をブロックしました');
  }

  async function handleReport({ reason, comment }) {
    if (!activeMessage || !uid) return;
    await submitReport({ code, messageId: activeMessage.id, uid, reason, comment });
    markReported(code, activeMessage.id);
    setToast('通報を受け付けました');
  }

  const visibleMessages = messages.filter((m) => !blockedIds.includes(m.anonId));

  if (stockNotFound) {
    return (
      <div className="page stock-chat-page">
        <Header title="銘柄が見つかりません" showBack />
        <div className="stock-chat-page__not-found">
          <p>指定された銘柄が見つかりませんでした。</p>
          <Link to="/search" className="stock-chat-page__search-link">
            銘柄を検索する
          </Link>
        </div>
      </div>
    );
  }

  const composeDisabled = !agreed || authLoading || !uid;
  const composeDisabledReason = !agreed ? '規約に同意すると投稿できます' : undefined;

  return (
    <div className="page stock-chat-page">
      <Header
        title={stock ? stock.name : code}
        subtitle={stock ? stock.code : undefined}
        showBack
      />
      <DisclaimerBanner compact />

      <main className="stock-chat-page__main">
        {loadingMessages && <p className="stock-chat-page__status">読み込み中…</p>}

        {!loadingMessages && readError && (
          <ErrorFallback message={messageForErrorKind(readError)} onRetry={loadInitial} />
        )}

        {!loadingMessages && !readError && visibleMessages.length === 0 && (
          <div className="stock-chat-page__empty">
            <p>まだ投稿がありません。最初の投稿をしてみましょう。</p>
          </div>
        )}

        {!loadingMessages && !readError && visibleMessages.length > 0 && (
          <>
            <div className="stock-chat-page__list">
              {visibleMessages.map((m) => (
                <ChatBubble
                  key={m.id}
                  message={m}
                  isMine={m.anonId === uid}
                  alreadyReported={hasReported(code, m.id)}
                  onOpenActions={setActiveMessage}
                />
              ))}
            </div>
            {cursor && (
              <button type="button" className="stock-chat-page__load-more" onClick={handleLoadMore} disabled={loadingMore}>
                {loadingMore ? '読み込み中…' : 'もっと読み込む'}
              </button>
            )}
          </>
        )}
      </main>

      {writeErrorMessage && <p className="stock-chat-page__write-error">{writeErrorMessage}</p>}

      <ComposeBar disabled={composeDisabled} disabledReason={composeDisabledReason} onSubmit={handlePostSubmit} />

      {activeMessage && (
        <PostActionModal
          alreadyReported={hasReported(code, activeMessage.id)}
          onClose={() => setActiveMessage(null)}
          onReport={handleReport}
          onBlock={() => handleBlock(activeMessage.anonId)}
        />
      )}

      <Toast message={toast} />
    </div>
  );
}
