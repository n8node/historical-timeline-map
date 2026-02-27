import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import type { Era, PersonYearRange } from '../../types';

interface TimelineSliderProps {
  year: number;
  onYearChange: (year: number) => void;
  eras: Era[];
  personMarkers: PersonYearRange[];
}

const formatYear = (year: number): string => {
  if (year < 0) return `${Math.abs(year)} до н.э.`;
  if (year === 0) return '1 н.э.';
  return `${year} н.э.`;
};

const formatYearShort = (year: number): string => {
  if (year < 0) return `${Math.abs(year)}`;
  return `${year}`;
};

const STEP_SIZES = [1, 10, 100] as const;
const ZOOM_HALF_SPAN = 50;
const ZOOM_THRESHOLD = 15;

const TimelineSlider: React.FC<TimelineSliderProps> = ({
  year,
  onYearChange,
  eras,
  personMarkers,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingZoom, setIsDraggingZoom] = useState(false);
  const [zoomCenter, setZoomCenter] = useState(year);
  const [inputValue, setInputValue] = useState('');
  const [showInput, setShowInput] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const zoomTrackRef = useRef<HTMLDivElement>(null);

  // ── Main timeline range ──

  const minYear = useMemo(() => {
    const candidates: number[] = [];
    if (personMarkers.length) candidates.push(Math.min(...personMarkers.map((p) => p.birth_year)));
    if (eras.length) candidates.push(Math.min(...eras.map((e) => e.start_year)));
    if (!candidates.length) return -3200;
    return Math.min(...candidates) - 100;
  }, [personMarkers, eras]);

  const maxYear = 2026;
  const range = maxYear - minYear;

  const yearToPercent = useCallback(
    (y: number) => Math.max(0, Math.min(100, ((y - minYear) / range) * 100)),
    [minYear, range]
  );

  const percentToYear = useCallback(
    (pct: number) => Math.round(minYear + (pct / 100) * range),
    [minYear, range]
  );

  const clampYear = useCallback(
    (y: number) => Math.max(minYear, Math.min(maxYear, y)),
    [minYear]
  );

  // ── Zoom timeline ──

  const aliveAtYear = useMemo(
    () => personMarkers.filter((p) => p.birth_year <= year && p.death_year >= year).length,
    [personMarkers, year]
  );

  const showZoom = aliveAtYear >= ZOOM_THRESHOLD;

  useEffect(() => {
    if (!isDraggingZoom) setZoomCenter(year);
  }, [year, isDraggingZoom]);

  const zoomMin = useMemo(() => clampYear(zoomCenter - ZOOM_HALF_SPAN), [zoomCenter, clampYear]);
  const zoomMax = useMemo(() => clampYear(zoomCenter + ZOOM_HALF_SPAN), [zoomCenter, clampYear]);
  const zoomRange = zoomMax - zoomMin || 1;

  const zoomYearToPercent = useCallback(
    (y: number) => Math.max(0, Math.min(100, ((y - zoomMin) / zoomRange) * 100)),
    [zoomMin, zoomRange]
  );

  const zoomPercentToYear = useCallback(
    (pct: number) => Math.round(zoomMin + (pct / 100) * zoomRange),
    [zoomMin, zoomRange]
  );

  const zoomPersonTicks = useMemo(() => {
    if (!showZoom) return [];
    return personMarkers
      .filter((p) => p.birth_year >= zoomMin && p.birth_year <= zoomMax)
      .map((p) => ({
        name: p.name,
        left: zoomYearToPercent(p.birth_year),
      }));
  }, [showZoom, personMarkers, zoomMin, zoomMax, zoomYearToPercent]);

  const zoomDecadeLabels = useMemo(() => {
    if (!showZoom) return [];
    const step = zoomRange <= 40 ? 5 : 10;
    const start = Math.ceil(zoomMin / step) * step;
    const labels: number[] = [];
    for (let y = start; y <= zoomMax; y += step) labels.push(y);
    return labels;
  }, [showZoom, zoomMin, zoomMax, zoomRange]);

  // ── Main track drag ──

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
    (e: React.MouseEvent) => { setIsDragging(true); onYearChange(getYearFromEvent(e.clientX)); },
    [getYearFromEvent, onYearChange]
  );
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => { setIsDragging(true); onYearChange(getYearFromEvent(e.touches[0].clientX)); },
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

  // ── Zoom track drag ──

  const getZoomYearFromEvent = useCallback(
    (clientX: number) => {
      if (!zoomTrackRef.current) return year;
      const rect = zoomTrackRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      return zoomPercentToYear(pct);
    },
    [zoomPercentToYear, year]
  );

  const handleZoomMouseDown = useCallback(
    (e: React.MouseEvent) => { setIsDraggingZoom(true); onYearChange(getZoomYearFromEvent(e.clientX)); },
    [getZoomYearFromEvent, onYearChange]
  );
  const handleZoomTouchStart = useCallback(
    (e: React.TouchEvent) => { setIsDraggingZoom(true); onYearChange(getZoomYearFromEvent(e.touches[0].clientX)); },
    [getZoomYearFromEvent, onYearChange]
  );

  useEffect(() => {
    if (!isDraggingZoom) return;
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      onYearChange(getZoomYearFromEvent(clientX));
    };
    const handleUp = () => setIsDraggingZoom(false);
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
  }, [isDraggingZoom, getZoomYearFromEvent, onYearChange]);

  // ── Shared logic ──

  const handleInputSubmit = () => {
    const parsed = parseInt(inputValue, 10);
    if (!isNaN(parsed) && parsed >= minYear && parsed <= maxYear) {
      onYearChange(parsed);
    }
    setShowInput(false);
  };

  const handleStep = useCallback(
    (delta: number) => onYearChange(clampYear(year + delta)),
    [year, onYearChange, clampYear]
  );

  const handleEraClick = useCallback(
    (era: Era) => onYearChange(clampYear(Math.round((era.start_year + era.end_year) / 2))),
    [onYearChange, clampYear]
  );

  const eraPersonCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const era of eras) {
      counts[era.name] = personMarkers.filter(
        (p) => p.birth_year >= era.start_year && p.birth_year <= era.end_year
      ).length;
    }
    return counts;
  }, [eras, personMarkers]);

  const personBands = useMemo(() => {
    if (!personMarkers.length) return [];
    return personMarkers.map((p) => ({
      name: p.name,
      left: yearToPercent(p.birth_year),
      width: Math.max(0.3, yearToPercent(p.death_year) - yearToPercent(p.birth_year)),
    }));
  }, [personMarkers, yearToPercent]);

  const currentEra = useMemo(() => {
    let best: Era | undefined;
    let bestSpan = Infinity;
    for (const e of eras) {
      if (year >= e.start_year && year <= e.end_year) {
        const span = e.end_year - e.start_year;
        if (span < bestSpan) { best = e; bestSpan = span; }
      }
    }
    return best;
  }, [eras, year]);

  const eraBoundaryYears = useMemo(() => {
    const yearSet = new Set<number>();
    for (const e of eras) { yearSet.add(e.start_year); yearSet.add(e.end_year); }
    return Array.from(yearSet).sort((a, b) => a - b);
  }, [eras]);

  const currentPercent = yearToPercent(year);
  const zoomCurrentPercent = zoomYearToPercent(year);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-[1000]">
      <div className="glass-panel-solid mx-4 mb-4 px-6 py-4 shadow-2xl">

        {/* Row 1: Step buttons + Year display + Step buttons */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            {[...STEP_SIZES].reverse().map((step) => (
              <button
                key={`minus-${step}`}
                onClick={() => handleStep(-step)}
                className="px-2 py-1 rounded text-[11px] font-mono text-white/60 bg-white/5 hover:bg-white/15 hover:text-white border border-white/10 transition-all"
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
                <button type="submit" className="text-accent text-sm hover:text-accent/80">OK</button>
                <button type="button" onClick={() => setShowInput(false)} className="text-white/50 text-sm hover:text-white/80">X</button>
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
              >
                +{step}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Era blocks above the track */}
        <div className="relative h-10 mb-0.5">
          {eras.map((era) => {
            const leftPct = yearToPercent(era.start_year);
            const rightPct = yearToPercent(era.end_year);
            const widthPct = rightPct - leftPct;
            if (widthPct <= 0) return null;
            const isActive = currentEra?.name === era.name;
            const count = eraPersonCounts[era.name] || 0;
            return (
              <button
                key={era.name}
                onClick={() => handleEraClick(era)}
                className="absolute top-0 h-full flex flex-col items-center justify-center overflow-hidden rounded-t transition-all"
                style={{
                  left: `${leftPct}%`,
                  width: `${widthPct}%`,
                  background: isActive ? `${era.color}30` : `${era.color}15`,
                  borderBottom: `2px solid ${era.color}`,
                  borderLeft: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <span className="text-[10px] font-semibold leading-tight whitespace-nowrap px-0.5 truncate w-full text-center" style={{ color: isActive ? '#fff' : era.color }}>
                  {era.name}
                </span>
                <span className="text-[9px] font-mono leading-tight" style={{ color: isActive ? '#fff' : `${era.color}bb` }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Row 3: Main track */}
        <div
          ref={trackRef}
          className="relative h-3 cursor-pointer select-none"
          style={{
            background: eras.length
              ? `linear-gradient(to right, ${eras.map((e) => `${e.color} ${yearToPercent(e.start_year)}%, ${e.color} ${yearToPercent(e.end_year)}%`).join(', ')})`
              : '#4A5568',
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {personBands.map((band, i) => (
            <div
              key={i}
              className="absolute top-0 h-full pointer-events-none"
              style={{
                left: `${band.left}%`,
                width: `${band.width}%`,
                minWidth: '2px',
                background: 'rgba(255,255,255,0.5)',
                boxShadow: '0 0 3px rgba(255,255,255,0.3)',
              }}
              title={band.name}
            />
          ))}

          {eras.map((era) => {
            const pct = yearToPercent(era.start_year);
            if (pct <= 0.5 || pct >= 99.5) return null;
            return <div key={`sep-${era.name}`} className="absolute top-0 bottom-0 w-px bg-white/30" style={{ left: `${pct}%` }} />;
          })}

          {/* Zoom lens indicator on main track */}
          {showZoom && (
            <div
              className="absolute top-0 h-full pointer-events-none border border-accent/60 rounded-sm transition-all duration-300"
              style={{
                left: `${yearToPercent(zoomMin)}%`,
                width: `${yearToPercent(zoomMax) - yearToPercent(zoomMin)}%`,
                background: 'rgba(233,69,96,0.15)',
                boxShadow: '0 0 8px rgba(233,69,96,0.3)',
              }}
            />
          )}

          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10" style={{ left: `${currentPercent}%` }}>
            <div className="w-6 h-6 rounded-full bg-accent border-2 border-white shadow-lg shadow-accent/40 transition-transform duration-75 hover:scale-110" />
          </div>

          <div className="absolute top-0 left-0 h-full bg-white/10 pointer-events-none" style={{ width: `${currentPercent}%` }} />
        </div>

        {/* Row 4: Era boundary years */}
        <div className="relative h-5 mt-0.5">
          {eraBoundaryYears.map((y, i) => {
            const pct = yearToPercent(y);
            if (pct < 0 || pct > 100) return null;
            const isFirst = i === 0;
            const isLast = i === eraBoundaryYears.length - 1;
            return (
              <span
                key={y}
                className="absolute text-[9px] text-white/50 whitespace-nowrap font-mono"
                style={{
                  left: `${pct}%`,
                  transform: isFirst ? 'translateX(0)' : isLast ? 'translateX(-100%)' : 'translateX(-50%)',
                }}
              >
                {y < 0 ? `${formatYearShort(y)} до н.э.` : `${formatYearShort(y)} н.э.`}
              </span>
            );
          })}
        </div>

        {/* ── Row 5: ZOOM TIMELINE (animated) ── */}
        <div
          className="overflow-hidden transition-all duration-500 ease-in-out"
          style={{
            maxHeight: showZoom ? '90px' : '0px',
            opacity: showZoom ? 1 : 0,
            marginTop: showZoom ? '6px' : '0px',
          }}
        >
          {/* Zoom header */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-accent font-semibold uppercase tracking-wider">
                Увеличено
              </span>
              <span className="text-[10px] text-white/50 font-mono">
                {formatYear(zoomMin)} — {formatYear(zoomMax)}
              </span>
            </div>
            <span className="text-[10px] text-white/40">
              <span className="text-accent font-bold">{aliveAtYear}</span> жили в {formatYear(year)}
            </span>
          </div>

          {/* Zoom track */}
          <div
            ref={zoomTrackRef}
            className="relative h-4 rounded cursor-pointer select-none"
            style={{
              background: currentEra
                ? `linear-gradient(to right, ${currentEra.color}40, ${currentEra.color}80, ${currentEra.color}40)`
                : 'rgba(255,255,255,0.1)',
            }}
            onMouseDown={handleZoomMouseDown}
            onTouchStart={handleZoomTouchStart}
          >
            {/* Zoom person birth ticks */}
            {zoomPersonTicks.map((tick, i) => (
              <div
                key={i}
                className="absolute top-0 h-full pointer-events-none"
                style={{
                  left: `${tick.left}%`,
                  width: '3px',
                  background: 'rgba(255,255,255,0.7)',
                  borderRadius: '1px',
                  boxShadow: '0 0 3px rgba(255,255,255,0.3)',
                }}
                title={tick.name}
              />
            ))}

            {/* Zoom thumb */}
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10" style={{ left: `${zoomCurrentPercent}%` }}>
              <div className="w-5 h-5 rounded-full bg-accent border-2 border-white shadow-lg shadow-accent/50 transition-transform duration-75 hover:scale-110" />
            </div>

            <div className="absolute top-0 left-0 h-full rounded bg-white/5 pointer-events-none" style={{ width: `${zoomCurrentPercent}%` }} />
          </div>

          {/* Zoom decade labels */}
          <div className="relative h-4 mt-0.5">
            {zoomDecadeLabels.map((y) => {
              const pct = zoomYearToPercent(y);
              return (
                <span
                  key={y}
                  className="absolute text-[9px] text-white/40 font-mono -translate-x-1/2 whitespace-nowrap"
                  style={{ left: `${pct}%` }}
                >
                  {formatYearShort(y)}
                </span>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default TimelineSlider;
