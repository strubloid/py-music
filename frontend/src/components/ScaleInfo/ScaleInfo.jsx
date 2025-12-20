import React, { useState } from 'react'
import { useChordPanel } from '../../contexts/ChordPanelContext'
import Card from '../common/Card'
import ChordDiagram from '../common/ChordDiagram'
import chordDataService from '../../services/ChordDataService.tsx'
import chordPreferenceManager from '../../services/ChordPreferenceManager.tsx'
import './ScaleInfo.css'

const ScaleInfo = ({ scaleData }) => {
  const { scale_name, notes, scale_degrees, chords } = scaleData
  const { showChords } = useChordPanel()
  const [selectedChord, setSelectedChord] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleChordClick = (chordName) => {
    // Toggle selection: if clicking the same chord, deselect it
    if (selectedChord === chordName) {
      setSelectedChord(null)
    } else {
      setSelectedChord(chordName)
    }
  }

  const handleVariationSelect = (index) => {
    // Force re-render of all chord diagrams by updating refresh key
    setRefreshKey(prev => prev + 1)
  }

  const renderChordVariations = () => {
    if (!selectedChord) return null

    const variations = chordDataService.getGuitarChordVariations(selectedChord)
    const currentIndex = chordPreferenceManager.getPreferredVariation(selectedChord)

    if (!variations || variations.length <= 1) return null

    return (
      <div className="change-chord-block">
        <div className="change-chord-header">
          <h3>Choose shape for {selectedChord}</h3>
          <button 
            className="close-variations-btn"
            onClick={() => setSelectedChord(null)}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="chord-variations-list">
          {variations.map((chordData, index) => {
            const isSelected = index === currentIndex
            return (
              <div
                key={index}
                className={`chord-variation-item ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  chordPreferenceManager.setPreferredVariation(selectedChord, index)
                  handleVariationSelect(index)
                }}
              >
                <div className="variation-label">
                  {chordData.position || `Shape ${index + 1}`}
                </div>
                <div className="mini-chord-preview">
                  {renderMiniChordDiagram(chordData, isSelected)}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderMiniChordDiagram = (chordData, isSelected) => {
    const fretNumbers = chordData.frets
      .map(f => (f === 'x' || f === 'X' || f === '0') ? null : parseInt(f))
      .filter(f => f !== null)
    
    const minFret = fretNumbers.length > 0 ? Math.min(...fretNumbers) : 1
    const startFret = Math.max(1, minFret)
    
    return (
      <svg viewBox="0 0 80 100" className="mini-chord-svg">
        {startFret > 1 && (
          <text x="5" y="28" fontSize="8" fill="rgba(255,255,255,0.9)" fontWeight="bold">
            {startFret}
          </text>
        )}
        
        {/* Frets */}
        {[0, 1, 2, 3, 4].map(fret => (
          <line
            key={`fret-${fret}`}
            x1="15" y1={20 + fret * 15}
            x2="65" y2={20 + fret * 15}
            stroke={fret === 0 ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.3)"}
            strokeWidth={fret === 0 ? "2" : "1"}
          />
        ))}
        
        {/* Strings */}
        {[0, 1, 2, 3, 4, 5].map(string => (
          <line
            key={`string-${string}`}
            x1={15 + string * 10}
            y1="20"
            x2={15 + string * 10}
            y2="80"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1"
          />
        ))}
        
        {/* Finger positions */}
        {chordData.frets.map((fret, stringIndex) => {
          const x = 15 + stringIndex * 10
          
          if (fret === 'x' || fret === 'X') {
            return (
              <g key={`fret-${stringIndex}`}>
                <line x1={x-3} y1="12" x2={x+3} y2="18" stroke="#ff4757" strokeWidth="2" strokeLinecap="round" />
                <line x1={x-3} y1="18" x2={x+3} y2="12" stroke="#ff4757" strokeWidth="2" strokeLinecap="round" />
              </g>
            )
          } else if (fret === '0') {
            return (
              <circle
                key={`fret-${stringIndex}`}
                cx={x} cy="15"
                r="3"
                fill="none"
                stroke="#4CAF50"
                strokeWidth="1.5"
              />
            )
          } else {
            const fretNum = parseInt(fret)
            const relativeFret = fretNum - startFret + 1
            const y = 20 + (relativeFret - 0.5) * 15
            return (
              <circle
                key={`fret-${stringIndex}`}
                cx={x} cy={y}
                r="4"
                fill={isSelected ? "#10b981" : "#4ecdc4"}
                stroke="#333"
                strokeWidth="1"
              />
            )
          }
        })}
      </svg>
    )
  }

  return (
    <div className="scale-info-container">
      <h2 className="scale-title">
        {scale_name}
      </h2>
      
      {/* Scale Chords - Main focus of this tab */}
      <Card title="Scale Chords" className="scale-chords-main">
        <div className="chords-display">
          <div className="roman-numerals">
            {scale_degrees.map((degree, index) => (
              <div 
                key={index} 
                className={`chord-column ${selectedChord === degree.chord ? 'selected' : ''}`}
                onClick={() => handleChordClick(degree.chord)}
              >
                <div className="roman-numeral">{degree.roman}</div>
                {showChords ? (
                  <ChordDiagram 
                    chord={degree.chord} 
                    size="medium"
                    refreshTrigger={refreshKey}
                  />
                ) : (
                  <div className="chord-name">{degree.chord}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Chord Variation Selection Block */}
        {renderChordVariations()}
      </Card>


    </div>
  )
}

export default ScaleInfo