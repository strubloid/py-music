import React from 'react';
import { Music2 } from 'lucide-react';
import { useChordPanel } from '../../contexts/ChordPanelContext';
import './ChordDisplaySwitch.css';

const SelectedChordsToggle = ({ className = '' }) => {
  const { showSelectedChords, toggleSelectedChords } = useChordPanel();

  return (
    <div className={`chord-display-switch ${className}`}>
      <button
        onClick={toggleSelectedChords}
        className={`switch-button ${showSelectedChords ? 'active' : ''}`}
        title={showSelectedChords ? 'Hide Selected Chords' : 'Show Selected Chords'}
      >
        <div className="switch-track">
          <div className={`switch-thumb ${showSelectedChords ? 'guitar-mode' : 'piano-mode'}`}>
            <Music2 size={14} />
          </div>
        </div>
        <span className="switch-label">
          {showSelectedChords ? 'Chords ON' : 'Chords OFF'}
        </span>
      </button>
    </div>
  );
};

export default SelectedChordsToggle;