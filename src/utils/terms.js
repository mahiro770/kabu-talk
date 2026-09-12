// 利用規約同意状態（design.md 4-3章）：localStorageにのみ保持する。
const KEY = 'termsAgreed';

export function getTermsAgreement() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function agreeToTerms() {
  const value = { agreed: true, agreedAt: new Date().toISOString() };
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // 同意状態を保持できない場合、当セッション中はメモリ上の状態で継続動作する
  }
  return value;
}

export function hasAgreedToTerms() {
  const agreement = getTermsAgreement();
  return !!(agreement && agreement.agreed);
}
