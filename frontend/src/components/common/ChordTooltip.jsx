import React, { useState, useEffect } from 'react';
import { useChordDisplay } from '../../contexts/ChordDisplayContext';
import { useChordPanel } from '../../contexts/ChordPanelContext';
import './ChordTooltip.css';

const ChordTooltip = ({ 
  chord, 
  children, 
  type, // optional override, otherwise uses global context
  className = '' 
}) => {
  const { displayMode } = useChordDisplay();
  const { addChord } = useChordPanel();
  const [isVisible, setIsVisible] = useState(false);
  const [isPersistent, setIsPersistent] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  // Use provided type or fall back to global context (guitar is default)
  const tooltipType = type || displayMode;
  
  // Don't render tooltip if chord is empty or null
  if (!chord) {
    return children;
  }

  const handleMouseEnter = (e) => {
    const rect = e.target.getBoundingClientRect();
    setPosition({
      x: rect.left + rect.width / 2,
      y: rect.bottom + 15 // Increased gap to prevent mouse leave issues
    });
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    if (!isPersistent) {
      setIsVisible(false);
    }
  };

  const handleClick = (e) => {
    e.stopPropagation();
    
    // Add chord to panel
    addChord(chord);
    
    const rect = e.target.getBoundingClientRect();
    setPosition({
      x: rect.left + rect.width / 2,
      y: rect.bottom + 15
    });
    setIsPersistent(true);
    setIsVisible(true);
  };

  const handleTooltipClick = (e) => {
    e.stopPropagation();
  };

  // Close persistent tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (isPersistent) {
        setIsPersistent(false);
        setIsVisible(false);
      }
    };

    if (isPersistent) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isPersistent]);

  // Add delay to mouse leave to prevent disappearing when moving to tooltip
  const [leaveTimeout, setLeaveTimeout] = useState(null);

  const handleMouseEnterDelayed = (e) => {
    if (leaveTimeout) {
      clearTimeout(leaveTimeout);
      setLeaveTimeout(null);
    }
    handleMouseEnter(e);
  };

  const handleMouseLeaveDelayed = () => {
    if (!isPersistent) {
      const timeout = setTimeout(() => {
        setIsVisible(false);
      }, 300); // 300ms delay
      setLeaveTimeout(timeout);
    }
  };

  const handleTooltipMouseEnter = () => {
    if (leaveTimeout) {
      clearTimeout(leaveTimeout);
      setLeaveTimeout(null);
    }
  };

  const handleTooltipMouseLeave = () => {
    if (!isPersistent) {
      setIsVisible(false);
    }
  };

  // Generate chord diagram based on type
  const renderChordDiagram = () => {
    if (tooltipType === 'piano') {
      return renderPianoChord();
    } else if (tooltipType === 'guitar') {
      return renderGuitarChord();
    }
    return null;
  };

  const renderPianoChord = () => {
    // Basic chord patterns - this is a simplified version
    const chordPatterns = {
      'C': ['C', 'E', 'G'],
      'Dm': ['D', 'F', 'A'],
      'Em': ['E', 'G', 'B'],
      'F': ['F', 'A', 'C'],
      'G': ['G', 'B', 'D'],
      'Am': ['A', 'C', 'E'],
      'Bdim': ['B', 'D', 'F'],
      // Single notes
      'D': ['D'],
      'E': ['E'],
      'F#': ['F#'],
      'G#': ['G#'],
      'A': ['A'],
      'A#': ['A#'],
      'B': ['B'],
      'C#': ['C#'],
      'D#': ['D#']
    };

    const notes = chordPatterns[chord] || [chord]; // Default to the chord name itself
    const whiteKeys = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const blackKeys = ['C#', 'D#', 'F#', 'G#', 'A#'];

    return (
      <div className="piano-chord-diagram">
        <div className="chord-title">{chord}</div>
        <div className="mini-piano">
          <div className="white-keys">
            {whiteKeys.map((note, index) => (
              <div
                key={note}
                className={`white-key ${notes.includes(note) ? 'active' : ''}`}
              >
                <span className="key-label">{note}</span>
              </div>
            ))}
          </div>
          <div className="black-keys">
            {blackKeys.map((note, index) => (
              <div
                key={note}
                className={`black-key ${notes.includes(note) ? 'active' : ''}`}
                style={{ left: `${[10, 24, 52, 66, 80][index]}%` }}
              >
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderGuitarChord = () => {
    // Basic guitar chord fingerings - simplified version
    const guitarChords = {
      'C': { frets: ['x', '3', '2', '0', '1', '0'], fingers: [null, 3, 2, null, 1, null] },
      'Dm': { frets: ['x', 'x', '0', '2', '3', '1'], fingers: [null, null, null, 2, 3, 1] },
      'Em': { frets: ['0', '2', '2', '0', '0', '0'], fingers: [null, 2, 3, null, null, null] },
      'F': { frets: ['1', '3', '3', '2', '1', '1'], fingers: [1, 4, 3, 2, 1, 1] },
      'G': { frets: ['3', '2', '0', '0', '3', '3'], fingers: [3, 2, null, null, 4, 4] },
      'Am': { frets: ['x', '0', '2', '2', '1', '0'], fingers: [null, null, 2, 3, 1, null] },
      // For single notes, show a simple representation
      'D': { frets: ['x', 'x', '0', '2', '3', 'x'], fingers: [null, null, null, 1, 2, null] },
      'E': { frets: ['0', '2', '2', '1', '0', '0'], fingers: [null, 2, 3, 1, null, null] },
      'A': { frets: ['x', '0', '2', '2', '2', '0'], fingers: [null, null, 1, 2, 3, null] },
      'B': { frets: ['x', '2', '4', '4', '4', '2'], fingers: [null, 1, 2, 3, 4, 1] }
    };

    const chordData = guitarChords[chord] || guitarChords['C'];
    const strings = ['E', 'A', 'D', 'G', 'B', 'E'];

    return (
      <div className="guitar-chord-diagram">
        <div className="chord-title">{chord}</div>
        <div className="guitar-fretboard">
          <div className="fret-numbers">
            <div></div>
            {[1, 2, 3, 4].map(fret => (
              <div key={fret} className="fret-number">{fret}</div>
            ))}
          </div>
          {strings.map((string, stringIndex) => (
            <div key={stringIndex} className="guitar-string-row">
              <div className="string-name">{string}</div>
              {[0, 1, 2, 3, 4].map(fret => (
                <div key={fret} className="fret-position">
                  {fret === 0 && chordData.frets[stringIndex] === '0' && (
                    <div className="open-string">o</div>
                  )}
                  {fret === 0 && chordData.frets[stringIndex] === 'x' && (
                    <div className="muted-string">×</div>
                  )}
                  {fret > 0 && parseInt(chordData.frets[stringIndex]) === fret && (
                    <div className="finger-position">{chordData.fingers[stringIndex]}</div>
                  )}
                  {fret > 0 && <div className="fret-line"></div>}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <span
      className={`chord-tooltip-trigger ${className}`}
      onMouseEnter={handleMouseEnterDelayed}
      onMouseLeave={handleMouseLeaveDelayed}
      onClick={handleClick}
    >
      {children}
      
      {isVisible && (
        <div
          className={`chord-tooltip ${isPersistent ? 'persistent' : ''}`}
          style={{
            left: position.x,
            top: position.y,
            transform: 'translate(-50%, 0)'
          }}
          onClick={handleTooltipClick}
          onMouseEnter={handleTooltipMouseEnter}
          onMouseLeave={handleTooltipMouseLeave}
        >
          {renderChordDiagram()}
          {isPersistent && (
            <div className="close-hint">
              Click outside to close
            </div>
          )}
        </div>
      )}
    </span>
  );
};

export default ChordTooltip;