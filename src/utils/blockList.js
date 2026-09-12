// ブロック機能（design.md 3-5章）：Firestoreへの書き込みは発生させず、localStorageのみで管理する。
const KEY = 'blockedAnonIds';

export function getBlockedIds() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function blockAnonId(uid) {
  const current = getBlockedIds();
  if (!current.includes(uid)) {
    current.push(uid);
    try {
      localStorage.setItem(KEY, JSON.stringify(current));
    } catch {
      // localStorage利用不可（プライベートモード等）の場合は当セッション中のみの制約として許容する
    }
  }
  return current;
}

export function isBlocked(uid) {
  return getBlockedIds().includes(uid);
}
