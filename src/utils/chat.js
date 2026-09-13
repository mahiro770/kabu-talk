// チャット投稿・取得・通報のFirestore操作（design.md 3-2〜3-4章）
import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';
import { db } from '../firebase';

export const PAGE_SIZE = 50;
export const MAX_TEXT_LENGTH = 200;
export const MAX_REPORT_COMMENT_LENGTH = 100;
export const REPORT_HIDE_THRESHOLD = 3;

export const REPORT_REASONS = [
  { value: 'defamation', label: '誹謗中傷' },
  { value: 'spam', label: 'スパム' },
  { value: 'other', label: 'その他' },
];

/**
 * 銘柄別チャットを取得する（design.md 3-3章）
 * @param {string} code 銘柄コード
 * @param {import('firebase/firestore').QueryDocumentSnapshot} [cursor] 追加読み込み用のカーソル
 */
export async function fetchMessages(code, cursor) {
  const messagesRef = collection(db, 'posts', code, 'messages');
  const constraints = [where('hidden', '==', false), orderBy('createdAt', 'desc'), limit(PAGE_SIZE)];
  if (cursor) constraints.push(startAfter(cursor));
  const snap = await getDocs(query(messagesRef, ...constraints));
  const messages = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt ? d.data().createdAt.toDate() : null,
  }));
  const nextCursor = snap.docs.length === PAGE_SIZE ? snap.docs[snap.docs.length - 1] : null;
  return { messages, nextCursor };
}

/**
 * 投稿を送信する（design.md 3-2章）。
 * バリデーション（空文字・文字数・NGワード）は呼び出し側（コンポーネント）で行う。
 */
export async function postMessage({ code, name, uid, text, authorName, authorIcon, streak }) {
  const postRef = doc(db, 'posts', code);
  const messagesRef = collection(db, 'posts', code, 'messages');

  // 【2026-09-12 統括リーダーによる修正】戻り値のドキュメントIDを呼び出し側に返すようにした。
  // 修正前は呼び出し側（StockChatPage）が楽観的更新で `local-${Date.now()}` という仮IDを
  // 表示に使っており、投稿直後（再読み込み前）にその投稿を通報しようとすると
  // Firestore上に存在しないIDを参照してしまい「message-not-found」で常に失敗する不具合があった。
  //
  // 【2026-09-12 追加】個人設定（表示名・アイコン）機能。投稿時点の設定を各投稿にそのまま
  // 保存する（後から名前を変えても過去の投稿の表示は変わらない、という単純な仕様にする）。
  // 未設定の場合は空文字/nullのままにし、表示側で従来の匿名アバターにフォールバックする。
  //
  // 【2026-09-13 追加】リアクション機能（likeCount）と連続投稿記録（streak）。
  // streakはlocalStorage側（utils/streak.js）で計算した投稿時点の値をそのまま保存する
  // （後から連続記録が途切れても、過去の投稿の表示は変わらない）。
  const newDocRef = await addDoc(messagesRef, {
    text,
    anonId: uid,
    authorName: authorName || '',
    authorIcon: authorIcon || '',
    createdAt: serverTimestamp(),
    reportCount: 0,
    hidden: false,
    likeCount: 0,
    streak: streak || 0,
  });

  // サマリドキュメント（トップ画面の注目銘柄表示・監視用途、design.md 4-2章）。
  // 失敗しても投稿自体は成功させたいベストエフォート更新のため、失敗時は握りつぶす。
  try {
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(postRef);
      const prevCount = snap.exists() ? snap.data().messageCount ?? 0 : 0;
      transaction.set(
        postRef,
        {
          code,
          name,
          messageCount: prevCount + 1,
          lastPostAt: serverTimestamp(),
        },
        { merge: true }
      );
    });
  } catch {
    // messageCountは目安表示用の非厳密な値のため、失敗は無視してよい（design.md 4-2章/6-4章）
  }

  return newDocRef.id;
}

/**
 * 通報を送信する（design.md 3-4章）。
 * reports/{uid} をドキュメントIDにすることで1ユーザー1投稿につき1通報までを構造的に保証する。
 * 既に通報済みの場合は 'already-reported' エラーをthrowする。
 */
export async function submitReport({ code, messageId, uid, reason, comment }) {
  const reportRef = doc(db, 'posts', code, 'messages', messageId, 'reports', uid);
  const messageRef = doc(db, 'posts', code, 'messages', messageId);

  await runTransaction(db, async (transaction) => {
    const reportSnap = await transaction.get(reportRef);
    if (reportSnap.exists()) {
      throw new Error('already-reported');
    }
    const messageSnap = await transaction.get(messageRef);
    if (!messageSnap.exists()) {
      throw new Error('message-not-found');
    }
    const currentCount = messageSnap.data().reportCount ?? 0;
    const newCount = currentCount + 1;

    transaction.set(reportRef, {
      reason,
      comment: comment ?? '',
      createdAt: serverTimestamp(),
    });
    transaction.update(messageRef, {
      reportCount: newCount,
      hidden: newCount >= REPORT_HIDE_THRESHOLD,
    });
  });
}

/**
 * いいねをトグルする（2026-09-13 追加：リアクション機能）。
 * likes/{uid} をドキュメントIDにすることで1ユーザー1投稿につき1いいねまでを構造的に保証しつつ、
 * 通報とは異なり削除も許可することで取り消し（トグルオフ）を可能にする。
 * @returns {Promise<boolean>} トグル後の状態（true=いいね済み）
 */
export async function toggleLike({ code, messageId, uid }) {
  const likeRef = doc(db, 'posts', code, 'messages', messageId, 'likes', uid);
  const messageRef = doc(db, 'posts', code, 'messages', messageId);

  return runTransaction(db, async (transaction) => {
    const likeSnap = await transaction.get(likeRef);
    const messageSnap = await transaction.get(messageRef);
    if (!messageSnap.exists()) {
      throw new Error('message-not-found');
    }
    const currentCount = messageSnap.data().likeCount ?? 0;

    if (likeSnap.exists()) {
      transaction.delete(likeRef);
      transaction.update(messageRef, { likeCount: Math.max(0, currentCount - 1) });
      return false;
    }
    transaction.set(likeRef, { createdAt: serverTimestamp() });
    transaction.update(messageRef, { likeCount: currentCount + 1 });
    return true;
  });
}
