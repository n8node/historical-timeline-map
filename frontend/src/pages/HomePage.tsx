import React, { useState, useEffect, useCallback } from 'react';
import MapView from '../components/Map/MapView';
import TimelineSlider from '../components/Timeline/TimelineSlider';
import PersonCard from '../components/PersonCard/PersonCard';
import Header from '../components/Layout/Header';
import { getPersonsByYear, getEras, getPersonMarkers } from '../services/api';
import type { PersonMap, Era, PersonYearRange } from '../types';

const HomePage: React.FC = () => {
  const [year, setYear] = useState(1800);
  const [persons, setPersons] = useState<PersonMap[]>([]);
  const [eras, setEras] = useState<Era[]>([]);
  const [personMarkers, setPersonMarkers] = useState<PersonYearRange[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getEras().then(setEras).catch(() => {});
    getPersonMarkers().then(setPersonMarkers).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      getPersonsByYear(year)
        .then((data) => {
          if (!cancelled) setPersons(data);
        })
        .catch(() => {
          if (!cancelled) setPersons([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 150);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [year]);

  const handleYearChange = useCallback((newYear: number) => {
    setYear(newYear);
  }, []);

  const handlePersonClick = useCallback((id: string) => {
    setSelectedPersonId(id);
  }, []);

  const handleCloseCard = useCallback(() => {
    setSelectedPersonId(null);
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <Header personCount={persons.length} />
      <MapView
        persons={persons}
        onPersonClick={handlePersonClick}
        isLoading={loading}
      />
      <TimelineSlider
        year={year}
        onYearChange={handleYearChange}
        eras={eras}
        personMarkers={personMarkers}
      />
      <PersonCard personId={selectedPersonId} onClose={handleCloseCard} />
    </div>
  );
};

export default HomePage;
