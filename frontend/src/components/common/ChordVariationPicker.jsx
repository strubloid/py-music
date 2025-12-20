import React, { useState } from 'react'
import chordDataService from '../../services/ChordDataService.tsx'
import chordPreferenceManager from '../../services/ChordPreferenceManager.tsx'
import './ChordVariationPicker.css'

const ChordVariationPicker = ({ chordName, currentVariationIndex, onSelectVariation, onClose }) => {
  const [selectedIndex, setSelectedIndex] = useState(currentVariationIndex)
  const variations = chordDataService.getGuitarChordVariations(chordName)

  const handleSelect = (index) => {
    setSelectedIndex(index)
    chordPreferenceManager.setPreferredVariation(chordName, index)
    onSelectVariation(index)
  }

  const renderMiniChord = (chordData, index) => {
    const isSelected = index === selectedIndex
    
    // Find the lowest and highest fret used (excluding open and muted)
    const fretNumbers = chordData.frets
      .map(f => (f === 'x' || f === 'X' || f === '0') ? null : parseInt(f))
      .filter(f => f !== null)
    
    const minFret = fretNumbers.length > 0 ? Math.min(...fretNumbers) : 1
    const maxFret = fretNumbers.length > 0 ? Math.max(...fretNumbers) : 4
    const fretRange = Math.max(4, maxFret - minFret + 1)
    const startFret = Math.max(1, minFret)
    
    return (
      <div 
        key={index}
        className={`variation-item ${isSelected ? 'selected' : ''}`}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          handleSelect(index)
        }}
      >
        <div className="variation-number">#{index + 1}</div>
        <div className="mini-chord-diagram">
          <svg viewBox="0 0 100 130" className="mini-svg">
            {/* Fret position indicator */}
            {startFret > 1 && (
              <text
                x="8"
                y="32"
                fontSize="9"
                fill="rgba(255,255,255,0.9)"
                fontWeight="bold"
              >
                {startFret}
              </text>
            )}
            
            {/* Frets (horizontal lines) */}
            {[0, 1, 2, 3, 4].map(fret => (
              <line
                key={`fret-${fret}`}
                x1="18"
                y1={25 + fret * 18}
                x2="82"
                y2={25 + fret * 18}
                stroke={fret === 0 ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.3)"}
                strokeWidth={fret === 0 ? "2.5" : "1.2"}
              />
            ))}
            
            {/* Strings (vertical lines) */}
            {[0, 1, 2, 3, 4, 5].map(string => (
              <line
                key={`string-${string}`}
                x1={18 + string * 12.8}
                y1="25"
                x2={18 + string * 12.8}
                y2="97"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="1.2"
              />
            ))}
            
            {/* Fret positions */}
            {chordData.frets.map((fret, stringIndex) => {
              const x = 18 + stringIndex * 12.8
              
              if (fret === 'x' || fret === 'X') {
                // Muted string - X above
                return (
                  <g key={`fret-${stringIndex}`}>
                    <line x1={x-4} y1="14" x2={x+4} y2="22" stroke="#ff4757" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1={x-4} y1="22" x2={x+4} y2="14" stroke="#ff4757" strokeWidth="2.5" strokeLinecap="round" />
                  </g>
                )
              } else if (fret === '0') {
                // Open string - circle above
                return (
                  <circle
                    key={`fret-${stringIndex}`}
                    cx={x}
                    cy="18"
                    r="4"
                    fill="none"
                    stroke="#26de81"
                    strokeWidth="2.5"
                  />
                )
              } else {
                // Fretted note
                const fretNum = parseInt(fret)
                const relativeFret = fretNum - startFret + 1
                const y = 25 + (relativeFret - 0.5) * 18
                
                const finger = chordData.fingers[stringIndex]
                const fingerColors = {
                  1: '#fc5c65',
                  2: '#fd9644', 
                  3: '#fed330',
                  4: '#26de81'
                }
                
                return (
                  <circle
                    key={`fret-${stringIndex}`}
                    cx={x}
                    cy={y}
                    r="5.5"
                    fill={fingerColors[finger] || '#45aaf2'}
                    stroke="rgba(255,255,255,0.4)"
                    strokeWidth="1.5"
                  />
                )
              }
            })}
          </svg>
        </div>
        {chordData.position && (
          <div className="variation-position">{chordData.position}</div>
        )}
      </div>
    )
  }

  return (
    <div className="chord-variation-picker-overlay" onClick={onClose}>
      <div className="chord-variation-picker" onClick={(e) => e.stopPropagation()}>
        <div className="picker-header">
          <h3>{chordName} - Choose Your Preferred Shape</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="picker-subtitle">
          {variations.length} variation{variations.length !== 1 ? 's' : ''} available across the fretboard
        </div>
        <div className="variations-grid">
          {variations.map((variation, index) => renderMiniChord(variation, index))}
        </div>
        <div className="picker-footer">
          <p>💡 Your selection will be remembered for next time</p>
        </div>
      </div>
    </div>
  )
}

export default ChordVariationPicker
