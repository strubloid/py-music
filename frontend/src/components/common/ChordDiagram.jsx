import React, { useState, useEffect } from 'react'
import { useChordDisplay } from '../../contexts/ChordDisplayContext'
import chordDataService from '../../services/ChordDataService.tsx'
import chordPreferenceManager from '../../services/ChordPreferenceManager.tsx'
import ChordVariationPicker from './ChordVariationPicker.jsx'
import './ChordDiagram.css'

// Guitar chord fingering data
const CHORD_FINGERINGS = {
  // Major chords
  'C': { frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0], name: 'C Major' },
  'D': { frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2], name: 'D Major' },
  'E': { frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0], name: 'E Major' },
  'F': { frets: [1, 3, 3, 2, 1, 1], fingers: [1, 4, 4, 3, 1, 1], name: 'F Major' },
  'G': { frets: [3, 2, 0, 0, 3, 3], fingers: [3, 2, 0, 0, 3, 4], name: 'G Major' },
  'A': { frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0], name: 'A Major' },
  'B': { frets: [-1, 2, 4, 4, 4, 2], fingers: [0, 1, 2, 3, 4, 1], name: 'B Major' },
  
  // Minor chords
  'Cm': { frets: [-1, 3, 5, 5, 4, 3], fingers: [0, 1, 3, 4, 2, 1], name: 'C Minor' },
  'Dm': { frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 1, 3, 2], name: 'D Minor' },
  'Em': { frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0], name: 'E Minor' },
  'Fm': { frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1], name: 'F Minor' },
  'Gm': { frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1], name: 'G Minor' },
  'Am': { frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0], name: 'A Minor' },
  'Bm': { frets: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1], name: 'B Minor' },
  
  // 7th chords
  'C7': { frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0], name: 'C Dominant 7' },
  'D7': { frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3], name: 'D Dominant 7' },
  'E7': { frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0], name: 'E Dominant 7' },
  'F7': { frets: [1, 3, 1, 2, 1, 1], fingers: [1, 4, 2, 3, 1, 1], name: 'F Dominant 7' },
  'G7': { frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1], name: 'G Dominant 7' },
  'A7': { frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 2, 0, 3, 0], name: 'A Dominant 7' },
  'B7': { frets: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4], name: 'B Dominant 7' },
  
  // Additional useful chord variations
  'Cadd9': { frets: [-1, 3, 2, 0, 3, 0], fingers: [0, 2, 1, 0, 3, 0], name: 'C add9' },
  'Dsus2': { frets: [-1, -1, 0, 2, 3, 0], fingers: [0, 0, 0, 1, 2, 0], name: 'D sus2' },
  'Dsus4': { frets: [-1, -1, 0, 2, 3, 3], fingers: [0, 0, 0, 1, 2, 3], name: 'D sus4' },
  'Esus4': { frets: [0, 2, 2, 2, 0, 0], fingers: [0, 1, 2, 3, 0, 0], name: 'E sus4' },
  'Fsus2': { frets: [1, 3, 3, 0, 1, 1], fingers: [1, 3, 4, 0, 1, 1], name: 'F sus2' },
  'Gsus4': { frets: [3, 3, 0, 0, 3, 3], fingers: [2, 3, 0, 0, 2, 4], name: 'G sus4' },
  'Asus2': { frets: [-1, 0, 2, 2, 0, 0], fingers: [0, 0, 1, 2, 0, 0], name: 'A sus2' },
  'Asus4': { frets: [-1, 0, 2, 2, 3, 0], fingers: [0, 0, 1, 2, 3, 0], name: 'A sus4' }
}

