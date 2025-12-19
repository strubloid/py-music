import React from 'react'
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

const ChordDiagram = ({ chord, size = 'medium' }) => {
  console.log('ChordDiagram rendering:', chord, size)
  const chordData = CHORD_FINGERINGS[chord] || CHORD_FINGERINGS['C']
  console.log('Using chord data:', chordData)
  
  const sizes = {
    small: { width: 60, height: 80, fretSpacing: 12 },
    medium: { width: 80, height: 100, fretSpacing: 15 },
    large: { width: 100, height: 120, fretSpacing: 18 }
  }
  
  const { width, height, fretSpacing } = sizes[size]
  const stringSpacing = (width - 20) / 5
  const strings = ['E', 'A', 'D', 'G', 'B', 'E']
  
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
  
  return (
    <div className="chord-diagram-container" title={chordData.name}>
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
        {strings.map((string, index) => (
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
        {chordData.frets.map((fret, stringIndex) => {
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
    </div>
  )
}

export default ChordDiagram