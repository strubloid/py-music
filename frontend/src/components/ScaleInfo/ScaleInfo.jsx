import React from 'react'
import Card from '../common/Card'
import ChordTooltip from '../common/ChordTooltip'
import './ScaleInfo.css'

const ScaleInfo = ({ scaleData }) => {
  const { scale_name, notes, scale_degrees, chords } = scaleData

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


    </div>
  )
}

export default ScaleInfo