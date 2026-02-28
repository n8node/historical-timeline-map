import React, { useEffect, useState } from 'react';
import { adminGetWelcome, adminUpdateWelcome, uploadImage } from '../../services/api';
import type { WelcomeSettings } from '../../types';

const WelcomeEditor: React.FC = () => {
  const [data, setData] = useState<WelcomeSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    adminGetWelcome().then(setData).catch(() => {});
  }, []);

  const handleChange = (key: keyof WelcomeSettings, value: string) => {
    setData((prev) => prev ? { ...prev, [key]: value } : prev);
    setSaved(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      handleChange('welcome_image', url);
    } catch {
      alert('Ошибка загрузки изображения');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    try {
      const result = await adminUpdateWelcome(data);
      setData(result);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  if (!data) {
    return <div className="text-white/50 p-8">Загрузка...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Приветственное окно</h2>
        <p className="text-sm text-white/40 mt-1">
          Показывается при первом заходе пользователя. Можно открыть повторно через иконку ⚙
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Preview */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Предпросмотр</h3>
          <div className="glass-panel-solid p-6 flex flex-col items-center">
            <div className="w-[75px] h-[75px] rounded-full overflow-hidden border-2 border-accent/40 bg-primary-dark mb-4">
              <img
                src={data.welcome_image}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
            <h4 className="font-display text-lg font-bold text-white text-center">{data.welcome_title}</h4>
            <p className="text-sm text-white/60 text-center mt-2">{data.welcome_text}</p>
            <div className="flex gap-3 mt-4 w-full">
              {data.welcome_btn1_text && (
                <div className="flex-1 px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold text-center">
                  {data.welcome_btn1_text}
                </div>
              )}
              {data.welcome_btn2_text && (
                <div className="flex-1 px-4 py-2 rounded-lg border border-white/20 text-white/70 text-sm text-center">
                  {data.welcome_btn2_text}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Настройки</h3>

          <div>
            <label className="block text-sm text-white/60 mb-1">Изображение</label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="text-sm text-white/60 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-white/10 file:text-white/70 hover:file:bg-white/20 file:cursor-pointer"
              />
              {uploading && <span className="text-xs text-accent">Загрузка...</span>}
            </div>
            <input
              type="text"
              value={data.welcome_image}
              onChange={(e) => handleChange('welcome_image', e.target.value)}
              className="mt-2 w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/80 focus:outline-none focus:border-accent/50"
              placeholder="URL изображения"
            />
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1">Заголовок</label>
            <input
              type="text"
              value={data.welcome_title}
              onChange={(e) => handleChange('welcome_title', e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/80 focus:outline-none focus:border-accent/50"
            />
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1">Текст</label>
            <textarea
              value={data.welcome_text}
              onChange={(e) => handleChange('welcome_text', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/80 focus:outline-none focus:border-accent/50 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-white/60 mb-1">Кнопка 1 — текст</label>
              <input
                type="text"
                value={data.welcome_btn1_text}
                onChange={(e) => handleChange('welcome_btn1_text', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/80 focus:outline-none focus:border-accent/50"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Кнопка 1 — ссылка</label>
              <input
                type="text"
                value={data.welcome_btn1_url}
                onChange={(e) => handleChange('welcome_btn1_url', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/80 focus:outline-none focus:border-accent/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-white/60 mb-1">Кнопка 2 — текст</label>
              <input
                type="text"
                value={data.welcome_btn2_text}
                onChange={(e) => handleChange('welcome_btn2_text', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/80 focus:outline-none focus:border-accent/50"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Кнопка 2 — ссылка</label>
              <input
                type="text"
                value={data.welcome_btn2_url}
                onChange={(e) => handleChange('welcome_btn2_url', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/80 focus:outline-none focus:border-accent/50"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2.5 rounded-lg bg-accent text-white font-semibold hover:bg-accent/80 transition-colors disabled:opacity-50"
          >
            {saving ? 'Сохранение...' : saved ? '✓ Сохранено' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeEditor;
