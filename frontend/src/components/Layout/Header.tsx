import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface HeaderProps {
  personCount: number;
}

const Header: React.FC<HeaderProps> = ({ personCount }) => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <header className="absolute top-0 left-0 right-0 z-[1000] pointer-events-none">
      <div className="flex items-center justify-between p-4">
        {/* Logo */}
        <Link
          to="/"
          className="pointer-events-auto glass-panel px-4 py-2.5 flex items-center gap-3 hover:bg-white/[0.12] transition-colors group"
        >
          <span className="text-2xl">🌍</span>
          <div>
            <h1 className="font-display text-lg font-bold text-white leading-tight group-hover:text-accent transition-colors">
              Historical Timeline
            </h1>
            <p className="text-[10px] text-white/40 uppercase tracking-widest">
              Map of History
            </p>
          </div>
        </Link>

        {/* Right panel */}
        <div className="pointer-events-auto flex items-center gap-3">
          {!isAdmin && personCount > 0 && (
            <div className="glass-panel px-3 py-2 text-sm text-white/60">
              <span className="text-accent font-bold">{personCount}</span>{' '}
              {personCount === 1 ? 'персона' : personCount < 5 ? 'персоны' : 'персон'} на карте
            </div>
          )}
          <Link
            to={isAdmin ? '/' : '/admin'}
            className="glass-panel px-4 py-2.5 text-sm font-medium text-white/70 hover:text-white hover:bg-white/[0.12] transition-all"
          >
            {isAdmin ? '← Карта' : 'Админ-панель'}
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
