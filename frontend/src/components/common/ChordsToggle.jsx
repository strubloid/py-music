import React from 'react'
import { Music } from 'lucide-react'
import { useChordPanel } from '../../contexts/ChordPanelContext'
import './ChordDisplaySwitch.css'

const ChordsToggle = ({ className = '' }) => {
  const { showChords, toggleChords } = useChordPanel();

  return (
    <div className={`chord-display-switch ${className}`}>
      <button
        onClick={toggleChords}
        className={`switch-button ${showChords ? 'active' : ''}`}
        title={showChords ? 'Hide Chord Diagrams' : 'Show Chord Diagrams'}
      >
        <div className="switch-track">
          <div className={`switch-thumb ${showChords ? 'chords-on' : 'chords-off'}`}>
            <Music size={14} />
          </div>
        </div>
        <span className="switch-label">
          {showChords ? 'Chords' : 'Chords'}
        </span>
      </button>
    </div>
  )
}

export default ChordsToggle