// 銘柄検索ロジック（design.md 3-1章）
// クライアント側JavaScriptでのフィルタ。Firestoreへの問い合わせは発生させない。

// ひらがな→カタカナ変換 + 全角/半角・大文字/小文字を正規化
export function normalize(str) {
  if (!str) return '';
  return str
    .toString()
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[ぁ-ゖ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) + 0x60));
}

/**
 * 並び順：①コード完全一致 → ②銘柄名の前方一致 → ③銘柄名の部分一致
 * @param {Array<{code:string,name:string,nameKana?:string,market?:string,sector?:string}>} stocks
 * @param {string} query
 */
export function searchStocks(stocks, query) {
  const rawQuery = (query ?? '').trim();
  if (!rawQuery) return [];
  const q = normalize(rawQuery);

  const matched = [];
  for (const stock of stocks) {
    const code = stock.code ?? '';
    const name = normalize(stock.name);
    const kana = normalize(stock.nameKana);

    let priority = null;
    if (code === rawQuery) {
      priority = 0;
    } else if (name.startsWith(q) || (kana && kana.startsWith(q))) {
      priority = 1;
    } else if (name.includes(q) || (kana && kana.includes(q)) || code.includes(rawQuery)) {
      priority = 2;
    }

    if (priority !== null) {
      matched.push({ stock, priority });
    }
  }

  matched.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return (a.stock.name ?? '').localeCompare(b.stock.name ?? '', 'ja');
  });

  return matched.map((m) => m.stock);
}
