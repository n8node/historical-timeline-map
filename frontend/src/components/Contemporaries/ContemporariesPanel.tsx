import React, { useState, useMemo } from 'react';
import type { PersonYearRange } from '../../types';

interface ContemporariesPanelProps {
  year: number;
  personMarkers: PersonYearRange[];
  onPersonClick: (id: string) => void;
}

const ADULT_AGE = 20;

const formatYr = (y: number): string =>
  y < 0 ? `${Math.abs(y)} до н.э.` : `${y}`;

interface AdultPerson {
  id: string;
  name: string;
  birthYear: number;
  deathYear: number;
  age: number;
  adultFrom: number;
  era: string | null;
  contemporaries: Contemporary[];
}

interface Contemporary {
  id: string;
  name: string;
  from: number;
  to: number;
  duration: number;
}

const ContemporariesPanel: React.FC<ContemporariesPanelProps> = ({ year, personMarkers, onPersonClick }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const adults: AdultPerson[] = useMemo(() => {
    const alive = personMarkers.filter(
      (p) => p.birth_year + ADULT_AGE <= year && p.death_year >= year
    );

    return alive
      .map((p) => {
        const adultFrom = p.birth_year + ADULT_AGE;
        const contList: Contemporary[] = [];

        for (const other of personMarkers) {
          if (other === p) continue;
          if (other.birth_year + ADULT_AGE > year || other.death_year < year) continue;
          const otherAdultFrom = other.birth_year + ADULT_AGE;
          const from = Math.max(adultFrom, otherAdultFrom);
          const to = Math.min(p.death_year, other.death_year);
          if (from < to) {
            contList.push({
              id: other.id,
              name: other.name,
              from,
              to,
              duration: to - from,
            });
          }
        }

        contList.sort((a, b) => b.duration - a.duration);

        return {
          id: p.id,
          name: p.name,
          birthYear: p.birth_year,
          deathYear: p.death_year,
          age: year - p.birth_year,
          adultFrom,
          era: p.era,
          contemporaries: contList,
        };
      })
      .sort((a, b) => b.contemporaries.length - a.contemporaries.length);
  }, [year, personMarkers]);

  const toggleExpand = (idx: number) => {
    setExpandedIdx(expandedIdx === idx ? null : idx);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="absolute top-20 left-4 z-[1000] glass-panel px-3 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/[0.12] transition-all pointer-events-auto flex items-center gap-2"
        title="Показать современников"
      >
        <span className="text-base">👥</span>
        <span className="font-mono text-accent font-bold">{adults.length}</span>
      </button>
    );
  }

  return (
    <div className="absolute top-20 left-4 z-[1000] pointer-events-auto flex flex-col" style={{ maxHeight: 'calc(100vh - 220px)' }}>
      <div className="glass-panel-solid shadow-2xl flex flex-col overflow-hidden" style={{ width: '320px', maxHeight: '100%' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>👥</span> Современники
            </h2>
            <p className="text-[10px] text-white/40 mt-0.5">
              Взрослые (20+ лет) в {formatYr(year)} — <span className="text-accent font-bold">{adults.length}</span> чел.
            </p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white/40 hover:text-white text-lg transition-colors px-1"
            title="Свернуть"
          >
            ✕
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 scrollbar-thin" style={{ maxHeight: 'calc(100vh - 290px)' }}>
          {adults.length === 0 ? (
            <div className="px-4 py-8 text-center text-white/30 text-sm">
              Нет взрослых персон в этом году
            </div>
          ) : (
            adults.map((person, idx) => {
              const isExpanded = expandedIdx === idx;
              const shown = isExpanded ? person.contemporaries : person.contemporaries.slice(0, 0);

              return (
                <div
                  key={`${person.name}-${person.birthYear}`}
                  className="border-b border-white/5 last:border-b-0"
                >
                  <button
                    onClick={() => toggleExpand(idx)}
                    className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors flex items-start gap-2"
                  >
                    <span className="text-[10px] mt-1 text-white/30 shrink-0">
                      {isExpanded ? '▼' : '▶'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span
                          className="text-[13px] font-semibold text-white truncate cursor-pointer hover:text-accent transition-colors"
                          onClick={(e) => { e.stopPropagation(); onPersonClick(person.id); }}
                        >{person.name}</span>
                        <span className="relative group text-[11px] text-white/40 font-mono shrink-0 cursor-help">
                          🎂 {person.age}
                          <span className="pointer-events-none absolute bottom-full right-0 mb-1.5 px-2.5 py-1 rounded-md bg-black/90 backdrop-blur-sm text-[10px] text-white whitespace-nowrap shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                            Возраст на {formatYr(year)}
                          </span>
                        </span>
                      </div>
                      <div className="text-[10px] text-white/30 mt-0.5">
                        {formatYr(person.birthYear)} — {formatYr(person.deathYear)}
                        <span className="mx-1">·</span>
                        <span className="text-accent/70">{person.contemporaries.length} связей</span>
                      </div>
                    </div>
                  </button>

                  {isExpanded && person.contemporaries.length > 0 && (
                    <div className="px-4 pb-3 pl-8">
                      <div className="text-[10px] text-white/40 mb-1.5 uppercase tracking-wider">
                        Мог общаться с:
                      </div>
                      <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin">
                        {shown.map((c, ci) => (
                          <div
                            key={ci}
                            className="flex items-baseline justify-between text-[11px] gap-2 py-0.5"
                          >
                            <span
                              className="text-white/70 truncate cursor-pointer hover:text-accent transition-colors"
                              onClick={() => onPersonClick(c.id)}
                            >{c.name}</span>
                            <span className="text-white/30 font-mono shrink-0 text-[10px]">
                              {c.duration} {c.duration === 1 ? 'год' : c.duration < 5 ? 'года' : 'лет'} общения ({formatYr(c.from)}–{formatYr(c.to)})
                            </span>
                          </div>
                        ))}
                      </div>
                      {person.contemporaries.length > 20 && (
                        <div className="text-[10px] text-white/20 mt-1 text-center">
                          всего {person.contemporaries.length} связей
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ContemporariesPanel;
