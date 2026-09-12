import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { hasAgreedToTerms, agreeToTerms } from '../utils/terms';
import './TermsPage.css';

// 利用規約・免責事項画面（design.md 画面5）
export default function TermsPage() {
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(hasAgreedToTerms());

  function handleAgree() {
    agreeToTerms();
    setAgreed(true);
  }

  return (
    <div className="page terms-page">
      <Header title="利用規約・免責事項" showBack />

      <main className="terms-page__main">
        <section>
          <h2>1. 本サービスの位置づけ</h2>
          <p>
            本サービス（カブトーク、以下「本サービス」）は、銘柄ごとに匿名のユーザー同士が「明日の値動き」等について
            意見を投稿し合うチャットアプリです。本サービスおよび運営者は投資助言・投資推奨を一切行いません。
            本サービス上の投稿はすべて、投稿者個人の匿名の意見・予想であり、運営者の見解を示すものではありません。
          </p>
        </section>

        <section>
          <h2>2. 免責事項</h2>
          <p>
            本サービス上の投稿内容の正確性・完全性・有用性について、運営者は一切保証しません。
            投稿内容を利用したことにより生じたいかなる損害についても、運営者は責任を負いません。
            投資判断は、必ずご自身の責任と判断で行ってください。
          </p>
        </section>

        <section>
          <h2>3. 禁止事項</h2>
          <ul>
            <li>誹謗中傷、差別的な表現、脅迫的な表現を含む投稿</li>
            <li>スパム行為、勧誘、宣伝を目的とした投稿</li>
            <li>個人情報（電話番号、メールアドレス、住所等）を含む投稿</li>
            <li>法令に違反する行為、またはそれを助長する投稿</li>
            <li>その他、本サービスの運営を妨げる行為</li>
          </ul>
        </section>

        <section>
          <h2>4. 通報・モデレーション方針</h2>
          <p>
            投稿は他の利用者から通報される場合があります。同一の投稿に対して一定件数（3件）の通報が集まった場合、
            当該投稿は自動的に非表示になります。非表示になった投稿は運営者が事後的に確認します。
            自動モデレーションの性質上、正当な投稿が誤って非表示になる可能性、または不適切な投稿がすり抜ける可能性が
            あることをあらかじめご了承ください。
          </p>
        </section>

        <section>
          <h2>5. 匿名ID・データの取り扱い</h2>
          <p>
            本サービスは会員登録を必要とせず、ブラウザ・端末ごとに自動的に匿名IDを発行します。投稿は匿名IDに
            紐づいて保存されますが、氏名・連絡先等の個人を特定できる情報の収集は行いません。
            ブラウザのデータを削除した場合や別端末・別ブラウザでアクセスした場合、匿名IDは新しく発行され、
            ブロック設定・通報履歴・規約同意状態は引き継がれません。
          </p>
        </section>

        <section>
          <h2>6. 規約の変更について</h2>
          <p>
            本規約の内容は、事前の予告なく変更されることがあります。変更後の規約は本ページに掲載した時点で効力を
            生じるものとします。
          </p>
        </section>

        <section>
          <h2>7. お問い合わせ</h2>
          <p>
            本サービスに関するお問い合わせは、本サービスの運営者宛にご連絡ください（お問い合わせ窓口は準備中です）。
          </p>
        </section>
      </main>

      {!agreed && (
        <div className="terms-page__agree-bar">
          <button type="button" className="terms-page__agree-button" onClick={handleAgree}>
            同意して利用する
          </button>
        </div>
      )}

      {agreed && (
        <div className="terms-page__agreed-bar">
          <span>同意済みです</span>
          <button type="button" onClick={() => navigate('/')}>
            トップへ戻る
          </button>
        </div>
      )}

      <Footer />
    </div>
  );
}
