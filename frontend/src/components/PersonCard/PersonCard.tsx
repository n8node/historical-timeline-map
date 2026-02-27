import React, { useEffect, useState, useCallback } from 'react';
import { getPersonDetail } from '../../services/api';
import type { Person } from '../../types';

interface PersonCardProps {
  personId: string | null;
  onClose: () => void;
}

const formatYear = (year: number, approximate?: boolean): string => {
  const prefix = approximate ? '~' : '';
  if (year < 0) return `${prefix}${Math.abs(year)} г. до н.э.`;
  return `${prefix}${year} г.`;
};

const PersonCard: React.FC<PersonCardProps> = ({ personId, onClose }) => {
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);

  useEffect(() => {
    if (!personId) {
      setPerson(null);
      return;
    }
    setLoading(true);
    setActivePhoto(0);
    getPersonDetail(personId)
      .then(setPerson)
      .catch(() => setPerson(null))
      .finally(() => setLoading(false));
  }, [personId]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!personId) return null;

  const allPhotos = person
    ? [person.main_photo_url, ...person.photos.map((p) => p.photo_url)]
    : [];

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

      {/* Card */}
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-panel-solid shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 text-white/80 hover:bg-black/60 hover:text-white transition-colors"
        >
          ✕
        </button>

        {loading ? (
          <div className="p-8 space-y-4">
            <div className="skeleton h-64 w-full rounded-t-xl" />
            <div className="skeleton h-8 w-2/3" />
            <div className="skeleton h-4 w-1/2" />
            <div className="skeleton h-20 w-full" />
          </div>
        ) : person ? (
          <>
            {/* Photo gallery */}
            <div className="relative">
              <div className="aspect-[16/10] overflow-hidden rounded-t-xl bg-primary-dark">
                <img
                  src={allPhotos[activePhoto] || ''}
                  alt={person.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiMxYTFhMmUiLz48dGV4dCB4PSIyMDAiIHk9IjE1MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzY2NiIgZm9udC1zaXplPSI0MCI+8J+RpDwvdGV4dD48L3N2Zz4=';
                  }}
                />
              </div>

              {allPhotos.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                  {allPhotos.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActivePhoto(i)}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        i === activePhoto
                          ? 'bg-accent scale-110'
                          : 'bg-white/40 hover:bg-white/60'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Era badge */}
              {person.era && (
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-medium bg-black/50 backdrop-blur-sm text-white/90">
                  {person.era}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Name and activity */}
              <div>
                <h2 className="font-display text-2xl font-bold text-white">
                  {person.name}
                </h2>
                {person.name_original && (
                  <p className="text-sm text-white/40 mt-0.5">{person.name_original}</p>
                )}
                {person.activity_description && (
                  <p className="text-accent font-medium mt-1">{person.activity_description}</p>
                )}
              </div>

              {/* Life dates and places */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-accent/80 mt-0.5">★</span>
                  <div>
                    <div className="text-white/90">
                      {formatYear(person.birth_year, person.birth_year_approximate)}
                    </div>
                    {person.birth_place_name && (
                      <div className="text-white/50 text-xs">{person.birth_place_name}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-white/40 mt-0.5">†</span>
                  <div>
                    <div className="text-white/90">
                      {formatYear(person.death_year, person.death_year_approximate)}
                    </div>
                    {person.death_place_name && (
                      <div className="text-white/50 text-xs">{person.death_place_name}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio */}
              {person.short_bio && (
                <p className="text-white/70 text-sm leading-relaxed border-l-2 border-accent/30 pl-4">
                  {person.short_bio}
                </p>
              )}

              {/* Full description */}
              <div>
                <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-2">
                  Биография
                </h3>
                <p className="text-white/80 text-sm leading-relaxed">
                  {person.description}
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="p-8 text-center text-white/50">
            Персона не найдена
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonCard;
