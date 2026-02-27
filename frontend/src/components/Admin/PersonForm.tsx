import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  adminGetPerson, adminCreatePerson, adminUpdatePerson,
  uploadImage, adminAddPhoto, adminDeletePhoto,
} from '../../services/api';
import type { Person, Photo } from '../../types';
import toast from 'react-hot-toast';

interface FormData {
  name: string;
  name_original: string;
  birth_year: string;
  death_year: string;
  birth_year_approximate: boolean;
  death_year_approximate: boolean;
  birth_lat: string;
  birth_lon: string;
  death_lat: string;
  death_lon: string;
  birth_place_name: string;
  death_place_name: string;
  main_photo_url: string;
  description: string;
  activity_description: string;
  short_bio: string;
  era: string;
  category: string;
  is_published: boolean;
}

const emptyForm: FormData = {
  name: '', name_original: '', birth_year: '', death_year: '',
  birth_year_approximate: false, death_year_approximate: false,
  birth_lat: '', birth_lon: '', death_lat: '', death_lon: '',
  birth_place_name: '', death_place_name: '',
  main_photo_url: '', description: '', activity_description: '',
  short_bio: '', era: '', category: '', is_published: true,
};

const PersonForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id && id !== 'new';
  const navigate = useNavigate();

  const [form, setForm] = useState<FormData>(emptyForm);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    adminGetPerson(id!)
      .then((p: Person) => {
        setForm({
          name: p.name,
          name_original: p.name_original || '',
          birth_year: String(p.birth_year),
          death_year: String(p.death_year),
          birth_year_approximate: p.birth_year_approximate,
          death_year_approximate: p.death_year_approximate,
          birth_lat: p.birth_lat != null ? String(p.birth_lat) : '',
          birth_lon: p.birth_lon != null ? String(p.birth_lon) : '',
          death_lat: p.death_lat != null ? String(p.death_lat) : '',
          death_lon: p.death_lon != null ? String(p.death_lon) : '',
          birth_place_name: p.birth_place_name || '',
          death_place_name: p.death_place_name || '',
          main_photo_url: p.main_photo_url,
          description: p.description,
          activity_description: p.activity_description || '',
          short_bio: p.short_bio || '',
          era: p.era || '',
          category: p.category || '',
          is_published: p.is_published,
        });
        setPhotos(p.photos);
      })
      .catch(() => toast.error('Ошибка загрузки'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      setForm((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
      }));
    },
    []
  );

  const handleMainPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setForm((prev) => ({ ...prev, main_photo_url: url }));
      toast.success('Фото загружено');
    } catch {
      toast.error('Ошибка загрузки фото');
    } finally {
      setUploading(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !isEdit) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const url = await uploadImage(file);
        const updated = await adminAddPhoto(id!, {
          photo_url: url,
          display_order: photos.length,
        });
        setPhotos(updated.photos);
      }
      toast.success('Фото добавлены в галерею');
    } catch {
      toast.error('Ошибка загрузки');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!isEdit) return;
    try {
      await adminDeletePhoto(id!, photoId);
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      toast.success('Фото удалено');
    } catch {
      toast.error('Ошибка удаления фото');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.birth_year || !form.death_year || !form.main_photo_url || !form.description) {
      toast.error('Заполните обязательные поля');
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        name_original: form.name_original || null,
        birth_year: parseInt(form.birth_year, 10),
        death_year: parseInt(form.death_year, 10),
        birth_year_approximate: form.birth_year_approximate,
        death_year_approximate: form.death_year_approximate,
        birth_lat: form.birth_lat ? parseFloat(form.birth_lat) : null,
        birth_lon: form.birth_lon ? parseFloat(form.birth_lon) : null,
        death_lat: form.death_lat ? parseFloat(form.death_lat) : null,
        death_lon: form.death_lon ? parseFloat(form.death_lon) : null,
        birth_place_name: form.birth_place_name || null,
        death_place_name: form.death_place_name || null,
        main_photo_url: form.main_photo_url,
        description: form.description,
        activity_description: form.activity_description || null,
        short_bio: form.short_bio || null,
        era: form.era || null,
        category: form.category || null,
        is_published: form.is_published,
      };

      if (isEdit) {
        await adminUpdatePerson(id!, payload);
        toast.success('Персона обновлена');
      } else {
        const created = await adminCreatePerson(payload);
        toast.success('Персона создана');
        navigate(`/admin/persons/${created.id}`);
      }
    } catch {
      toast.error('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-4xl">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="skeleton h-12 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-white">
          {isEdit ? 'Редактирование' : 'Новая персона'}
        </h2>
        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('/admin/persons')} className="btn-ghost">
            Отмена
          </button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>

      {/* Main photo */}
      <div className="glass-panel p-5 space-y-3">
        <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider">Основное фото</h3>
        <div className="flex items-start gap-4">
          {form.main_photo_url && (
            <div className="w-32 h-32 rounded-lg overflow-hidden bg-white/[0.06] flex-shrink-0">
              <img src={form.main_photo_url} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1 space-y-2">
            <label className="btn-secondary inline-block cursor-pointer">
              {uploading ? 'Загрузка...' : 'Загрузить фото'}
              <input
                type="file"
                accept="image/*"
                onChange={handleMainPhotoUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
            <div className="text-xs text-white/40">или укажите URL:</div>
            <input
              name="main_photo_url"
              value={form.main_photo_url}
              onChange={handleChange}
              className="input-field"
              placeholder="https://..."
            />
          </div>
        </div>
      </div>

      {/* Basic info */}
      <div className="glass-panel p-5 space-y-4">
        <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider">Основная информация</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-white/60 mb-1">Имя *</label>
            <input name="name" value={form.name} onChange={handleChange} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Имя на родном языке</label>
            <input name="name_original" value={form.name_original} onChange={handleChange} className="input-field" />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Деятельность</label>
            <input name="activity_description" value={form.activity_description} onChange={handleChange} className="input-field" />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm text-white/60 mb-1">Эпоха</label>
              <select name="era" value={form.era} onChange={handleChange} className="input-field">
                <option value="">—</option>
                <option value="Древний мир">Древний мир</option>
                <option value="Средневековье">Средневековье</option>
                <option value="Новое время">Новое время</option>
                <option value="Новейшее время">Новейшее время</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm text-white/60 mb-1">Категория</label>
              <select name="category" value={form.category} onChange={handleChange} className="input-field">
                <option value="">—</option>
                <option value="ruler">Правитель</option>
                <option value="scientist">Учёный</option>
                <option value="artist">Деятель искусств</option>
                <option value="military">Военачальник</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Life dates */}
      <div className="glass-panel p-5 space-y-4">
        <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider">Годы жизни</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-white/60 mb-1">Год рождения *</label>
            <input
              name="birth_year" type="number" value={form.birth_year}
              onChange={handleChange} className="input-field" required
              placeholder="-356 для 356 г. до н.э."
            />
            <label className="flex items-center gap-2 mt-2 text-sm text-white/50">
              <input
                type="checkbox" name="birth_year_approximate"
                checked={form.birth_year_approximate}
                onChange={handleChange}
                className="rounded border-white/20"
              />
              Приблизительно
            </label>
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Год смерти *</label>
            <input
              name="death_year" type="number" value={form.death_year}
              onChange={handleChange} className="input-field" required
            />
            <label className="flex items-center gap-2 mt-2 text-sm text-white/50">
              <input
                type="checkbox" name="death_year_approximate"
                checked={form.death_year_approximate}
                onChange={handleChange}
                className="rounded border-white/20"
              />
              Приблизительно
            </label>
          </div>
        </div>
      </div>

      {/* Locations */}
      <div className="glass-panel p-5 space-y-4">
        <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider">Места</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="text-sm text-white/70 font-medium">Место рождения</h4>
            <input name="birth_place_name" value={form.birth_place_name} onChange={handleChange} className="input-field" placeholder="Название места" />
            <div className="grid grid-cols-2 gap-2">
              <input name="birth_lat" type="number" step="any" value={form.birth_lat} onChange={handleChange} className="input-field" placeholder="Широта" />
              <input name="birth_lon" type="number" step="any" value={form.birth_lon} onChange={handleChange} className="input-field" placeholder="Долгота" />
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="text-sm text-white/70 font-medium">Место смерти</h4>
            <input name="death_place_name" value={form.death_place_name} onChange={handleChange} className="input-field" placeholder="Название места" />
            <div className="grid grid-cols-2 gap-2">
              <input name="death_lat" type="number" step="any" value={form.death_lat} onChange={handleChange} className="input-field" placeholder="Широта" />
              <input name="death_lon" type="number" step="any" value={form.death_lon} onChange={handleChange} className="input-field" placeholder="Долгота" />
            </div>
          </div>
        </div>
      </div>

      {/* Texts */}
      <div className="glass-panel p-5 space-y-4">
        <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider">Тексты</h3>
        <div>
          <label className="block text-sm text-white/60 mb-1">Краткое описание</label>
          <textarea name="short_bio" value={form.short_bio} onChange={handleChange} className="textarea-field" rows={2} />
        </div>
        <div>
          <label className="block text-sm text-white/60 mb-1">Полное описание *</label>
          <textarea name="description" value={form.description} onChange={handleChange} className="textarea-field" rows={5} required />
        </div>
      </div>

      {/* Publication status */}
      <div className="glass-panel p-5">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox" name="is_published"
            checked={form.is_published}
            onChange={handleChange}
            className="w-5 h-5 rounded border-white/20 accent-accent"
          />
          <span className="text-white">Опубликовано</span>
        </label>
      </div>

      {/* Photo gallery (edit mode only) */}
      {isEdit && (
        <div className="glass-panel p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider">Галерея</h3>
            <label className="btn-secondary text-xs cursor-pointer">
              {uploading ? 'Загрузка...' : '+ Добавить фото'}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleGalleryUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>
          {photos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {photos.map((photo) => (
                <div key={photo.id} className="relative group rounded-lg overflow-hidden aspect-square bg-white/[0.06]">
                  <img src={photo.photo_url} alt={photo.caption || ''} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleDeletePhoto(photo.id)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500/80 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                  {photo.caption && (
                    <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-black/60 text-xs text-white/80 truncate">
                      {photo.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/40">Нет дополнительных фото</p>
          )}
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end gap-3 pb-8">
        <button type="button" onClick={() => navigate('/admin/persons')} className="btn-ghost">
          Отмена
        </button>
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Сохранение...' : isEdit ? 'Обновить' : 'Создать'}
        </button>
      </div>
    </form>
  );
};

export default PersonForm;
