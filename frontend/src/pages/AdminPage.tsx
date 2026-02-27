import React from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Dashboard from '../components/Admin/Dashboard';
import PersonList from '../components/Admin/PersonList';
import PersonForm from '../components/Admin/PersonForm';
import Login from '../components/Admin/Login';

const AdminLayout: React.FC = () => {
  const { isLoggedIn, logoutUser } = useAuth();
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/admin/login" replace />;
  }

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="min-h-screen bg-primary flex">
      {/* Sidebar */}
      <aside className="w-64 bg-primary-light/50 border-r border-white/[0.08] flex flex-col flex-shrink-0">
        <Link to="/" className="p-5 flex items-center gap-3 border-b border-white/[0.08] hover:bg-white/[0.04] transition-colors">
          <span className="text-2xl">🌍</span>
          <div>
            <h1 className="font-display text-sm font-bold text-white leading-tight">Historical</h1>
            <p className="text-[10px] text-white/40">Timeline Map</p>
          </div>
        </Link>

        <nav className="flex-1 p-3 space-y-1">
          <NavLink to="/admin" exact active={location.pathname === '/admin'}>
            📊 Дашборд
          </NavLink>
          <NavLink to="/admin/persons" active={isActive('/admin/persons')}>
            👥 Персоны
          </NavLink>
          <NavLink to="/" active={false}>
            🗺 Открыть карту
          </NavLink>
        </nav>

        <div className="p-3 border-t border-white/[0.08]">
          <button
            onClick={logoutUser}
            className="w-full text-left px-4 py-2.5 text-sm text-white/50 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors"
          >
            🚪 Выйти
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-6xl">
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="persons" element={<PersonList />} />
            <Route path="persons/new" element={<PersonForm />} />
            <Route path="persons/:id" element={<PersonForm />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

const NavLink: React.FC<{
  to: string;
  active: boolean;
  exact?: boolean;
  children: React.ReactNode;
}> = ({ to, active, children }) => (
  <Link
    to={to}
    className={`block px-4 py-2.5 text-sm rounded-lg transition-colors ${
      active
        ? 'bg-accent/10 text-accent font-medium'
        : 'text-white/60 hover:text-white hover:bg-white/[0.06]'
    }`}
  >
    {children}
  </Link>
);

const AdminPage: React.FC = () => (
  <Routes>
    <Route path="login" element={<Login />} />
    <Route path="*" element={<AdminLayout />} />
  </Routes>
);

export default AdminPage;
