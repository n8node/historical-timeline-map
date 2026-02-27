import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStats } from '../../services/api';
import type { Stats } from '../../types';

const ERA_COLORS: Record<string, string> = {
  'Древний мир': '#8B4513',
  'Средневековье': '#4A5568',
  'Новое время': '#2B6CB0',
  'Новейшее время': '#E53E3E',
};

const CAT_LABELS: Record<string, string> = {
  ruler: 'Правители',
  scientist: 'Учёные',
  artist: 'Деятели искусств',
  military: 'Военачальники',
};

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="skeleton h-48 rounded-xl" />
          <div className="skeleton h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!stats) {
    return <div className="text-white/50 text-center py-12">Ошибка загрузки статистики</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Всего персон" value={stats.total_persons} icon="👥" />
        <StatCard label="Опубликовано" value={stats.total_published} icon="✅" />
        <StatCard label="Эпох" value={stats.by_era.length} icon="📅" />
        <StatCard label="Категорий" value={stats.by_category.length} icon="📁" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* By era */}
        <div className="glass-panel p-5">
          <h3 className="text-white/60 text-sm font-medium uppercase tracking-wider mb-4">
            По эпохам
          </h3>
          <div className="space-y-3">
            {stats.by_era.map((item) => (
              <div key={item.era}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-white/80">{item.era}</span>
                  <span className="text-white/50">{item.count}</span>
                </div>
                <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(item.count / stats.total_persons) * 100}%`,
                      backgroundColor: ERA_COLORS[item.era] || '#e94560',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By category */}
        <div className="glass-panel p-5">
          <h3 className="text-white/60 text-sm font-medium uppercase tracking-wider mb-4">
            По категориям
          </h3>
          <div className="space-y-3">
            {stats.by_category.map((item) => (
              <div key={item.era}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-white/80">{CAT_LABELS[item.era] || item.era}</span>
                  <span className="text-white/50">{item.count}</span>
                </div>
                <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-500"
                    style={{ width: `${(item.count / stats.total_persons) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="glass-panel p-5">
        <h3 className="text-white/60 text-sm font-medium uppercase tracking-wider mb-4">
          Быстрые действия
        </h3>
        <div className="flex flex-wrap gap-3">
          <Link to="/admin/persons/new" className="btn-primary">
            + Добавить персону
          </Link>
          <Link to="/admin/persons" className="btn-secondary">
            Список персон
          </Link>
          <Link to="/" className="btn-ghost">
            Открыть карту
          </Link>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: number; icon: string }> = ({
  label, value, icon,
}) => (
  <div className="glass-panel p-5 flex items-center gap-4">
    <div className="text-3xl">{icon}</div>
    <div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-white/50">{label}</div>
    </div>
  </div>
);

export default Dashboard;