// Piano Chord Diagram Component
const PianoChordDiagram = ({ chord, size = 'medium' }) => {
  const renderData = chordDataService.renderPianoKeys(chord, { className: 'chord-diagram-piano' })
  const notes = renderData.activeNotes
  const keyOrder = renderData.keyOrder
  
  const sizes = {
    small: { whiteWidth: 14, whiteHeight: 50, blackWidth: 9, blackHeight: 32, fontSize: 9 },
    medium: { whiteWidth: 18, whiteHeight: 70, blackWidth: 11, blackHeight: 45, fontSize: 10 },
    large: { whiteWidth: 22, whiteHeight: 90, blackWidth: 14, blackHeight: 58, fontSize: 11 }
  }
  
  const { whiteWidth, whiteHeight, blackWidth, blackHeight, fontSize } = sizes[size]
  
  // Calculate white keys count for container width
  const whiteKeysCount = keyOrder.filter(k => !k.includes('#')).length
  
  return (
    <div className="chord-diagram-container piano-mode" title={chord}>
      <div className="piano-chord-diagram" style={{ width: `${whiteKeysCount * whiteWidth}px` }}>
        <div className="piano-keys-wrapper">
          {keyOrder.map((note, index) => {
            const isPressed = notes.includes(note)
            const isBlackKey = note.includes('#')
            
            // Calculate position for black keys
            let leftOffset = 0
            if (isBlackKey) {
              const whiteKeysBefore = keyOrder.slice(0, index).filter(k => !k.includes('#')).length
              leftOffset = whiteKeysBefore * whiteWidth - (blackWidth / 2)
            }
            
            return (
              <div
                key={note}
                className={`piano-key-diagram ${isBlackKey ? 'black' : 'white'} ${isPressed ? 'active' : ''}`}
                style={{
                  width: isBlackKey ? `${blackWidth}px` : `${whiteWidth}px`,
                  height: isBlackKey ? `${blackHeight}px` : `${whiteHeight}px`,
                  left: isBlackKey ? `${leftOffset}px` : 'auto',
                  fontSize: `${fontSize}px`
                }}
              >
                {isPressed && <span className="note-indicator"></span>}
              </div>
            )
          })}
        </div>
        <div className="chord-label-piano">{chord}</div>
      </div>
    </div>
  )
}

