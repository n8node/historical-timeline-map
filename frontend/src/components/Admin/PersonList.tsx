import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminListPersons, adminDeletePerson } from '../../services/api';
import type { Person } from '../../types';
import toast from 'react-hot-toast';

const formatYear = (y: number) => (y < 0 ? `${Math.abs(y)} до н.э.` : `${y}`);

const PersonList: React.FC = () => {
  const [persons, setPersons] = useState<Person[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [era, setEra] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadPersons = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminListPersons({ page, per_page: 15, search, era });
      setPersons(data.items);
      setTotal(data.total);
      setPages(data.pages);
    } catch {
      toast.error('Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [page, search, era]);

  useEffect(() => {
    loadPersons();
  }, [loadPersons]);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Удалить "${name}"?`)) return;
    try {
      await adminDeletePerson(id);
      toast.success('Персона удалена');
      loadPersons();
    } catch {
      toast.error('Ошибка удаления');
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Поиск по имени..."
            className="input-field w-64"
          />
          <select
            value={era}
            onChange={(e) => { setEra(e.target.value); setPage(1); }}
            className="input-field w-48"
          >
            <option value="">Все эпохи</option>
            <option value="Древний мир">Древний мир</option>
            <option value="Средневековье">Средневековье</option>
            <option value="Новое время">Новое время</option>
            <option value="Новейшее время">Новейшее время</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-white/50">Всего: {total}</span>
          <Link to="/admin/persons/new" className="btn-primary">
            + Добавить
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-3 text-white/50 font-medium">Фото</th>
                <th className="text-left p-3 text-white/50 font-medium">Имя</th>
                <th className="text-left p-3 text-white/50 font-medium hidden md:table-cell">Годы</th>
                <th className="text-left p-3 text-white/50 font-medium hidden lg:table-cell">Эпоха</th>
                <th className="text-left p-3 text-white/50 font-medium hidden lg:table-cell">Категория</th>
                <th className="text-left p-3 text-white/50 font-medium">Статус</th>
                <th className="text-right p-3 text-white/50 font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td colSpan={7} className="p-3"><div className="skeleton h-10 w-full" /></td>
                  </tr>
                ))
              ) : persons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-white/40">
                    Персоны не найдены
                  </td>
                </tr>
              ) : (
                persons.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-white/5 hover:bg-white/[0.03] transition-colors cursor-pointer"
                    onClick={() => navigate(`/admin/persons/${p.id}`)}
                  >
                    <td className="p-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/[0.06]">
                        <img
                          src={p.main_photo_url}
                          alt={p.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-white">{p.name}</div>
                      <div className="text-xs text-white/40">{p.activity_description}</div>
                    </td>
                    <td className="p-3 hidden md:table-cell text-white/60">
                      {formatYear(p.birth_year)} — {formatYear(p.death_year)}
                    </td>
                    <td className="p-3 hidden lg:table-cell text-white/50">{p.era}</td>
                    <td className="p-3 hidden lg:table-cell text-white/50">{p.category}</td>
                    <td className="p-3">
                      <span className={`inline-block w-2 h-2 rounded-full ${p.is_published ? 'bg-green-400' : 'bg-yellow-400'}`} />
                    </td>
                    <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/persons/${p.id}`}
                          className="btn-ghost text-xs"
                        >
                          ✏️
                        </Link>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          className="btn-ghost text-xs text-red-400 hover:text-red-300"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-ghost text-sm disabled:opacity-30"
          >
            ← Назад
          </button>
          <span className="text-sm text-white/50">
            {page} / {pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="btn-ghost text-sm disabled:opacity-30"
          >
            Вперёд →
          </button>
        </div>
      )}
    </div>
  );
};

export default PersonList;
