import React, { useState, useEffect, useRef } from 'react';
import { useChordDisplay } from '../../contexts/ChordDisplayContext';
import { useChordPanel } from '../../contexts/ChordPanelContext';
import musicConfig from '../../services/MusicDisplayConfig.jsx';
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
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [justFinishedDrag, setJustFinishedDrag] = useState(false);
  
  const tooltipRef = useRef(null);
  
  // Use provided type or fall back to global context (guitar is default)
  const tooltipType = type || displayMode;
  
  // Don't render tooltip if chord is empty or null
  if (!chord) {
    return children;
  }

  const handleClick = (e) => {
    e.stopPropagation();
    
    // Ignore clicks that happen right after finishing a drag
    if (justFinishedDrag) {
      console.log('🚫 CLICK IGNORED - Just finished dragging, preventing repositioning');
      setJustFinishedDrag(false);
      return;
    }
    
    console.log('✅ CLICK ACCEPTED - Processing new tooltip positioning');
    
    // Add chord to panel
    addChord(chord);
    
    const rect = e.target.getBoundingClientRect();
    const currentTargetRect = e.currentTarget.getBoundingClientRect();
    
    console.log('🎯 DEBUG - Raw mouse:', { x: e.clientX, y: e.clientY });
    console.log('🎯 DEBUG - Target rect:', { top: rect.top, left: rect.left, bottom: rect.bottom, right: rect.right, width: rect.width, height: rect.height });
    
    // Position tooltip consistently relative to the element, not the click point
    // Use element's horizontal center and position above the element
    let initialX = rect.left + (rect.width / 2); // Center of the element horizontally
    let initialY = rect.top/2 - 140; // Rule for the base showing

    

    
    // setting initial position
    setPosition({
      x: initialX,
      y: initialY
    });
    setIsPersistent(true);
    setIsVisible(true);
  };

  const handleClose = (e) => {
    e.stopPropagation(); // Prevent any other event handling
    e.preventDefault();  // Make sure it doesn't trigger other handlers
    console.log('🔴 CLOSING TOOLTIP');
    setIsPersistent(false);
    setIsVisible(false);
  };

  const handleMouseDown = (e) => {
    if (e.target.classList.contains('tooltip-header') || e.target.classList.contains('tooltip-title')) {
      e.preventDefault();
      e.stopPropagation();
      
      const offset = {
        x: e.clientX - position.x,
        y: e.clientY - position.y
      };
      
      setDragOffset(offset);
      setIsDragging(true);
    }
  };



  // Drag handler - free movement
  const handleDrag = (e) => {
    e.preventDefault();

    // Calculate new center position (since position.x represents the center due to CSS transform)
    const newPos = {
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y
    };
    
    console.log("🎯 DRAG - Set position to:", newPos);
    setPosition(newPos);
  };

  // Mouse up handler - maintains final position
  const handleMouseUp = (e) => {
    e.preventDefault();
    console.log('🛑 DRAG END - Maintaining position at:', position);
    
    setIsDragging(false);
    setJustFinishedDrag(true);
    
    // Clear the flag after a short delay to allow normal clicking again
    setTimeout(() => {
      setJustFinishedDrag(false);
      console.log('✅ CLICK ENABLED - Ready for new clicks');
    }, 100);
  };

  // Add mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {

      // Use single drag handler
      const handleGlobalMouseMove = handleDrag;

      // adding the mouse move listener
      document.addEventListener('mousemove', handleGlobalMouseMove, { passive: false });
      
      // here i am adding the mouse up listener
      document.addEventListener('mouseup', handleMouseUp, { passive: false });

      document.body.style.cursor = 'grabbing';
      
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
      };
    }
  }, [isDragging, dragOffset.x, dragOffset.y, position]);

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

    const notes = chordPatterns[chord] || [chord];
    const whiteKeys = musicConfig.getPianoKeyOrder();
    const blackKeys = musicConfig.getBlackKeyOrder();

    return (
      <div className="piano-chord-diagram">
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
    const strings = musicConfig.getGuitarStrings();

    return (
      <div className="guitar-chord-diagram">
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
      onClick={handleClick}
    >
      {children}
      
      {isVisible && isPersistent && (
        <div
          ref={tooltipRef}
          className={`chord-tooltip persistent ${isDragging ? 'dragging' : ''}`}
          style={{
            left: position.x,
            top: position.y,
            cursor: isDragging ? 'grabbing' : 'default'
          }}
          onMouseDown={handleMouseDown}
        >
          {isPersistent && (
            <div className="tooltip-header">
              <div className="tooltip-title">{chord}</div>
              <button className="close-button" onClick={handleClose}>
                ×
              </button>
            </div>
          )}
          {renderChordDiagram()}
        </div>
      )}
      

    </span>
  );
};

export default ChordTooltip;