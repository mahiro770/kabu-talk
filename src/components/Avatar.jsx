import { avatarColor } from '../utils/avatar';

// 匿名アバター：UIDから決定的に色相を算出した無地の丸アイコン（design.md 1章）
// 【2026-09-12 追加】個人設定でアイコン（プリセット絵文字）が選ばれている投稿は、
// その絵文字を丸背景の中に表示する。未設定の投稿は従来どおり無地の丸のまま。
export default function Avatar({ uid, icon, size = 36 }) {
  const color = avatarColor(uid);
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: color,
        flexShrink: 0,
        fontSize: size * 0.6,
        lineHeight: 1,
      }}
    >
      {icon || ''}
    </span>
  );
}
