import React from 'react';
import { X, Trash2, Music } from 'lucide-react';
import { useChordPanel } from '../../contexts/ChordPanelContext';
import { useChordDisplay } from '../../contexts/ChordDisplayContext';
import musicConfig from '../../services/MusicDisplayConfig.jsx';
import './ChordPanel.css';

const ChordPanel = () => {
  const { selectedChords, removeChord, clearChords, isHighlighted } = useChordPanel();
  const { displayMode } = useChordDisplay();

  // Render inline chord diagram
  const renderInlineChordDiagram = (chordName) => {
    if (displayMode === 'piano') {
      return renderInlinePianoChord(chordName);
    } else {
      return renderInlineGuitarChord(chordName);
    }
  };

  const renderInlinePianoChord = (chord) => {
    const chordPatterns = {
      'C': ['C', 'E', 'G'], 'Dm': ['D', 'F', 'A'], 'Em': ['E', 'G', 'B'],
      'F': ['F', 'A', 'C'], 'G': ['G', 'B', 'D'], 'Am': ['A', 'C', 'E'],
      'Bdim': ['B', 'D', 'F'], 'D': ['D'], 'E': ['E'], 'F#': ['F#'],
      'G#': ['G#'], 'A': ['A'], 'A#': ['A#'], 'B': ['B'], 'C#': ['C#'], 'D#': ['D#']
    };
    
    const notes = chordPatterns[chord] || [chord];
    const whiteKeys = musicConfig.getPianoKeyOrder();
    const blackKeys = musicConfig.getBlackKeyOrder();
    
    return (
      <div className="inline-piano-diagram">
        <div className="chord-title-small">{chord}</div>
        <div className="mini-piano-inline">
          <div className="white-keys-inline">
            {whiteKeys.map((note) => (
              <div
                key={note}
                className={`white-key-inline ${
                  notes.includes(note) ? 'active' : ''
                }`}
              >
                <span className="key-label-small">{note}</span>
              </div>
            ))}
          </div>
          <div className="black-keys-inline">
            {blackKeys.map((note, index) => (
              <div
                key={note}
                className={`black-key-inline ${
                  notes.includes(note) ? 'active' : ''
                }`}
                style={{ left: `${[10, 24, 52, 66, 80][index]}%` }}
              >
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderInlineGuitarChord = (chord) => {
    const guitarChords = {
      'C': { frets: ['x', '3', '2', '0', '1', '0'] },
      'Dm': { frets: ['x', 'x', '0', '2', '3', '1'] },
      'Em': { frets: ['0', '2', '2', '0', '0', '0'] },
      'F': { frets: ['1', '3', '3', '2', '1', '1'] },
      'G': { frets: ['3', '2', '0', '0', '3', '3'] },
      'Am': { frets: ['x', '0', '2', '2', '1', '0'] }
    };
    
    const chordData = guitarChords[chord] || guitarChords['C'];
    // Use centralized configuration for consistent string ordering
    const strings = musicConfig.getGuitarStrings();
    // No need for fretOrder mapping since we're using consistent ordering
    
    return (
      <div className="inline-guitar-diagram">
        <div className="chord-title-small">{chord}</div>
        <div className="mini-guitar-inline">
          {strings.map((string, stringIndex) => {
            return (
              <div key={stringIndex} className="guitar-string-inline">
                <span className="string-label-small">{string}</span>
                <div className="string-frets">
                  {[0, 1, 2, 3].map(fret => (
                    <div key={fret} className="fret-cell-inline">
                      {fret === 0 && chordData.frets[stringIndex] === '0' && (
                        <div className="open-circle">o</div>
                      )}
                      {fret === 0 && chordData.frets[stringIndex] === 'x' && (
                        <div className="muted-x">×</div>
                      )}
                      {fret > 0 && parseInt(chordData.frets[stringIndex]) === fret && (
                        <div className="finger-dot">●</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (selectedChords.length === 0) {
    return (
      <div className="chord-panel empty">
        <div className="chord-panel-header">
          <Music size={20} />
          <h3>Selected Chords</h3>
        </div>
        <div className="empty-message">
          Click on chords in progressions to add them here
        </div>
      </div>
    );
  }

  return (
    <div className="chord-panel">
      <div className="chord-panel-header">
        <div className="panel-title">
          <Music size={20} />
          <h3>Selected Chords ({selectedChords.length})</h3>
        </div>
        <button className="clear-all-btn" onClick={clearChords} title="Clear all chords">
          <Trash2 size={16} />
          Clear All
        </button>
      </div>
      
      <div className="chord-collection">
        {selectedChords.map((chord) => (
          <div
            key={chord.id}
            className={`chord-item ${isHighlighted(chord.name) ? 'highlighted' : ''}`}
          >
            <div className="chord-diagram-container">
              {renderInlineChordDiagram(chord.name)}
            </div>
            <button
              className="remove-chord-btn"
              onClick={() => removeChord(chord.id)}
              title={`Remove ${chord.name}`}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChordPanel;