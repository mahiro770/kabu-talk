// 銘柄マスタ更新バッチ（design.md 5章）
//
// 実行方法：GitHub Actions（.github/workflows/update-stock-master.yml）から週1回 or 手動実行される。
// 処理内容：
//   1. J-Quants APIにログインし、上場銘柄一覧を取得する
//   2. 銘柄コードの重複を除去する
//   3. 2,000件単位でチャンク分割し、stockMaster/chunk_0..N を丸ごと上書きする
//   4. stockMaster/_meta の version を+1、updatedAt/chunkCount/totalCountを更新する
//   5. いずれかの工程で失敗した場合はFirestoreを一切更新せず、前回成功時点のマスタを維持する
//      （design.md 5-2章5番・8章8番）
import { getFirestoreAdmin, admin } from './firebaseAdmin.js';

const JQUANTS_BASE_URL = 'https://api.jquants.com/v1';
const CHUNK_SIZE = 2000;

// J-Quantsの市場区分名(MarketCodeName)は、フロントのMarketBadge.jsxが想定する
// 「プライム/スタンダード/グロース」とほぼそのまま一致するため変換は行わない。
// （TOKYO PRO MARKET等、3区分に当てはまらない値はMarketBadge側でデフォルト表示にフォールバックする）

async function jquantsLogin() {
  const mailaddress = process.env.JQUANTS_MAIL_ADDRESS;
  const password = process.env.JQUANTS_PASSWORD;
  if (!mailaddress || !password) {
    throw new Error(
      'JQUANTS_MAIL_ADDRESS / JQUANTS_PASSWORD が設定されていません。GitHub SecretsにJ-Quantsアカウント情報を登録してください。'
    );
  }

  const userRes = await fetch(`${JQUANTS_BASE_URL}/token/auth_user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mailaddress, password }),
  });
  if (!userRes.ok) {
    throw new Error(`J-Quants auth_user 失敗: HTTP ${userRes.status} ${await safeText(userRes)}`);
  }
  const { refreshToken } = await userRes.json();
  if (!refreshToken) throw new Error('J-Quants auth_user のレスポンスに refreshToken がありません。');

  const refreshRes = await fetch(
    `${JQUANTS_BASE_URL}/token/auth_refresh?refreshtoken=${encodeURIComponent(refreshToken)}`,
    { method: 'POST' }
  );
  if (!refreshRes.ok) {
    throw new Error(`J-Quants auth_refresh 失敗: HTTP ${refreshRes.status} ${await safeText(refreshRes)}`);
  }
  const { idToken } = await refreshRes.json();
  if (!idToken) throw new Error('J-Quants auth_refresh のレスポンスに idToken がありません。');
  return idToken;
}

async function safeText(res) {
  try {
    return await res.text();
  } catch {
    return '';
  }
}

/**
 * 上場銘柄一覧を取得する。J-Quantsのlisted/infoはページングされる場合があるため、
 * pagination_key が返る限り取得を続ける。
 */
async function fetchListedInfo(idToken) {
  const stocks = [];
  let paginationKey;

  do {
    const url = new URL(`${JQUANTS_BASE_URL}/listed/info`);
    if (paginationKey) url.searchParams.set('pagination_key', paginationKey);

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    if (!res.ok) {
      throw new Error(`J-Quants listed/info 失敗: HTTP ${res.status} ${await safeText(res)}`);
    }
    const body = await res.json();
    const info = Array.isArray(body.info) ? body.info : [];
    for (const item of info) {
      if (!item.Code) continue;
      stocks.push({
        code: String(item.Code),
        name: item.CompanyName ?? '',
        // J-Quants listed/info にはふりがな(kana)フィールドが存在しないため空文字とする。
        // 検索(utils/search.js)はnameKanaが空でも銘柄名の通常一致検索で動作する。
        nameKana: '',
        market: item.MarketCodeName ?? '',
        sector: item.Sector33CodeName ?? '',
      });
    }
    paginationKey = body.pagination_key;
  } while (paginationKey);

  return stocks;
}

function dedupeByCode(stocks) {
  const map = new Map();
  for (const s of stocks) {
    map.set(s.code, s); // 後勝ち＝重複時は最後に出てきたレコードを採用（design.md 5-2章2番）
  }
  return Array.from(map.values());
}

function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

async function main() {
  console.log('[update-stock-master] J-Quantsへのログインを開始します。');
  const idToken = await jquantsLogin();

  console.log('[update-stock-master] 上場銘柄一覧を取得します。');
  const rawStocks = await fetchListedInfo(idToken);
  if (rawStocks.length === 0) {
    throw new Error('J-Quantsから取得した銘柄数が0件でした。処理を中断し、Firestoreは更新しません。');
  }

  const stocks = dedupeByCode(rawStocks);
  const chunks = chunkArray(stocks, CHUNK_SIZE);
  console.log(`[update-stock-master] 銘柄数=${stocks.length}件, チャンク数=${chunks.length}`);

  const db = getFirestoreAdmin();
  const metaRef = db.collection('stockMaster').doc('_meta');
  const metaSnap = await metaRef.get();
  const prevMeta = metaSnap.exists ? metaSnap.data() : null;
  const prevChunkCount = prevMeta?.chunkCount ?? 0;
  const nextVersion = (prevMeta?.version ?? 0) + 1;

  // Firestoreのバッチ書き込みは1回あたり最大500件。チャンク数+meta+削除分が
  // それを超えることは実運用上ほぼ想定しない（東証約4,000銘柄/2,000件区切り=チャンク数はせいぜい数個）が、
  // 念のため超過時は複数バッチに分割してcommitする。
  const writes = [];
  chunks.forEach((chunkStocks, i) => {
    writes.push({
      ref: db.collection('stockMaster').doc(`chunk_${i}`),
      data: { chunkIndex: i, stocks: chunkStocks },
    });
  });
  // 新しいチャンク数が前回より少ない場合、余った古いチャンクを削除する
  for (let i = chunks.length; i < prevChunkCount; i++) {
    writes.push({ ref: db.collection('stockMaster').doc(`chunk_${i}`), delete: true });
  }

  const BATCH_LIMIT = 450; // meta更新分の余裕を持たせて500未満に抑える
  for (let i = 0; i < writes.length; i += BATCH_LIMIT) {
    const batch = db.batch();
    for (const w of writes.slice(i, i + BATCH_LIMIT)) {
      if (w.delete) batch.delete(w.ref);
      else batch.set(w.ref, w.data);
    }
    // 最後のバッチでmetaも同時に更新する
    if (i + BATCH_LIMIT >= writes.length) {
      batch.set(metaRef, {
        version: nextVersion,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        chunkCount: chunks.length,
        totalCount: stocks.length,
      });
    }
    await batch.commit();
  }

  console.log(
    `[update-stock-master] 完了: version=${nextVersion}, chunkCount=${chunks.length}, totalCount=${stocks.length}`
  );
}

main().catch((err) => {
  console.error('[update-stock-master] 失敗しました。Firestoreは更新されていません（前回成功時点のマスタを維持）。');
  console.error(err);
  process.exit(1);
});
