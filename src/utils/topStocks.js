// トップ画面の注目銘柄リスト（design.md 画面1：任意表示・優先度低）
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export async function fetchTopStocks(count = 10) {
  const postsRef = collection(db, 'posts');
  const snap = await getDocs(query(postsRef, orderBy('messageCount', 'desc'), limit(count)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
