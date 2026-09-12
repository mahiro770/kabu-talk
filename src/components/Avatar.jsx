import { avatarColor } from '../utils/avatar';

// 匿名アバター：UIDから決定的に色相を算出した無地の丸アイコン（design.md 1章）
export default function Avatar({ uid, size = 36 }) {
  const color = avatarColor(uid);
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: color,
        flexShrink: 0,
      }}
    />
  );
}
