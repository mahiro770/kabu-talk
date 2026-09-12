// 銘柄マスタ更新バッチ(design.md 5章)
//
// 実行方法:GitHub Actions(.github/workflows/update-stock-master.yml)から週1回 or 手動実行される。
// 処理内容:
//   1. J-Quants API(v2)にAPIキー認証でアクセスし、上場銘柄一覧を取得する
//   2. 銘柄コードの重複を除去する
//   3. 2,000件単位でチャンク分割し、stockMaster/chunk_0..N を丸ごと上書きする
//   4. stockMaster/_meta の version を+1、updatedAt/chunkCount/totalCountを更新する
//   5. いずれかの工程で失敗した場合はFirestoreを一切更新せず、前回成功時点のマスタを維持する
//      (design.md 5-2章5番・8章8番)
//
// 【2026-09-12 統括リーダーによる修正】
// J-Quants APIは2025-12-22にv1からv2へ移行し、v1(メールアドレス/パスワード認証)は
// 2026-06-01に完全廃止された。設計時点(v1)の実装ではHTTP 403エラーで失敗するため、
// v2のAPIキー認証(x-api-keyヘッダー)・新エンドポイント(/v2/equities/master)に修正した。
// 参考:https://jpx-jquants.com/en/spec/migration-v1-v2 、 https://jpx-jquants.com/en/spec/eq-master
import { getFirestoreAdmin, admin } from './firebaseAdmin.js';

const JQUANTS_BASE_URL = 'https://api.jquants.com/v2';
const CHUNK_SIZE = 2000;

// J-Quants v2 の市場区分名(MktNm)は、フロントのMarketBadge.jsxが想定する
// 「プライム/スタンダード/グロース」とほぼそのまま一致する想定で変換は行わない。
// (TOKYO PRO MARKET等、3区分に当てはまらない値はMarketBadge側でデフォルト表示にフォールバックする)

function getJquantsApiKey() {
  const apiKey = process.env.JQUANTS_API_KEY;
  if (!apiKey) {
    throw new Error(
      'JQUANTS_API_KEY が設定されていません。J-Quantsダッシュボードの「API Keys」画面で発行し、GitHub Secretsに登録してください。'
    );
  }
  return apiKey;
}

async function safeText(res) {
  try {
    return await res.text();
  } catch {
    return '';
  }
}

function todayDateString() {
  // J-Quants v2 の /equities/master は date パラメータ(YYYY-MM-DD)が必須。
  // 当日時点で有効な最新の上場銘柄一覧を取得する。
  return new Date().toISOString().slice(0, 10);
}

/**
 * 上場銘柄一覧を取得する(J-Quants API v2: GET /equities/master?date=YYYY-MM-DD)。
 * レスポンスは { data: [...], pagination_key } 形式。pagination_key が返る限り取得を続ける。
 */
async function fetchListedInfo(apiKey) {
  const stocks = [];
  let paginationKey;
  const date = todayDateString();

  do {
    const url = new URL(`${JQUANTS_BASE_URL}/equities/master`);
    url.searchParams.set('date', date);
    if (paginationKey) url.searchParams.set('pagination_key', paginationKey);

    const res = await fetch(url, {
      headers: { 'x-api-key': apiKey },
    });
    if (!res.ok) {
      throw new Error(`J-Quants equities/master 失敗: HTTP ${res.status} ${await safeText(res)}`);
    }
    const body = await res.json();
    const data = Array.isArray(body.data) ? body.data : [];
    for (const item of data) {
      if (!item.Code) continue;
      stocks.push({
        code: String(item.Code),
        name: item.CoName ?? '',
        // J-Quants v2 にもふりがな(kana)フィールドは存在しないため空文字とする。
        // 検索(utils/search.js)はnameKanaが空でも銘柄名の通常一致検索で動作する。
        nameKana: '',
        market: item.MktNm ?? '',
        sector: item.S33Nm ?? '',
      });
    }
    paginationKey = body.pagination_key;
  } while (paginationKey);

  return stocks;
}

function dedupeByCode(stocks) {
  const map = new Map();
  for (const s of stocks) {
    map.set(s.code, s); // 後勝ち=重複時は最後に出てきたレコードを採用(design.md 5-2章2番)
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
  console.log('[update-stock-master] J-Quants APIキーを確認します。');
  const apiKey = getJquantsApiKey();

  console.log('[update-stock-master] 上場銘柄一覧を取得します。');
  const rawStocks = await fetchListedInfo(apiKey);
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
  // それを超えることは実運用上ほぼ想定しない(東証約4,000銘柄/2,000件区切り=チャンク数はせいぜい数個)が、
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
  console.error('[update-stock-master] 失敗しました。Firestoreは更新されていません(前回成功時点のマスタを維持)。');
  console.error(err);
  process.exit(1);
});
