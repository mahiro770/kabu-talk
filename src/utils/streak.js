// 連続投稿記録（ストリーク）（2026-09-13 追加）
// TikTok/Snapchat等の「連続記録」に近いゲーム性の要素。サーバー側での厳密な集計は行わず、
// localStorageに保存した「最後に投稿した日付」との比較のみで判定する（コストゼロ・実装量最小）。
// 端末・ブラウザが変わればリセットされる（ブロックリスト等と同じ既知の制約）。
const KEY = 'postStreak';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function getState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { lastDate: null, count: 0 };
    const parsed = JSON.parse(raw);
    return {
      lastDate: typeof parsed.lastDate === 'string' ? parsed.lastDate : null,
      count: typeof parsed.count === 'number' ? parsed.count : 0,
    };
  } catch {
    return { lastDate: null, count: 0 };
  }
}

export function getCurrentStreak() {
  return getState().count;
}

/**
 * 投稿した際に呼び出し、更新後のストリーク件数を返す。
 * 同じ日に複数回投稿しても件数は増えない（1日1カウント）。
 */
export function recordPostAndGetStreak() {
  const state = getState();
  const today = todayStr();

  let nextCount;
  if (state.lastDate === today) {
    nextCount = state.count; // 本日すでに投稿済み：据え置き
  } else if (state.lastDate === yesterdayStr()) {
    nextCount = state.count + 1; // 前日から継続
  } else {
    nextCount = 1; // 記録なし、または途切れていた
  }

  try {
    localStorage.setItem(KEY, JSON.stringify({ lastDate: today, count: nextCount }));
  } catch {
    // ignore
  }
  return nextCount;
}
