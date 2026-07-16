import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { FlaskConical, Headphones, Map, MapPin, Route, ShieldCheck, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import PipCharacter from '../game/characters/PipCharacter';
import { useMotionProfile } from './MotionContext';
import './WorldTravelContext.scss';

export const WORLD_DESTINATIONS = [
  { id: 'practice-square', name: 'Practice Square', path: '/', hint: 'City crossroads', icon: MapPin },
  { id: 'sound-gates', name: 'Sound Gates', path: '/play/ear-training', hint: 'Hear the route', icon: Headphones },
  { id: 'scale-trail', name: 'Scale Trail', path: '/play/scales', hint: 'Cross the melody paths', icon: Route },
  { id: 'scale-lab', name: 'Scale Lab', path: '/play/learn-scales', hint: 'Decode sound formulas', icon: FlaskConical },
  { id: 'quest-vaults', name: 'Quest Vaults', path: '/play/quests', hint: 'Release mission seals', icon: ShieldCheck },
] as const;

const STORAGE_KEY = 'strubloid:living-city-travel';
const WorldTravelContext = createContext(null);

const readTravelState = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return { visited: Array.isArray(saved.visited) ? saved.visited : [], lastDistrict: saved.lastDistrict || 'practice-square' };
  } catch {
    return { visited: [], lastDistrict: 'practice-square' };
  }
};

export const useWorldTravel = () => {
  const context = useContext(WorldTravelContext);
  if (!context) throw new Error('useWorldTravel must be used within WorldTravelProvider');
  return context;
};

export const WorldTravelProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { motion } = useMotionProfile();
  const [saved, setSaved] = useState(readTravelState);
  const [mapOpen, setMapOpen] = useState(false);
  const [transition, setTransition] = useState(null);
  const timers = useRef([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);
  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)), [saved]);

  useEffect(() => {
    const district = WORLD_DESTINATIONS.find((item) => item.path === location.pathname);
    if (!district) return;
    const rememberedDistrict = district.id === 'practice-square' ? null : district.id;
    setSaved((current) => current.lastDistrict === (rememberedDistrict || current.lastDistrict) && current.visited.includes(district.id)
      ? current
      : { lastDistrict: rememberedDistrict || current.lastDistrict, visited: Array.from(new Set([...current.visited, district.id])) });
  }, [location.pathname]);

  const finishTravel = useCallback((destination) => {
    clearTimers();
    navigate(destination.path);
    setTransition(null);
    setMapOpen(false);
  }, [clearTimers, navigate]);

  const travel = useCallback((destination) => {
    if (!destination || destination.path === location.pathname) {
      setMapOpen(false);
      return;
    }
    clearTimers();
    const firstVisit = !saved.visited.includes(destination.id);
    const duration = motion === 'minimal' ? 250 : firstVisit ? 1100 : 700;
    setMapOpen(false);
    setTransition({ destination, firstVisit, duration, phase: 'departing' });
    setSaved((current) => ({
      lastDistrict: destination.id === 'practice-square' ? current.lastDistrict : destination.id,
      visited: Array.from(new Set([...current.visited, destination.id])),
    }));
    timers.current.push(window.setTimeout(() => {
      navigate(destination.path);
      setTransition((current) => current ? { ...current, phase: 'arriving' } : null);
    }, Math.round(duration * .67)));
    timers.current.push(window.setTimeout(() => setTransition(null), duration));
  }, [clearTimers, location.pathname, motion, navigate, saved.visited]);

  const skipTravel = useCallback(() => {
    if (transition) finishTravel(transition.destination);
  }, [finishTravel, transition]);

  useEffect(() => {
    const onKeyDown = (event) => {
      const target = event.target;
      if (target instanceof HTMLElement && ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) return;
      if (event.code === 'KeyM') {
        event.preventDefault();
        setMapOpen((open) => !open);
      }
      if (event.code === 'Escape') {
        setMapOpen(false);
        if (transition) skipTravel();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [skipTravel, transition]);

  const value = useMemo(() => ({ ...saved, mapOpen, setMapOpen, transition, travel, skipTravel }), [mapOpen, saved, skipTravel, transition, travel]);

  return (
    <WorldTravelContext.Provider value={value}>
      {children}
      <button className="city-map-trigger" type="button" onClick={() => setMapOpen(true)} aria-label="Open Music City map">
        <Map /><span>City map</span><kbd>M</kbd>
      </button>
      {mapOpen && (
        <div className="city-map-overlay" role="presentation" onClick={() => setMapOpen(false)}>
          <section className="city-map" role="dialog" aria-modal="true" aria-labelledby="city-map-title" onClick={(event) => event.stopPropagation()}>
            <header><div><span>HARMONIC TRANSIT</span><h2 id="city-map-title">Music City map</h2><p>Your last stop and visited districts stay marked on this device.</p></div><button type="button" onClick={() => setMapOpen(false)} aria-label="Close city map"><X /></button></header>
            <div className="city-map__routes" aria-hidden="true"><i /><i /><i /><i /></div>
            <nav aria-label="Travel to a district">
              {WORLD_DESTINATIONS.map((destination, index) => {
                const Icon = destination.icon;
                const current = destination.path === location.pathname;
                const visited = saved.visited.includes(destination.id);
                return (
                  <button type="button" key={destination.id} className={`${current ? 'is-current' : ''} ${visited ? 'is-visited' : ''}`} onClick={() => travel(destination)} aria-current={current ? 'location' : undefined}>
                    <span>{index + 1}</span><Icon /><strong>{destination.name}</strong><small>{current ? 'You are here' : destination.hint}</small>{visited && !current && <em>Visited</em>}
                  </button>
                );
              })}
            </nav>
          </section>
        </div>
      )}
      {transition && (
        <div className="district-travel" role="status" aria-live="assertive" data-phase={transition.phase}>
          <div className="district-travel__track" aria-hidden="true"><i /><i /><i /><i /></div>
          <PipCharacter state="walking" className="district-travel__pip" />
          <span>{transition.phase === 'departing' ? 'DISTRICT DEPARTURE' : 'ARRIVAL SIGNAL'}</span>
          <h2>{transition.destination.name}</h2>
          <p>{transition.firstVisit ? 'Pip is tuning a new route through the City.' : 'Taking the familiar shortcut.'}</p>
          <button type="button" onClick={skipTravel}>Skip travel</button>
        </div>
      )}
    </WorldTravelContext.Provider>
  );
};
