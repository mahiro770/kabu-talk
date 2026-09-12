// 投稿時刻の相対表示（design.md 画面3：「3分前」「1時間前」「9/10」）
export function formatRelativeTime(date) {
  if (!date) return '';
  const now = Date.now();
  const diffMs = now - date.getTime();
  if (diffMs < 0) return 'たった今';

  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'たった今';

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}分前`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}時間前`;

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}日前`;

  return `${date.getMonth() + 1}/${date.getDate()}`;
}
