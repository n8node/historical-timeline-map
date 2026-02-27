import React, { useEffect, useRef, useCallback, useState } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import type { PersonMap } from '../../types';

interface MapViewProps {
  persons: PersonMap[];
  onPersonClick: (id: string) => void;
  isLoading: boolean;
}

const ERA_COLORS: Record<string, string> = {
  'Древний мир': '#8B4513',
  'Средневековье': '#4A5568',
  'Новое время': '#2B6CB0',
  'Новейшее время': '#E53E3E',
};

const getMarkerColor = (era: string | null): string =>
  (era && ERA_COLORS[era]) || '#e94560';

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const createMarkerIcon = (person: PersonMap) => {
  const color = getMarkerColor(person.era);
  const initials = getInitials(person.name);

  return L.divIcon({
    className: '',
    html: `<div style="
      width:44px;height:44px;
      border-radius:50%;
      border:3px solid ${color};
      box-shadow:0 0 12px ${color}80;
      background:#1a1a2e;
      cursor:pointer;
      display:flex;align-items:center;justify-content:center;
      transition:transform 0.2s,box-shadow 0.2s;
      font-family:Inter,sans-serif;
      font-size:14px;font-weight:700;
      color:${color};
      letter-spacing:-0.5px;
    ">${initials}</div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
};

interface TileStyle {
  name: string;
  url: string;
  attr: string;
  subdomains?: string;
  dark: boolean;
}

const CARTO_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';
const OSM_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

const TILE_STYLES: TileStyle[] = [
  {
    name: 'Тёмная',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attr: CARTO_ATTR,
    subdomains: 'abcd',
    dark: true,
  },
  {
    name: 'Voyager',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attr: CARTO_ATTR,
    subdomains: 'abcd',
    dark: false,
  },
  {
    name: 'Светлая',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attr: CARTO_ATTR,
    subdomains: 'abcd',
    dark: false,
  },
  {
    name: 'OSM',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attr: OSM_ATTR,
    subdomains: 'abc',
    dark: false,
  },
  {
    name: 'Без подписей',
    url: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
    attr: CARTO_ATTR,
    subdomains: 'abcd',
    dark: true,
  },
];

const MapView: React.FC<MapViewProps> = ({ persons, onPersonClick, isLoading }) => {
  const mapRef = useRef<L.Map | null>(null);
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const tileRef = useRef<L.TileLayer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [styleIdx, setStyleIdx] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [30, 20],
      zoom: 3,
      minZoom: 2,
      maxZoom: 18,
      zoomControl: true,
      attributionControl: true,
    });

    const style = TILE_STYLES[0];
    const tile = L.tileLayer(style.url, {
      attribution: style.attr,
      subdomains: style.subdomains || 'abc',
    }).addTo(map);

    tileRef.current = tile;
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      tileRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const style = TILE_STYLES[styleIdx];

    if (tileRef.current) {
      map.removeLayer(tileRef.current);
    }

    const tile = L.tileLayer(style.url, {
      attribution: style.attr,
      subdomains: style.subdomains || 'abc',
    }).addTo(map);

    tileRef.current = tile;
  }, [styleIdx]);

  const handlePersonClick = useCallback(
    (id: string) => onPersonClick(id),
    [onPersonClick]
  );

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (clusterRef.current) {
      map.removeLayer(clusterRef.current);
    }

    const cluster = L.markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction: (c) => {
        const count = c.getChildCount();
        let size = 'small';
        if (count > 10) size = 'medium';
        if (count > 30) size = 'large';
        return L.divIcon({
          html: `<div><span>${count}</span></div>`,
          className: `marker-cluster marker-cluster-${size}`,
          iconSize: L.point(40, 40),
        });
      },
    });

    persons.forEach((person) => {
      if (person.birth_lat == null || person.birth_lon == null) return;

      const marker = L.marker([person.birth_lat, person.birth_lon], {
        icon: createMarkerIcon(person),
      });

      const years = `${person.birth_year < 0 ? `${Math.abs(person.birth_year)} до н.э.` : person.birth_year} — ${person.death_year < 0 ? `${Math.abs(person.death_year)} до н.э.` : person.death_year}`;

      marker.bindTooltip(
        `<div style="text-align:center;font-family:Inter,sans-serif;">
          <strong style="font-size:13px;">${person.name}</strong><br/>
          <span style="font-size:11px;opacity:0.8;">${person.activity_description || ''}</span><br/>
          <span style="font-size:11px;opacity:0.6;">${years}</span>
        </div>`,
        {
          direction: 'top',
          offset: L.point(0, -26),
          className: 'glass-tooltip',
        }
      );

      marker.on('click', () => handlePersonClick(person.id));
      cluster.addLayer(marker);
    });

    map.addLayer(cluster);
    clusterRef.current = cluster;
  }, [persons, handlePersonClick]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {isLoading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] glass-panel px-4 py-2 text-sm text-white/70">
          Загрузка...
        </div>
      )}

      {/* Map style switcher */}
      <div className="absolute top-20 right-4 z-[1000] pointer-events-auto">
        <button
          onClick={() => setPickerOpen(!pickerOpen)}
          className="glass-panel px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/[0.12] transition-all flex items-center gap-2"
          title="Стиль карты"
        >
          <span className="text-base">🗺</span>
          <span className="hidden sm:inline">{TILE_STYLES[styleIdx].name}</span>
        </button>

        {pickerOpen && (
          <div className="mt-1 glass-panel-solid shadow-2xl overflow-hidden" style={{ minWidth: '160px' }}>
            {TILE_STYLES.map((s, i) => (
              <button
                key={s.name}
                onClick={() => { setStyleIdx(i); setPickerOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${
                  i === styleIdx
                    ? 'bg-accent/20 text-accent'
                    : 'text-white/70 hover:bg-white/[0.08] hover:text-white'
                }`}
              >
                <span className="w-3 h-3 rounded-full shrink-0" style={{
                  background: s.dark ? '#1a1a2e' : '#e8e4df',
                  border: `2px solid ${i === styleIdx ? '#e94560' : 'rgba(255,255,255,0.2)'}`,
                }} />
                {s.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .glass-tooltip {
          background: rgba(22, 33, 62, 0.92) !important;
          border: 1px solid rgba(255,255,255,0.15) !important;
          border-radius: 8px !important;
          color: white !important;
          padding: 8px 12px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.4) !important;
          backdrop-filter: blur(8px);
        }
        .glass-tooltip::before {
          border-top-color: rgba(22, 33, 62, 0.92) !important;
        }
      `}</style>
    </div>
  );
};

export default MapView;
