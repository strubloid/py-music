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

const ChordDiagram = ({ chord, size = 'medium', refreshTrigger }) => {
  const { displayMode } = useChordDisplay()
  const [currentVariationIndex, setCurrentVariationIndex] = useState(0)
  
  // Load preferred variation on mount, when chord changes, or when refreshTrigger changes
  useEffect(() => {
    const preferredIndex = chordPreferenceManager.getPreferredVariation(chord)
    setCurrentVariationIndex(preferredIndex)
  }, [chord, refreshTrigger])
  
  // If piano mode, render piano keys instead
  if (displayMode === 'piano') {
    return <PianoChordDiagram chord={chord} size={size} />
  }
  
  // Get the current variation to display
  const chordData = chordDataService.getGuitarChordVariation(chord, currentVariationIndex)
  const hasMultipleVariations = chordDataService.hasMultipleVariations(chord)
  const variationCount = chordDataService.getVariationCount(chord)
  
  console.log(`Chord: ${chord}, Has Multiple: ${hasMultipleVariations}, Count: ${variationCount}, Current Index: ${currentVariationIndex}`)
  
  const handlePrevVariation = (e) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('Prev clicked!', currentVariationIndex)
    const newIndex = currentVariationIndex === 0 ? variationCount - 1 : currentVariationIndex - 1
    setCurrentVariationIndex(newIndex)
    chordPreferenceManager.setPreferredVariation(chord, newIndex)
  }
  
  const handleNextVariation = (e) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('Next clicked!', currentVariationIndex)
    const newIndex = (currentVariationIndex + 1) % variationCount
    setCurrentVariationIndex(newIndex)
    chordPreferenceManager.setPreferredVariation(chord, newIndex)
  }
  
  const sizes = {
    small: { width: 90, height: 135, fretSpacing: 18 },
    medium: { width: 120, height: 170, fretSpacing: 22 },
    large: { width: 150, height: 200, fretSpacing: 27 }
  }
  
  const { width, height, fretSpacing } = sizes[size]
  const leftMargin = 20 // Space for fret position number
  const stringSpacing = (width - leftMargin) / 5
  
  // Convert string format to number for rendering (define this first!)
  const parseStringFret = (fret) => {
    if (fret === 'x' || fret === 'X') return -1
    const num = parseInt(fret)
    return isNaN(num) ? -1 : num
  }
  
  // Calculate the starting fret for the diagram
  const fretNumbers = chordData.frets
    .map(f => {
      const parsed = parseStringFret(f)
      return parsed > 0 ? parsed : null
    })
    .filter(f => f !== null)
  
  const minFret = fretNumbers.length > 0 ? Math.min(...fretNumbers) : 1
  const maxFret = fretNumbers.length > 0 ? Math.max(...fretNumbers) : 4
  
  // Check if chord has open strings
  const hasOpenStrings = chordData.frets.some(f => parseStringFret(f) === 0)
  
  // If has open strings and minFret <= 5, start from 0. Otherwise start from minFret.
  // Only show position number if starting at fret 5 or higher
  const startFret = (hasOpenStrings && minFret <= 5) ? 0 : minFret
  const showFretNumber = startFret >= 5
  
  const getFretPosition = (absoluteFret, startFret) => {
    if (absoluteFret === 0) return null // Open string
    // For positions 0-5, show absolute position. For higher, show relative.
    const relativeFret = startFret === 0 ? absoluteFret : (absoluteFret - startFret + 1)
    // Position between frets (0.5 = middle of first fret)
    return 30 + (relativeFret - 0.5) * fretSpacing
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
  
  return (
    <div className="chord-diagram-wrapper">
      <div 
        className="chord-diagram-container"
        title={chordData.position || chord}
      >
        <svg width={width + 20} height={height + 20} className="chord-diagram">
          {/* String names (tuning) at the top */}
          {chordDataService.guitarStringNames.map((stringName, index) => {
            const x = leftMargin + index * stringSpacing
            return (
              <text
                key={`string-name-${index}`}
                x={x}
                y="10"
                textAnchor="middle"
                fontSize="11"
                fontWeight="bold"
                fill="#666"
              >
                {stringName}
              </text>
            )
          })}
          
          {/* Fret position indicator */}
          {showFretNumber && (
            <text
              x="0"
              y="34"
              fontSize="14"
              fontWeight="bold"
              fill="#333"
            >
              {startFret}
            </text>
          )}
          
          {/* Nut (top line) - thicker for first position, thinner for others */}
          <line 
            x1={leftMargin}
            y1="30" 
            x2={width + leftMargin - 20}
            y2="30" 
            stroke={startFret === 0 || startFret === 1 ? "#8B4513" : "#ddd"} 
            strokeWidth={startFret === 0 || startFret === 1 ? "5" : "3.5"} 
          />
          
          {/* Frets */}
          {[1, 2, 3, 4].map(fret => (
            <line
              key={fret}
              x1={leftMargin}
              y1={30 + fret * fretSpacing}
              x2={width + leftMargin - 20}
              y2={30 + fret * fretSpacing}
              stroke="#ddd"
              strokeWidth="3"
            />
          ))}
          
          {/* Strings */}
          {chordDataService.guitarStringNames.map((string, index) => (
            <line
              key={string + index}
              x1={leftMargin + index * stringSpacing}
              y1="30"
              x2={leftMargin + index * stringSpacing}
              y2={30 + 4 * fretSpacing}
              stroke="#666"
              strokeWidth="3"
            />
          ))}
          
          {/* Finger positions */}
          {chordData.frets.map((fretStr, stringIndex) => {
            const fret = parseStringFret(fretStr)
            const x = leftMargin + stringIndex * stringSpacing
            const finger = chordData.fingers[stringIndex]
            
            if (fret === -1) {
              // Muted string - X above nut
              return (
                <g key={stringIndex}>
                  <line
                    x1={x - 3}
                    y1="18"
                    x2={x + 3}
                    y2="26"
                    stroke="#ff4444"
                    strokeWidth="4"
                  />
                  <line
                    x1={x - 3}
                    y1="26"
                    x2={x + 3}
                    y2="18"
                    stroke="#ff4444"
                    strokeWidth="4"
                  />
                </g>
              )
            } else if (fret === 0) {
              // Open string - show "0" text
              return (
                <g key={stringIndex}>
                  <circle
                    cx={x}
                    cy="22"
                    r="5"
                    fill="white"
                    stroke="#4CAF50"
                    strokeWidth="3"
                  />
                  <text
                    x={x}
                    y="26"
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="bold"
                    fill="#4CAF50"
                  >
                    0
                  </text>
                </g>
              )
            } else if (fret > 0) {
              // Fretted note - calculate position relative to starting fret
              const y = getFretPosition(fret, startFret)
              return (
                <g key={stringIndex}>
                  <circle
                    cx={x}
                    cy={y}
                    r="8"
                    fill={getFingerColor(finger)}
                    stroke="#333"
                    strokeWidth="3"
                  />
                  {finger && finger !== 0 && (
                    <text
                      x={x}
                      y={y + 4}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="bold"
                      fill="#fff"
                    >
                      {finger}
                    </text>
                  )}
                </g>
              )
            }
            return null
          })}
          
          {/* Chord name */}
          <text
            x={width / 2}
            y={height - 10}
            textAnchor="middle"
            fontSize="12"
            fontWeight="bold"
            fill="#333"
          >
            {chord}
          </text>
        </svg>
      </div>
    </div>
  )
}

export default ChordDiagram