const ChordDiagram = ({ chord, size = 'medium' }) => {
  const { displayMode } = useChordDisplay()
  const [showVariations, setShowVariations] = useState(false)
  const [currentVariationIndex, setCurrentVariationIndex] = useState(0)
  
  // Load preferred variation on mount or when chord changes
  useEffect(() => {
    const preferredIndex = chordPreferenceManager.getPreferredVariation(chord)
    setCurrentVariationIndex(preferredIndex)
  }, [chord])
  
  // If piano mode, render piano keys instead
  if (displayMode === 'piano') {
    return <PianoChordDiagram chord={chord} size={size} />
  }
  
  // Get the current variation to display
  const chordData = chordDataService.getGuitarChordVariation(chord, currentVariationIndex)
  const hasMultipleVariations = chordDataService.hasMultipleVariations(chord)
  const variationCount = chordDataService.getVariationCount(chord)
  const allVariations = chordDataService.getGuitarChordVariations(chord)
  
  const handleChordClick = (e) => {
    if (hasMultipleVariations) {
      e.preventDefault()
      e.stopPropagation()
      setShowVariations(!showVariations)
    }
  }
  
  const handleSelectVariation = (index) => {
    setCurrentVariationIndex(index)
    chordPreferenceManager.setPreferredVariation(chord, index)
    setShowVariations(false)
  }
  
  const sizes = {
    small: { width: 60, height: 80, fretSpacing: 12 },
    medium: { width: 80, height: 100, fretSpacing: 15 },
    large: { width: 100, height: 120, fretSpacing: 18 }
  }
  
  const { width, height, fretSpacing } = sizes[size]
  const stringSpacing = (width - 20) / 5
  
  const getFretPosition = (fret) => {
    if (fret === 0) return null // Open string
    return 25 + (fret - 1) * fretSpacing
  }
  
  const getFingerColor = (finger) => {
    const colors = {
      0: 'transparent',
      1: '#ff6b6b', // Red
      2: '#4ecdc4', // Teal
      3: '#45b7d1', // Blue
      4: '#96ceb4'  // Green
    }
    return colors[finger] || '#333'
  }
  
  // Convert string format to number for rendering
  const parseStringFret = (fret) => {
    if (fret === 'x' || fret === 'X') return -1
    const num = parseInt(fret)
    return isNaN(num) ? -1 : num
  }
  
  return (
    <div className="chord-diagram-wrapper">
      <div 
        className={`chord-diagram-container ${hasMultipleVariations ? 'clickable' : ''}`}
        onClick={handleChordClick}
        title={hasMultipleVariations ? `Click to see ${variationCount} variations` : chord}
      >
        <svg width={width} height={height} className="chord-diagram">
          {/* Nut (top line) */}
          <line x1="10" y1="20" x2={width - 10} y2="20" stroke="#8B4513" strokeWidth="3" />
          
          {/* Frets */}
          {[1, 2, 3, 4].map(fret => (
            <line
              key={fret}
              x1="10"
              y1={20 + fret * fretSpacing}
              x2={width - 10}
              y2={20 + fret * fretSpacing}
              stroke="#ddd"
              strokeWidth="1"
            />
          ))}
          
          {/* Strings */}
          {chordDataService.guitarStringNames.map((string, index) => (
            <line
              key={string + index}
              x1={10 + index * stringSpacing}
              y1="20"
              x2={10 + index * stringSpacing}
              y2={20 + 4 * fretSpacing}
              stroke="#666"
              strokeWidth="1"
            />
          ))}
          
          {/* Finger positions */}
          {chordData.frets.map((fretStr, stringIndex) => {
            const fret = parseStringFret(fretStr)
            const x = 10 + stringIndex * stringSpacing
            const finger = chordData.fingers[stringIndex]
            
            if (fret === -1) {
              // Muted string - X above nut
              return (
                <g key={stringIndex}>
                  <line
                    x1={x - 3}
                    y1="8"
                    x2={x + 3}
                    y2="16"
                    stroke="#ff4444"
                    strokeWidth="2"
                  />
                  <line
                    x1={x - 3}
                    y1="16"
                    x2={x + 3}
                    y2="8"
                    stroke="#ff4444"
                    strokeWidth="2"
                  />
                </g>
              )
            } else if (fret === 0) {
              // Open string - circle above nut
              return (
                <circle
                  key={stringIndex}
                  cx={x}
                  cy="12"
                  r="4"
                  fill="none"
                  stroke="#4CAF50"
                  strokeWidth="2"
                />
              )
            } else if (fret > 0) {
              // Fretted note
              const y = getFretPosition(fret)
              return (
                <circle
                  key={stringIndex}
                  cx={x}
                  cy={y}
                  r="6"
                  fill={getFingerColor(finger)}
                  stroke="#333"
                  strokeWidth="1"
                />
              )
            }
            return null
          })}
          
          {/* Chord name */}
          <text
            x={width / 2}
            y={height - 5}
            textAnchor="middle"
            fontSize="12"
            fontWeight="bold"
            fill="#333"
          >
            {chord}
          </text>
        </svg>
        
        {/* Variation indicator */}
        {hasMultipleVariations && (
          <div className="variation-indicator">
            {variationCount} shapes
          </div>
        )}
      </div>
      
      {/* Inline Variations Dropdown */}
      {showVariations && hasMultipleVariations && (
        <div className="inline-variations-container">
          <div className="inline-variations-header">
            Choose shape for {chord}
          </div>
          <div className="inline-variations-grid">
            {allVariations.map((variation, index) => {
              if (index === currentVariationIndex) return null; // Skip current variation
              
              return (
                <div
                  key={index}
                  className="inline-variation-item"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSelectVariation(index)
                  }}
                >
                  <div className="inline-variation-label">
                    {variation.position || `Variation ${index + 1}`}
                  </div>
                  <svg viewBox="0 0 80 100" className="inline-mini-svg">
                    {/* Simplified mini diagram */}
                    {[0, 1, 2, 3, 4].map(fret => (
                      <line
                        key={`fret-${fret}`}
                        x1="10"
                        y1={15 + fret * 16}
                        x2="70"
                        y2={15 + fret * 16}
                        stroke={fret === 0 ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.25)"}
                        strokeWidth={fret === 0 ? "2" : "1"}
                      />
                    ))}
                    {[0, 1, 2, 3, 4, 5].map(string => (
                      <line
                        key={`string-${string}`}
                        x1={10 + string * 12}
                        y1="15"
                        x2={10 + string * 12}
                        y2="79"
                        stroke="rgba(255,255,255,0.25)"
                        strokeWidth="1"
                      />
                    ))}
                    {variation.frets.map((fret, stringIndex) => {
                      const x = 10 + stringIndex * 12
                      if (fret === 'x' || fret === 'X') {
                        return (
                          <g key={`fret-${stringIndex}`}>
                            <line x1={x-3} y1="8" x2={x+3} y2="14" stroke="#ff4757" strokeWidth="2" />
                            <line x1={x-3} y1="14" x2={x+3} y2="8" stroke="#ff4757" strokeWidth="2" />
                          </g>
                        )
                      } else if (fret === '0') {
                        return (
                          <circle key={`fret-${stringIndex}`} cx={x} cy="11" r="3" fill="none" stroke="#26de81" strokeWidth="2" />
                        )
                      } else {
                        const fretNum = parseInt(fret)
                        const y = 15 + (fretNum - 0.5) * 16
                        return (
                          <circle key={`fret-${stringIndex}`} cx={x} cy={y} r="4" fill="#45aaf2" />
                        )
                      }
                    })}
                  </svg>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default ChordDiagram