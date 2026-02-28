import React, { useEffect, useState } from 'react';
import { getWelcomeSettings } from '../../services/api';
import type { WelcomeSettings } from '../../types';

interface WelcomePopupProps {
  open: boolean;
  onClose: () => void;
}

const WelcomePopup: React.FC<WelcomePopupProps> = ({ open, onClose }) => {
  const [settings, setSettings] = useState<WelcomeSettings | null>(null);

  useEffect(() => {
    if (open && !settings) {
      getWelcomeSettings().then(setSettings).catch(() => {});
    }
  }, [open, settings]);

  if (!open || !settings) return null;

  const handleBackdropClick = () => {
    localStorage.setItem('welcome_seen', 'true');
    onClose();
  };

  const handleBtnClick = (url: string) => {
    if (url && url !== '#') {
      window.open(url, '_blank', 'noopener');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[3000] flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

      <div
        className="relative w-full max-w-sm glass-panel-solid shadow-2xl animate-slide-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleBackdropClick}
          className="absolute top-3 right-3 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-colors text-sm"
        >
          ✕
        </button>

        <div className="flex flex-col items-center px-6 pt-8 pb-6">
          <div className="w-[75px] h-[75px] rounded-full overflow-hidden border-2 border-accent/40 shadow-lg mb-4 bg-primary-dark shrink-0">
            <img
              src={settings.welcome_image}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>

          <h2 className="font-display text-lg font-bold text-white text-center leading-tight">
            {settings.welcome_title}
          </h2>

          <p className="text-sm text-white/60 text-center mt-3 leading-relaxed">
            {settings.welcome_text}
          </p>

          <div className="flex gap-3 mt-6 w-full">
            {settings.welcome_btn1_text && (
              <button
                onClick={() => handleBtnClick(settings.welcome_btn1_url)}
                className="flex-1 px-4 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/80 transition-colors"
              >
                {settings.welcome_btn1_text}
              </button>
            )}
            {settings.welcome_btn2_text && (
              <button
                onClick={() => handleBtnClick(settings.welcome_btn2_url)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-white/20 text-white/70 text-sm font-medium hover:bg-white/10 hover:text-white transition-colors"
              >
                {settings.welcome_btn2_text}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePopup;
