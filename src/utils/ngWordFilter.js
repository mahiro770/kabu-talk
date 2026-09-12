// NGワードフィルタ（design.md 7章：二段構え）
// 1. checkBlockingNgWords: 明らかな禁止語句 → 送信ブロック
// 2. checkWarningPhrase: グレーゾーン（断定的な投資助言表現） → 警告のみ、送信は継続可能
import {
  DEFAMATION_WORDS,
  SOLICITATION_PHRASES,
  PERSONAL_INFO_PATTERNS,
  URL_PATTERN,
  DEFINITIVE_PHRASES,
  PRICE_MOVEMENT_WORDS,
  CERTAINTY_WORDS,
} from '../data/ngWords';

export const NG_CATEGORY = {
  DEFAMATION: 'defamation',
  PERSONAL_INFO: 'personal_info',
  SPAM: 'spam',
};

/**
 * 明らかな禁止語句を検知する。該当すればブロック理由を返し、該当しなければnullを返す。
 * @param {string} text
 * @returns {{ category: string, message: string } | null}
 */
export function checkBlockingNgWords(text) {
  if (!text) return null;

  for (const word of DEFAMATION_WORDS) {
    if (text.includes(word)) {
      return {
        category: NG_CATEGORY.DEFAMATION,
        message: '誹謗中傷・侮辱的な表現が含まれている可能性があるため投稿できません。',
      };
    }
  }

  if (URL_PATTERN.test(text)) {
    return {
      category: NG_CATEGORY.SPAM,
      message: 'URLを含む投稿はできません。',
    };
  }

  for (const phrase of SOLICITATION_PHRASES) {
    if (text.includes(phrase)) {
      return {
        category: NG_CATEGORY.SPAM,
        message: '勧誘・スパムと疑われる表現が含まれているため投稿できません。',
      };
    }
  }

  for (const pattern of PERSONAL_INFO_PATTERNS) {
    if (pattern.regex.test(text)) {
      return {
        category: NG_CATEGORY.PERSONAL_INFO,
        message: '個人情報らしき文字列が含まれている可能性があります。内容を確認して修正してください。',
      };
    }
  }

  return null;
}

/**
 * グレーゾーン表現（断定的な投資助言に見える表現）を検知する。ブロックはしない。
 * @param {string} text
 * @returns {boolean}
 */
export function checkWarningPhrase(text) {
  if (!text) return false;
  if (DEFINITIVE_PHRASES.some((phrase) => text.includes(phrase))) return true;
  const hasCertainty = CERTAINTY_WORDS.some((w) => text.includes(w));
  const hasPriceMovement = PRICE_MOVEMENT_WORDS.some((w) => text.includes(w));
  return hasCertainty && hasPriceMovement;
}
