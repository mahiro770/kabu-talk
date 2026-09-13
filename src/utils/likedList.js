// 自分がいいねした投稿の記録（2026-09-13 追加：リアクション機能）
// Firestore側の likes/{uid} が正の記録だが、読み取り回数を節約するため
// クライアント側でも直近のいいね履歴をlocalStorageに保持し、UI表示（ハートの塗りつぶし）に使う。
// 通報とは異なり、いいねはトグル（取り消し）できるためremoveも用意する。
const KEY = 'likedMessageIds';

function keyFor(code, messageId) {
  return `${code}:${messageId}`;
}

function getAll() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveAll(arr) {
  try {
    localStorage.setItem(KEY, JSON.stringify(arr));
  } catch {
    // ignore
  }
}

export function hasLiked(code, messageId) {
  return getAll().includes(keyFor(code, messageId));
}

export function markLiked(code, messageId) {
  const current = getAll();
  const key = keyFor(code, messageId);
  if (!current.includes(key)) {
    current.push(key);
    saveAll(current);
  }
}

export function unmarkLiked(code, messageId) {
  const key = keyFor(code, messageId);
  saveAll(getAll().filter((k) => k !== key));
}
