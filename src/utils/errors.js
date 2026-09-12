// エラー分類（design.md 画面6・8章：エラー/枠上限案内の共通フォールバックUI）
// Firestoreの無料枠上限到達（resource-exhausted）等を判別し、文言を出し分ける。

export const ERROR_KIND = {
  WRITE_FAILED: 'write_failed',
  READ_FAILED: 'read_failed',
  STOCK_MASTER_FAILED: 'stock_master_failed',
  NETWORK: 'network',
};

const MESSAGES = {
  [ERROR_KIND.WRITE_FAILED]: '現在アクセスが集中しています。しばらく時間をおいて再度お試しください。',
  [ERROR_KIND.READ_FAILED]: '情報の取得に失敗しました。しばらくしてから再度お試しください。',
  [ERROR_KIND.STOCK_MASTER_FAILED]: '銘柄情報を読み込めませんでした。通信環境をご確認のうえ再度お試しください。',
  [ERROR_KIND.NETWORK]: '通信エラーが発生しました。',
};

export function messageForErrorKind(kind) {
  return MESSAGES[kind] ?? MESSAGES[ERROR_KIND.NETWORK];
}

/**
 * Firebaseのエラーオブジェクトから、読み取り/書き込み/ネットワークのどれに相当するかを推定する。
 * Firestore無料枠の上限到達はSDK上 'resource-exhausted' として表れる。
 */
export function classifyFirebaseError(err, { operation } = {}) {
  const code = err?.code ?? '';
  if (code.includes('unavailable') || code.includes('network')) {
    return ERROR_KIND.NETWORK;
  }
  if (operation === 'write') return ERROR_KIND.WRITE_FAILED;
  if (operation === 'read') return ERROR_KIND.READ_FAILED;
  return ERROR_KIND.NETWORK;
}
