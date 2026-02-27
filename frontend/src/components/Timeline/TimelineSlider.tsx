import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { Era } from '../../types';

interface TimelineSliderProps {
  year: number;
  onYearChange: (year: number) => void;
  eras: Era[];
  minYear?: number;
  maxYear?: number;
}

const formatYear = (year: number): string => {
  if (year < 0) return `${Math.abs(year)} до н.э.`;
  return `${year} н.э.`;
};

const TimelineSlider: React.FC<TimelineSliderProps> = ({
  year,
  onYearChange,
  eras,
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

  const currentPercent = yearToPercent(year);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-[1000]">
      <div className="glass-panel-solid mx-4 mb-4 px-6 py-4 shadow-2xl">
        {/* Year display */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white/50 text-xs font-medium uppercase tracking-wider">
            Временная шкала
          </h3>
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
                  className="w-24 px-2 py-1 bg-white/10 border border-white/20 rounded text-sm text-white text-center outline-none focus:border-accent/60"
                  placeholder="Год..."
                  autoFocus
                  min={minYear}
                  max={maxYear}
                />
                <button type="submit" className="text-accent text-sm hover:text-accent/80">
                  ✓
                </button>
                <button
                  type="button"
                  onClick={() => setShowInput(false)}
                  className="text-white/50 text-sm hover:text-white/80"
                >
                  ✕
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
        </div>

        {/* Era labels */}
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

        {/* Track */}
        <div
          ref={trackRef}
          className="relative h-3 rounded-full cursor-pointer select-none"
          style={{
            background: `linear-gradient(to right, #8B4513 0%, #CD853F 15%, #4A5568 30%, #2D8659 45%, #2B6CB0 65%, #E53E3E 100%)`,
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
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

        {/* Scale labels */}
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
