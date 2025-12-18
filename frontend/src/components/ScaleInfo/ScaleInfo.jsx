import React from 'react'
import Card from '../common/Card'
import ChordTooltip from '../common/ChordTooltip'
import { useChordPanel } from '../../contexts/ChordPanelContext'
import './ScaleInfo.css'

const ScaleInfo = ({ scaleData }) => {
  const { scale_name, notes, scale_degrees, chords, chord_sevenths } = scaleData
  const { selectedChords, addChord } = useChordPanel()

  const handleSeventhChordClick = (chord) => {
    addChord(chord)
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
              <div key={index} className="chord-column">
                <div className="roman-numeral">{degree.roman}</div>
                <ChordTooltip chord={degree.chord}>
                  <div className="chord-name">{degree.chord}</div>
                </ChordTooltip>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Seventh Chords Section */}
      <Card title="Seventh Notes" className="seventh-chords-section">
        <div className="seventh-chords-display">
          {chord_sevenths && chord_sevenths.map((seventhData, index) => (
            <div 
              key={index} 
              className={`seventh-chord-button ${selectedChords.includes(seventhData.seventh) ? 'selected' : ''}`}
              onClick={() => handleSeventhChordClick(seventhData.seventh)}
            >
              <ChordTooltip chord={seventhData.seventh}>
                <span>{seventhData.seventh}</span>
              </ChordTooltip>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export default ScaleInfo