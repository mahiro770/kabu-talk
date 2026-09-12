// 銘柄マスタの取得・キャッシュ（design.md 3-1章 / 4-1章）
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const CACHE_KEY = 'stockMasterCache';

export function loadCachedStockMaster() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.stocks)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveCache(cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // 容量超過等でキャッシュ保存に失敗しても、今回ロードした配列はメモリ上で引き続き使える
  }
}

/**
 * 銘柄マスタを取得する。
 * 1. `stockMaster/_meta` を読み取り、versionをキャッシュと比較
 * 2. 異なる場合のみ chunk_0..N を読み取る（同じ場合はFirestoreに触れない）
 * 3. Firestore読み取りに失敗した場合はキャッシュがあればそれを stale フラグ付きで返す
 */
export async function fetchStockMaster() {
  const cached = loadCachedStockMaster();
  let meta;

  try {
    const metaSnap = await getDoc(doc(db, 'stockMaster', '_meta'));
    if (!metaSnap.exists()) {
      if (cached) return { stocks: cached.stocks, stale: true, source: 'cache' };
      throw new Error('stock-master-not-found');
    }
    meta = metaSnap.data();
  } catch (err) {
    if (cached) {
      return { stocks: cached.stocks, stale: true, source: 'cache' };
    }
    throw err;
  }

  if (cached && cached.version === meta.version) {
    return { stocks: cached.stocks, stale: false, source: 'cache' };
  }

  try {
    const chunkCount = meta.chunkCount ?? 0;
    const chunkSnaps = await Promise.all(
      Array.from({ length: chunkCount }, (_, i) => getDoc(doc(db, 'stockMaster', `chunk_${i}`)))
    );
    const stocks = [];
    for (const snap of chunkSnaps) {
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data.stocks)) stocks.push(...data.stocks);
      }
    }
    saveCache({ version: meta.version, updatedAt: Date.now(), stocks });
    return { stocks, stale: false, source: 'network' };
  } catch (err) {
    if (cached) {
      return { stocks: cached.stocks, stale: true, source: 'cache' };
    }
    throw err;
  }
}
