import { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getProfile, saveProfile, PRESET_ICONS, MAX_NAME_LENGTH } from '../utils/profile';
import './SettingsPage.css';

// 個人設定画面（2026-09-12 追加）：表示名・アイコンの設定
export default function SettingsPage() {
  const initial = getProfile();
  const [name, setName] = useState(initial.name);
  const [icon, setIcon] = useState(initial.icon);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  function handleSave(e) {
    e.preventDefault();
    setSaved(false);
    const result = saveProfile({ name, icon });
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError(null);
    setSaved(true);
  }

  return (
    <div className="page settings-page">
      <Header title="個人設定" showBack />

      <main className="settings-page__main">
        <p className="settings-page__note">
          ここで設定した名前・アイコンは、これから投稿する内容に表示されます（今より前の投稿には反映されません）。
          匿名でのご利用のため、本名など個人が特定できる情報は入力しないでください。
        </p>

        <form className="settings-page__form" onSubmit={handleSave}>
          <label className="settings-page__label" htmlFor="settings-name">
            表示名（未設定の場合は匿名のまま表示されます）
          </label>
          <input
            id="settings-name"
            className="settings-page__name-input"
            type="text"
            value={name}
            maxLength={MAX_NAME_LENGTH}
            placeholder="例：かぶ太郎"
            onChange={(e) => {
              setName(e.target.value);
              setSaved(false);
            }}
          />
          <span className="settings-page__count">
            {name.length}/{MAX_NAME_LENGTH}
          </span>

          <span className="settings-page__label">アイコン</span>
          <div className="settings-page__icon-grid">
            {PRESET_ICONS.map((i) => (
              <button
                type="button"
                key={i}
                className={`settings-page__icon-option${icon === i ? ' settings-page__icon-option--selected' : ''}`}
                onClick={() => {
                  setIcon(i);
                  setSaved(false);
                }}
                aria-pressed={icon === i}
                aria-label={`アイコン ${i}`}
              >
                {i}
              </button>
            ))}
          </div>

          {error && <p className="settings-page__error">{error}</p>}
          {saved && <p className="settings-page__saved">保存しました</p>}

          <button type="submit" className="settings-page__save">
            保存する
          </button>
        </form>
      </main>

      <Footer />
    </div>
  );
}
