import React from 'react';
import { Guitar, Piano } from 'lucide-react';
import { useChordDisplay } from '../../contexts/ChordDisplayContext';
import './ChordDisplaySwitch.css';

const ChordDisplaySwitch = ({ className = '' }) => {
  const { displayMode, toggleDisplayMode } = useChordDisplay();

  return (
    <div className={`chord-display-switch ${className}`}>
      <button
        onClick={toggleDisplayMode}
        className={`switch-button ${displayMode === 'guitar' ? 'active' : ''}`}
        title={displayMode === 'guitar' ? 'Switch to Piano' : 'Switch to Guitar'}
      >
        <div className="switch-track">
          <div className={`switch-thumb ${displayMode === 'piano' ? 'piano-mode' : 'guitar-mode'}`}>
            {displayMode === 'guitar' ? (
              <Guitar size={14} />
            ) : (
              <Piano size={14} />
            )}
          </div>
        </div>
        <span className="switch-label">
          {displayMode === 'guitar' ? 'Guitar' : 'Piano'}
        </span>
      </button>
    </div>
  );
};

export default ChordDisplaySwitch;