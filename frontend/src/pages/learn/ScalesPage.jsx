import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Music, Piano, Guitar } from 'lucide-react';
import KeySelector from '../../components/KeySelector/KeySelector';
import PianoKeyboard from '../../components/PianoKeyboard/PianoKeyboard';
import ScaleInfo from '../../components/ScaleInfo/ScaleInfo';
import GuitarFretboard from '../../components/GuitarFretboard/GuitarFretboard';
import ChordProgressions from '../../components/ChordProgressions/ChordProgressions';
import './ScalesPage.css';

const ScalesPage = () => {
  const [selectedKey, setSelectedKey] = useState('C');
  const [selectedInterval, setSelectedInterval] = useState('major');
  const [scaleData, setScaleData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('scale');
  const [availableIntervals, setAvailableIntervals] = useState([]);

  useEffect(() => {
    fetchAvailableIntervals();
  }, []);

  useEffect(() => {
    if (selectedKey && selectedInterval) {
      fetchScaleData(selectedKey, selectedInterval);
    }
  }, [selectedKey, selectedInterval]);

  const fetchAvailableIntervals = async () => {
    try {
      const response = await axios.get('/api/intervals');
      setAvailableIntervals(response.data.intervals);
    } catch {
      setAvailableIntervals([
        { key: 'major', name: 'Major' },
        { key: 'minor', name: 'Minor' }
      ]);
    }
  };

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
      {/* Key + Interval selector — sticky top */}
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
          availableIntervals={availableIntervals}
          loading={loading}
        />
      </div>

      {loading && (
        <div className="loading-row">
          <div className="loading-spinner" />
          <span>Loading scale analysis...</span>
        </div>
      )}

      {scaleData && !loading && (
        <>
          {/* Instrument shortcuts */}
          <div className="instrument-pills">
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
              <Guitar size={14} /> Guitar
            </button>
            <button
              className={`pill ${activeTab === 'scale' ? 'active' : ''}`}
              onClick={() => setActiveTab('scale')}
            >
              <Music size={14} /> Scale Info
            </button>
            <button
              className={`pill ${activeTab === 'progressions' ? 'active' : ''}`}
              onClick={() => setActiveTab('progressions')}
            >
              Progressions
            </button>
          </div>

          {/* Instrument panels — side by side on large screens */}
          <div className="instrument-layout">
            {activeTab === 'piano' && (
              <div className="instrument-panel piano-panel">
                <PianoKeyboard keyboardData={scaleData.keyboard_data} />
              </div>
            )}
            {activeTab === 'guitar' && (
              <div className="instrument-panel guitar-panel">
                <GuitarFretboard fretboardData={scaleData.fretboard_data} />
              </div>
            )}
            {activeTab === 'scale' && (
              <div className="instrument-panel scale-panel">
                <ScaleInfo scaleData={scaleData} />
              </div>
            )}
            {activeTab === 'progressions' && (
              <div className="instrument-panel progressions-panel">
                <ChordProgressions progressions={scaleData.progressions} keyName={scaleData.key} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ScalesPage;
