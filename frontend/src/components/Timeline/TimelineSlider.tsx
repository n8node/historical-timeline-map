import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import type { Era, PersonYearRange } from '../../types';

interface TimelineSliderProps {
  year: number;
  onYearChange: (year: number) => void;
  eras: Era[];
  personMarkers: PersonYearRange[];
  minYear?: number;
  maxYear?: number;
}

const formatYear = (year: number): string => {
  if (year < 0) return `${Math.abs(year)} до н.э.`;
  if (year === 0) return '1 н.э.';
  return `${year} н.э.`;
};

const STEP_SIZES = [1, 10, 100] as const;

const TimelineSlider: React.FC<TimelineSliderProps> = ({
  year,
  onYearChange,
  eras,
  personMarkers,
  minYear = -5000,
  maxYear = 2026,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showInput, setShowInput] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const range = maxYear - minYear;

  const yearToPercent = useCallback(
    (y: number) => ((y - minYear) / range) * 100,
    [minYear, range]
  );

  const percentToYear = useCallback(
    (pct: number) => Math.round(minYear + (pct / 100) * range),
    [minYear, range]
  );

  const clampYear = useCallback(
    (y: number) => Math.max(minYear, Math.min(maxYear, y)),
    [minYear, maxYear]
  );

  const getYearFromEvent = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return year;
      const rect = trackRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      return percentToYear(pct);
    },
    [percentToYear, year]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      onYearChange(getYearFromEvent(e.clientX));
    },
    [getYearFromEvent, onYearChange]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      setIsDragging(true);
      onYearChange(getYearFromEvent(e.touches[0].clientX));
    },
    [getYearFromEvent, onYearChange]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      onYearChange(getYearFromEvent(clientX));
    };

    const handleUp = () => setIsDragging(false);

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDragging, getYearFromEvent, onYearChange]);

  const handleInputSubmit = () => {
    const parsed = parseInt(inputValue, 10);
    if (!isNaN(parsed) && parsed >= minYear && parsed <= maxYear) {
      onYearChange(parsed);
    }
    setShowInput(false);
  };

  const handleStep = useCallback(
    (delta: number) => {
      onYearChange(clampYear(year + delta));
    },
    [year, onYearChange, clampYear]
  );

  const handleEraClick = useCallback(
    (era: Era) => {
      const mid = Math.round((era.start_year + era.end_year) / 2);
      onYearChange(clampYear(mid));
    },
    [onYearChange, clampYear]
  );

  const personBands = useMemo(() => {
    if (!personMarkers.length) return [];
    return personMarkers.map((p) => ({
      name: p.name,
      left: yearToPercent(p.birth_year),
      width: Math.max(0.3, yearToPercent(p.death_year) - yearToPercent(p.birth_year)),
      era: p.era,
    }));
  }, [personMarkers, yearToPercent]);

  const currentEra = useMemo(() => {
    let best: Era | undefined;
    let bestSpan = Infinity;
    for (const e of eras) {
      if (year >= e.start_year && year <= e.end_year) {
        const span = e.end_year - e.start_year;
        if (span < bestSpan) {
          best = e;
          bestSpan = span;
        }
      }
    }
    return best;
  }, [eras, year]);

  const currentPercent = yearToPercent(year);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-[1000]">
      <div className="glass-panel-solid mx-4 mb-4 px-6 py-4 shadow-2xl">

        {/* Row 1: Era quick-jump buttons */}
        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          <span className="text-white/40 text-[10px] uppercase tracking-wider mr-1 shrink-0">
            Эпохи:
          </span>
          {eras.map((era) => {
            const isActive = currentEra?.name === era.name;
            return (
              <button
                key={era.name}
                onClick={() => handleEraClick(era)}
                className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-all whitespace-nowrap"
                style={{
                  background: isActive ? era.color : 'rgba(255,255,255,0.06)',
                  color: isActive ? '#fff' : era.color,
                  border: `1px solid ${isActive ? era.color : 'rgba(255,255,255,0.1)'}`,
                  boxShadow: isActive ? `0 0 12px ${era.color}50` : 'none',
                }}
              >
                {era.name}
              </button>
            );
          })}
        </div>

        {/* Row 2: Step buttons + Year display + Step buttons */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            {[...STEP_SIZES].reverse().map((step) => (
              <button
                key={`minus-${step}`}
                onClick={() => handleStep(-step)}
                className="px-2 py-1 rounded text-[11px] font-mono text-white/60 bg-white/5 hover:bg-white/15 hover:text-white border border-white/10 transition-all"
                title={`−${step} ${step === 1 ? 'год' : step < 5 ? 'года' : 'лет'}`}
              >
                −{step}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {showInput ? (
              <form
                onSubmit={(e) => { e.preventDefault(); handleInputSubmit(); }}
                className="flex items-center gap-2"
              >
                <input
                  type="number"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="w-28 px-2 py-1 bg-white/10 border border-white/20 rounded text-sm text-white text-center outline-none focus:border-accent/60"
                  placeholder="Год..."
                  autoFocus
                  min={minYear}
                  max={maxYear}
                />
                <button type="submit" className="text-accent text-sm hover:text-accent/80">
                  OK
                </button>
                <button
                  type="button"
                  onClick={() => setShowInput(false)}
                  className="text-white/50 text-sm hover:text-white/80"
                >
                  X
                </button>
              </form>
            ) : (
              <button
                onClick={() => { setInputValue(String(year)); setShowInput(true); }}
                className="font-display text-2xl font-bold text-white hover:text-accent transition-colors"
                title="Нажмите, чтобы ввести год вручную"
              >
                {formatYear(year)}
              </button>
            )}
          </div>

          <div className="flex items-center gap-1">
            {STEP_SIZES.map((step) => (
              <button
                key={`plus-${step}`}
                onClick={() => handleStep(step)}
                className="px-2 py-1 rounded text-[11px] font-mono text-white/60 bg-white/5 hover:bg-white/15 hover:text-white border border-white/10 transition-all"
                title={`+${step} ${step === 1 ? 'год' : step < 5 ? 'года' : 'лет'}`}
              >
                +{step}
              </button>
            ))}
          </div>
        </div>

        {/* Row 3: Era labels above the track */}
        <div className="relative h-5 mb-1">
          {eras.map((era) => {
            const left = yearToPercent(era.start_year);
            const width = yearToPercent(era.end_year) - left;
            if (width <= 0) return null;
            return (
              <div
                key={era.name}
                className="absolute top-0 h-full flex items-center justify-center overflow-hidden"
                style={{ left: `${Math.max(0, left)}%`, width: `${Math.min(100 - left, width)}%` }}
              >
                <span
                  className="text-[10px] font-medium whitespace-nowrap px-1"
                  style={{ color: era.color, opacity: 0.7 }}
                >
                  {era.name}
                </span>
              </div>
            );
          })}
        </div>

        {/* Row 4: Track with person bands */}
        <div
          ref={trackRef}
          className="relative h-3 rounded-full cursor-pointer select-none"
          style={{
            background: `linear-gradient(to right, #8B4513 0%, #CD853F 15%, #4A5568 30%, #2D8659 45%, #2B6CB0 65%, #E53E3E 100%)`,
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {/* Person life-span bands */}
          {personBands.map((band, i) => (
            <div
              key={i}
              className="absolute top-0 h-full rounded-full pointer-events-none"
              style={{
                left: `${band.left}%`,
                width: `${band.width}%`,
                minWidth: '3px',
                background: 'rgba(255, 255, 255, 0.45)',
                boxShadow: '0 0 4px rgba(255,255,255,0.3)',
              }}
              title={band.name}
            />
          ))}

          {/* Era separators */}
          {eras.map((era) => {
            const pct = yearToPercent(era.start_year);
            if (pct <= 0 || pct >= 100) return null;
            return (
              <div
                key={`sep-${era.name}`}
                className="absolute top-0 bottom-0 w-px bg-white/30"
                style={{ left: `${pct}%` }}
              />
            );
          })}

          {/* Thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10"
            style={{ left: `${currentPercent}%` }}
          >
            <div className="w-6 h-6 rounded-full bg-accent border-2 border-white shadow-lg shadow-accent/40 transition-transform duration-75 hover:scale-110" />
          </div>

          {/* Progress overlay */}
          <div
            className="absolute top-0 left-0 h-full rounded-full bg-white/10 pointer-events-none"
            style={{ width: `${currentPercent}%` }}
          />
        </div>

        {/* Row 5: Scale labels */}
        <div className="flex justify-between mt-2 text-[10px] text-white/40">
          <span>{formatYear(minYear)}</span>
          <span>{formatYear(-3000)}</span>
          <span>{formatYear(-500)}</span>
          <span>0</span>
          <span>{formatYear(500)}</span>
          <span>{formatYear(1000)}</span>
          <span>{formatYear(1500)}</span>
          <span>{formatYear(2000)}</span>
        </div>
      </div>
    </div>
  );
};

export default TimelineSlider;
