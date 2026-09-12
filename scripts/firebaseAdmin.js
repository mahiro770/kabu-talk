// firebase-admin SDKの初期化（design.md 0-3章・SECURITY.md準拠）
//
// サービスアカウント鍵は絶対にリポジトリにコミットしない。
// GitHub Secrets の FIREBASE_SERVICE_ACCOUNT_KEY に、Firebaseコンソールで発行した
// サービスアカウント鍵（JSON）の中身をそのまま文字列として登録し、環境変数経由で読む。
import admin from 'firebase-admin';

let app;

export function getFirestoreAdmin() {
  if (!app) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!raw) {
      throw new Error(
        'FIREBASE_SERVICE_ACCOUNT_KEY が設定されていません。GitHub Secretsにサービスアカウント鍵(JSON)を登録してください。'
      );
    }
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(raw);
    } catch {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY のJSONパースに失敗しました。値が正しいJSON文字列か確認してください。');
    }
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  return admin.firestore();
}

export { admin };
