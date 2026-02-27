import React, { useEffect, useRef, useCallback } from 'react';
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

const createMarkerIcon = (person: PersonMap) => {
  const color = getMarkerColor(person.era);
  const photoUrl = person.main_photo_url || '';

  return L.divIcon({
    className: '',
    html: `
      <div class="custom-marker" style="
        width: 44px; height: 44px;
        border-radius: 50%;
        border: 3px solid ${color};
        overflow: hidden;
        box-shadow: 0 0 12px ${color}80;
        background: #1a1a2e;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
      ">
        <img src="${photoUrl}" alt="${person.name}"
          style="width:100%;height:100%;object-fit:cover;"
          onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=\\'display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:18px;color:${color}\\'>👤</div>'"
        />
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
};

const DARK_TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const DARK_TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

const MapView: React.FC<MapViewProps> = ({ persons, onPersonClick, isLoading }) => {
  const mapRef = useRef<L.Map | null>(null);
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

    L.tileLayer(DARK_TILE_URL, { attribution: DARK_TILE_ATTR, subdomains: 'abcd' }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

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
