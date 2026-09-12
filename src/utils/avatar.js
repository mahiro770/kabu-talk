// 匿名アバター（design.md 1章：共通コンポーネント）
// UID文字列をハッシュ化し、決定的に色相(HSL)を算出した無地の丸アイコンのみを使う。
// イニシャル・画像等、個人を推測させる要素は一切持たない。

export function hashToHue(str) {
  let hash = 0;
  const s = str || 'anonymous';
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  }
  return hash % 360;
}

export function avatarColor(uid) {
  const hue = hashToHue(uid);
  return `hsl(${hue}, 60%, 55%)`;
}
