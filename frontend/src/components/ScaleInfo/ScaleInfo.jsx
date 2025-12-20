import React from 'react'
import { useChordPanel } from '../../contexts/ChordPanelContext'
import Card from '../common/Card'
import ChordDiagram from '../common/ChordDiagram'
import './ScaleInfo.css'

const ScaleInfo = ({ scaleData }) => {
  const { scale_name, notes, scale_degrees, chords } = scaleData
  const { showChords } = useChordPanel()

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
                {showChords ? (
                  <ChordDiagram chord={degree.chord} size="medium" />
                ) : (
                  <div className="chord-name">{degree.chord}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>


    </div>
  )
}

export default ScaleInfo