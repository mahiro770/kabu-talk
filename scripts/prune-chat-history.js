// チャット履歴の保持ポリシー適用バッチ（design.md 6章・6-4章）
//
// 実行方法：GitHub Actions（.github/workflows/prune-chat-history.yml）から日次で実行される。
// 保持ポリシー（design.md 6-1章）：
//   - 銘柄ごとの保持件数上限：3,000件
//   - 保持期間上限：投稿から90日
//   - いずれかの条件に該当した投稿から、古いものを優先して削除する
// 1回の実行における削除件数の上限は5,000件（design.md 6-4章2番）。
// 上限に達して削除しきれなかった分は翌日以降のバッチに持ち越す。
import { getFirestoreAdmin, admin } from './firebaseAdmin.js';

const KEEP_COUNT_PER_STOCK = 3000;
const RETENTION_DAYS = 90;
const MAX_DELETE_PER_RUN = 5000;
const BATCH_LIMIT = 500; // Firestoreの1バッチ書き込み上限

async function deleteInBatches(db, query, remainingBudget) {
  let deleted = 0;
  while (deleted < remainingBudget) {
    const take = Math.min(BATCH_LIMIT, remainingBudget - deleted);
    const snap = await query.limit(take).get();
    if (snap.empty) break;
    const batch = db.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    deleted += snap.size;
    if (snap.size < take) break; // これ以上該当ドキュメントがない
  }
  return deleted;
}

async function pruneExpired(db, budget) {
  if (budget <= 0) return 0;
  const cutoff = admin.firestore.Timestamp.fromMillis(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  // collectionGroupクエリで posts/*/messages を横断的に検索し、90日より前の投稿を古い順に削除する。
  const query = db
    .collectionGroup('messages')
    .where('createdAt', '<', cutoff)
    .orderBy('createdAt', 'asc');
  const deleted = await deleteInBatches(db, query, budget);
  console.log(`[prune-chat-history] 保持期間(90日)超過による削除: ${deleted}件`);
  return deleted;
}

async function pruneOverCount(db, budget) {
  if (budget <= 0) return 0;
  let remaining = budget;
  let totalDeleted = 0;

  const postsSnap = await db.collection('posts').get();
  for (const postDoc of postsSnap.docs) {
    if (remaining <= 0) break;
    const code = postDoc.id;
    const messagesRef = db.collection('posts').doc(code).collection('messages');

    // messageCountは目安値であり実際の件数と乖離しうるため（design.md 4-2章・6-4章）、
    // count()集計クエリ（ドキュメント数に依らずコスト1相当）で実件数を確認してから判定する。
    const countSnap = await messagesRef.count().get();
    const total = countSnap.data().count;
    if (total <= KEEP_COUNT_PER_STOCK) continue;

    const excess = Math.min(total - KEEP_COUNT_PER_STOCK, remaining);
    const query = messagesRef.orderBy('createdAt', 'asc');
    const deleted = await deleteInBatches(db, query, excess);
    remaining -= deleted;
    totalDeleted += deleted;
    if (deleted > 0) {
      console.log(`[prune-chat-history] 銘柄 ${code}: 件数上限(3,000件)超過による削除 ${deleted}件`);
    }
  }

  return totalDeleted;
}

async function main() {
  const db = getFirestoreAdmin();

  const expiredDeleted = await pruneExpired(db, MAX_DELETE_PER_RUN);
  const overCountDeleted = await pruneOverCount(db, MAX_DELETE_PER_RUN - expiredDeleted);
  const total = expiredDeleted + overCountDeleted;

  console.log(`[prune-chat-history] 完了: 合計削除件数=${total}件（上限${MAX_DELETE_PER_RUN}件）`);
  if (total >= MAX_DELETE_PER_RUN) {
    console.log(
      '[prune-chat-history] 1回の実行上限に到達しました。削除しきれなかった分は翌日以降のバッチに持ち越されます。' +
        '3日以上この状態が続く場合は監視・運用担当が削除ペースや保持ポリシーの見直しを検討してください（design.md 6-4章）。'
    );
  }
}

main().catch((err) => {
  console.error('[prune-chat-history] 実行中にエラーが発生しました。');
  console.error(err);
  process.exit(1);
});
