import React from 'react'
import { useChordPanel } from '../../contexts/ChordPanelContext'
import ChordTooltip from './ChordTooltip'
import './SelectedChords.css'

const SelectedChords = () => {
  const { selectedChords, removeChord, clearChords } = useChordPanel()

  if (selectedChords.length === 0) {
    return (
      <div className="selected-chords-panel">
        <div className="empty-state">
          <div className="empty-icon">🎵</div>
          <h3>No Chords Selected</h3>
          <p>Click on any chord in the scale or progressions to add it here.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="selected-chords-panel">
      <div className="panel-header">
        <h3 className="panel-title">Selected Chords</h3>
        <div className="panel-actions">
          <button
            className="clear-button"
            onClick={clearChords}
            title="Clear all chords"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="chords-grid">
        {selectedChords.map((chord, index) => (
          <div key={index} className="selected-chord-item">
            <ChordTooltip chord={chord}>
              <div className="chord-display">
                {chord}
              </div>
            </ChordTooltip>
            <button
              className="remove-chord-button"
              onClick={() => removeChord(index)}
              title="Remove chord"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="chord-info">
        <span className="chord-count-info">
          {selectedChords.length} chord{selectedChords.length !== 1 ? 's' : ''} selected
        </span>
      </div>
    </div>
  )
}

export default SelectedChords