// 個人設定（表示名・アイコン）（2026-09-12 追加機能）
// 匿名性を維持したまま、投稿に自分で選んだ名前・アイコンを表示できるようにする。
// 実在の画像アップロードはモデレーションコスト増・Firebase Storage新規利用を避けるため見送り、
// プリセットの絵文字アイコンから選ぶ方式のみとする（コストゼロ原則・DEV_STANDARDS.md準拠）。
// 保存先はlocalStorageのみ（サーバー保存はしない）。同じ匿名ID(uid)がブラウザ削除等で
// 変わった場合と同様、ブロックリスト等と同じく端末・ブラウザ固有の設定になる（既知の制約）。
import { checkBlockingNgWords } from './ngWordFilter';

const KEY = 'userProfile';
export const MAX_NAME_LENGTH = 20;

export const PRESET_ICONS = ['🐱', '🐶', '🐰', '🦊', '🐼', '🐨', '🐯', '🦁', '🐸', '🐵', '🐷', '🐹'];
export const DEFAULT_ICON = PRESET_ICONS[0];

export function getProfile() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { name: '', icon: DEFAULT_ICON };
    const parsed = JSON.parse(raw);
    return {
      name: typeof parsed.name === 'string' ? parsed.name : '',
      icon: PRESET_ICONS.includes(parsed.icon) ? parsed.icon : DEFAULT_ICON,
    };
  } catch {
    return { name: '', icon: DEFAULT_ICON };
  }
}

/**
 * 表示名・アイコンを検証して保存する。
 * @returns {{ ok: true } | { ok: false, message: string }}
 */
export function saveProfile({ name, icon }) {
  const trimmed = (name ?? '').trim();
  if (trimmed.length > MAX_NAME_LENGTH) {
    return { ok: false, message: `表示名は${MAX_NAME_LENGTH}文字以内で入力してください。` };
  }
  const blocking = checkBlockingNgWords(trimmed);
  if (blocking) {
    return { ok: false, message: '表示名に使用できない文字列が含まれています。' };
  }
  const safeIcon = PRESET_ICONS.includes(icon) ? icon : DEFAULT_ICON;
  try {
    localStorage.setItem(KEY, JSON.stringify({ name: trimmed, icon: safeIcon }));
  } catch {
    return { ok: false, message: '保存に失敗しました。しばらくしてから再度お試しください。' };
  }
  return { ok: true };
}
