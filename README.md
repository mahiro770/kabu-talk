# カブトーク（匿名株予想チャットアプリ・仮称）

匿名で銘柄ごとに「明日の値動き」を予想し合うチャットアプリ（Vite + React + Firebase）。
詳細仕様は [`../design.md`](../design.md) / [`../requirements.md`](../requirements.md) を、
本番公開に必要な作業（Firebase/J-Quants/GitHub/Cloudflare Pagesの設定）は
[`../SETUP.md`](../SETUP.md) を参照してください。

## このリポジトリの構成

- `src/` : フロントエンド本体（Vite + React SPA）
- `firestore.rules` : Firestoreセキュリティルール
- `scripts/` : GitHub Actionsから実行するバッチ（firebase-admin SDK使用。銘柄マスタ更新・チャット履歴削除）
- `.github/workflows/` : 上記バッチを定期実行するGitHub Actions workflow

## 開発用コマンド

```
npm install
npm run dev    # 開発サーバー起動
npm run build  # 本番ビルド（distフォルダに出力）
npm run lint   # oxlintによる静的解析
```

---

<details>
<summary>Vite公式テンプレートの説明（元テンプレート由来、参考情報）</summary>

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

</details>
