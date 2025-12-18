import React from 'react';
import { useChordDisplay } from '../../contexts/ChordDisplayContext';
import chordDataService from '../../services/ChordDataService';
import './ChordTooltip.css';

const InlineChordDisplay = ({ chord, className = '' }) => {
  const { displayMode } = useChordDisplay();

  if (!chord) {
    return null;
  }

  const renderGuitarFretboard = (chordName) => {
    const renderData = chordDataService.renderGuitarFretboard(chordName, { className: 'inline-display' });
    const chordData = renderData.chordData;
    const stringNames = renderData.stringNames;
    
    return (
      <div className="guitar-chord-diagram inline-display">
        <div className="guitar-fretboard">
          <div className="fret-numbers">
            <div></div>
            {[1, 2, 3, 4].map(fret => (
              <div key={fret} className="fret-number">{fret}</div>
            ))}
          </div>
          <div className="strings">
            {stringNames.map((stringName, stringIndex) => (
              <div key={stringIndex} className="string">
                <div className="string-name">{stringName}</div>
                <div className="frets">
                  <div className="nut">
                    {chordData.frets[stringIndex] === '0' && (
                      <div className="open-string">○</div>
                    )}
                    {chordData.frets[stringIndex] === 'x' && (
                      <div className="muted-string">×</div>
                    )}
                  </div>
                  {[1, 2, 3, 4].map(fret => (
                    <div key={fret} className="fret">
                      {parseInt(chordData.frets[stringIndex]) === fret && (
                        <div className="finger-position">{chordData.fingers[stringIndex]}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderPianoKeys = (chordName) => {
    const renderData = chordDataService.renderPianoKeys(chordName, { className: 'inline-display' });
    const notes = renderData.activeNotes;
    const keyOrder = renderData.keyOrder;
    
    return (
      <div className="piano-chord-display inline-display">
        <div className="piano-keys-container">
          <div className="piano-keys">
            {keyOrder.map((note, index) => {
              const isPressed = notes.includes(note) || notes.includes(note.replace('#', '♯')) || notes.includes(note.replace('#', 'b'));
              const isBlackKey = note.includes('#');
              return (
                <div
                  key={note}
                  className={`piano-key ${isBlackKey ? 'black-key' : 'white-key'} ${isPressed ? 'pressed' : ''}`}
                >
                  <span className="key-label">{note}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`inline-chord-container ${className}`}>
      {displayMode === 'guitar' ? renderGuitarFretboard(chord) : renderPianoKeys(chord)}
    </div>
  );
};

export default InlineChordDisplay;