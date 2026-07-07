import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Music, Piano, Guitar, Layers } from 'lucide-react';
import KeySelector from '../../components/KeySelector/KeySelector';
import PianoKeyboard from '../../components/PianoKeyboard/PianoKeyboard';
import ScaleInfo from '../../components/ScaleInfo/ScaleInfo';
import GuitarFretboard from '../../components/GuitarFretboard/GuitarFretboard';
import './ScalesPage.css';

const ScalesPage = () => {
  const [selectedKey, setSelectedKey] = useState('C');
  const [selectedInterval, setSelectedInterval] = useState('ionian');
  const [scaleData, setScaleData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('scale');
  const [availableModes, setAvailableModes] = useState([]);
  const [allModes, setAllModes] = useState([]); // all modes for the current key

  useEffect(() => {
    fetchAvailableModes();
  }, []);

  useEffect(() => {
    if (selectedKey && selectedInterval) {
      fetchScaleData(selectedKey, selectedInterval);
    }
  }, [selectedKey, selectedInterval]);

  const fetchAvailableModes = async () => {
    try {
      const response = await axios.get('/api/intervals');
      const modes = response.data.intervals || [];
      // Filter out major/minor — they are aliases for ionian/aeolian
      const filtered = modes.filter(m => m.key !== 'major' && m.key !== 'minor');
      setAvailableModes(filtered);
      // Default to ionian if it's available
      const defaultMode = filtered.find(m => m.key === 'ionian') || filtered[0];
      if (defaultMode) setSelectedInterval(defaultMode.key);
    } catch {
      setAvailableModes([
        { key: 'ionian',     name: 'Ionian',     description: 'The major scale. Bright, happy, resolved.' },
        { key: 'aeolian',    name: 'Aeolian',    description: 'The natural minor scale. Sad, dark, introspective.' },
        { key: 'dorian',     name: 'Dorian',     description: 'Minor with raised 6th. Soulful, jazzy.' },
        { key: 'phrygian',   name: 'Phrygian',   description: 'Minor with flattened 2nd. Spanish, exotic.' },
        { key: 'lydian',     name: 'Lydian',     description: 'Major with raised 4th. Dreamy, ethereal.' },
        { key: 'mixolydian', name: 'Mixolydian', description: 'Major with flattened 7th. Blues, rock.' },
        { key: 'locrian',    name: 'Locrian',    description: 'Diminished, unstable. Very rare as tonal center.' },
      ]);
    }
  };

  // Fetch scale data for ALL modes of the selected key, then update allModes
  useEffect(() => {
    if (!selectedKey) return;
    const fetchAllModes = async () => {
      const key = selectedKey;
      const modeResults = [];
      for (const mode of availableModes) {
        try {
          const response = await axios.get(`/api/scale/${encodeURIComponent(key)}?interval=${mode.key}`);
          if (response.data) {
            modeResults.push({ ...response.data, modeKey: mode.key, modeName: mode.name });
          }
        } catch {
          // skip failed modes
        }
      }
      if (key === selectedKey) {
        setAllModes(modeResults);
      }
    };
    if (availableModes.length > 0) {
      fetchAllModes();
    }
  }, [selectedKey, availableModes]);

  const fetchScaleData = async (key, interval) => {
    try {
      setLoading(true);
      setError(null);
      const encodedKey = encodeURIComponent(key);
      const response = await axios.get(`/api/scale/${encodedKey}?interval=${interval}`);
      setScaleData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch scale data');
    } finally {
      setLoading(false);
    }
  };

  // Sync selectedInterval when switching modes
  const handleModeSelect = (modeKey) => {
    setSelectedInterval(modeKey);
  };

  const currentMode = allModes.find(m => m.modeKey === selectedInterval);
  const displayData = currentMode || scaleData;

  if (error) {
    return (
      <div className="scales-page">
        <div className="error-container">
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={() => fetchScaleData(selectedKey, selectedInterval)}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="scales-page">
      {/* Header + key selector */}
      <div className="scales-header">
        <div className="scales-title-row">
          <Music className="header-icon-inline" />
          <h1>Scale Explorer</h1>
        </div>
        <KeySelector
          selectedKey={selectedKey}
          onKeyChange={setSelectedKey}
          selectedInterval={selectedInterval}
          onIntervalChange={setSelectedInterval}
          availableIntervals={availableModes}
          loading={loading}
        />
      </div>

      {/* Mode cards — all modes for selected key, horizontal scroll */}
      {allModes.length > 1 && (
        <div className="mode-cards-section">
          <div className="section-label">
            <Layers size={13} />
            Modes in {selectedKey}
          </div>
          <div className="mode-cards-row">
            {allModes.map((mode) => (
              <button
                key={mode.modeKey}
                className={`mode-card ${selectedInterval === mode.modeKey ? 'active' : ''}`}
                onClick={() => handleModeSelect(mode.modeKey)}
              >
                <span className="mode-card-name">{mode.modeName}</span>
                <span className="mode-card-key">{selectedKey}</span>
                <span className="mode-card-chords">
                  {mode.chords ? mode.chords.slice(0, 4).join(' · ') : ''}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="loading-row">
          <div className="loading-spinner" />
          <span>Loading scale analysis...</span>
        </div>
      )}

      {displayData && !loading && (
        <>
          {/* Scale title */}
          <div className="scale-mode-title">
            <span className="scale-mode-name">{displayData.scale_name || `${selectedKey} ${selectedInterval}`}</span>
            {displayData.interval_type && (
              <span className="scale-type-badge">{displayData.interval_type}</span>
            )}
          </div>

          {/* Instrument shortcut pills */}
          <div className="instrument-pills">
            <button
              className={`pill ${activeTab === 'scale' ? 'active' : ''}`}
              onClick={() => setActiveTab('scale')}
            >
              <Music size={14} /> Notes & Degrees
            </button>
            <button
              className={`pill ${activeTab === 'piano' ? 'active' : ''}`}
              onClick={() => setActiveTab('piano')}
            >
              <Piano size={14} /> Piano
            </button>
            <button
              className={`pill ${activeTab === 'guitar' ? 'active' : ''}`}
              onClick={() => setActiveTab('guitar')}
            >
              <Guitar size={14} /> Fretboard
            </button>
          </div>

          {/* Instrument panels */}
          <div className="instrument-layout">
            {activeTab === 'scale' && (
              <div className="instrument-panel scale-panel">
                <ScaleInfo scaleData={displayData} />
              </div>
            )}
            {activeTab === 'piano' && (
              <div className="instrument-panel piano-panel">
                <PianoKeyboard keyboardData={displayData.keyboard_data} />
              </div>
            )}
            {activeTab === 'guitar' && (
              <div className="instrument-panel guitar-panel">
                <GuitarFretboard fretboardData={displayData.fretboard_data} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ScalesPage;
