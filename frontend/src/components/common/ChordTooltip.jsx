import React, { useState, useEffect, useRef } from 'react';
import { useChordDisplay } from '../../contexts/ChordDisplayContext';
import { useChordPanel } from '../../contexts/ChordPanelContext';
import chordDataService from '../../services/ChordDataService.tsx';
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

  /**
   * This function handles click on the chord element to show the tooltip
   * @param {event} e Event object 
   * @returns void
   */
  const handleClick = (e) => {
    e.stopPropagation();
    
    // Ignore clicks that happen right after finishing a drag
    if (justFinishedDrag) {
      setJustFinishedDrag(false);
      return;
    }
    
    // Just show tooltip, don't add to selected chords
    // addChord(chord); // REMOVED: No longer auto-add to selected chords
  
    // Get the chord element's position
    const rect = e.currentTarget.getBoundingClientRect();
    
    // X position follows the chord element (centered on it)
    // Y position is fixed at the top area
    let initialX = rect.left - 300;
    let initialY = rect.height + 400;
    
    // setting initial position
    setPosition({
      x: initialX,
      y: initialY
    });
    setIsPersistent(true);
    setIsVisible(true);
  };

  /**
   * This function handles closing the tooltip
   * @param {event} e Event object 
   */
  const handleClose = (e) => {
    e.stopPropagation(); // Prevent any other event handling
    e.preventDefault();  // Make sure it doesn't trigger other handlers
    setIsPersistent(false);
    setIsVisible(false);
  };

  /**
   * Mouse down handler - initiates dragging
   * @param {event} e Event object
   */
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

  /**
   * This function handles dragging the tooltip
   * @param {event} e Event object
   */
  const handleDrag = (e) => {
    e.preventDefault();
    const newPos = {
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y
    };
    setPosition(newPos);
  };

  // Mouse up handler - maintains final position
  const handleMouseUp = (e) => {
    e.preventDefault();
    
    // set statuses
    setIsDragging(false);
    setJustFinishedDrag(true);
    
    // Clear the flag after a short delay to allow normal clicking again
    setTimeout(() => {
      setJustFinishedDrag(false);
    }, 150);
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

  /**
   * This function renders a simple piano chord diagram
   * @returns 
   */
  const renderPianoChord = () => {
    // Use centralized chord data service
    const notes = chordDataService.getPianoChordData(chord);
    const whiteKeys = chordDataService.pianoKeyOrder.filter(note => !note.includes('#'));
    const blackKeys = chordDataService.pianoKeyOrder.filter(note => note.includes('#'));

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
    // Use same string order as main fretboard: E, B, G, D, A, E (high to low)
    const strings = chordDataService.guitarStringNames; // Use centralized string order
    
    // Use centralized chord data service
    const chordData = chordDataService.getGuitarChordData(chord);
    const stringNames = chordDataService.guitarStringNames;

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