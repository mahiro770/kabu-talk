// 自分がすでに通報済みの投稿の記録（design.md 画面4：「通報済み」ラベル表示・再通報の抑止用）
// Firestore側の reports/{reporterUid} が正の記録だが、読み取り回数を節約するため
// クライアント側でも直近の通報履歴をlocalStorageに保持し、UI表示・再送信抑止に使う。
const KEY = 'reportedMessageIds';

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

export function hasReported(code, messageId) {
  return getAll().includes(keyFor(code, messageId));
}

export function markReported(code, messageId) {
  const current = getAll();
  const key = keyFor(code, messageId);
  if (!current.includes(key)) {
    current.push(key);
    try {
      localStorage.setItem(KEY, JSON.stringify(current));
    } catch {
      // ignore
    }
  }
}
