import React from 'react'
import Card from '../common/Card'
import './ScaleInfo.css'

const ScaleInfo = ({ scaleData }) => {
  const { scale_name, notes, scale_degrees } = scaleData

  return (
    <div className="scale-info-container">
      <h2 className="scale-title">
        {scale_name}
      </h2>
      
      <div className="scale-content">
        {/* Scale Notes */}
        <Card title="Scale Notes" className="scale-section">
          <div className="notes-container">
            {notes.map((note, index) => (
              <div
                key={index}
                className={`note-badge ${index === 0 ? 'root-note' : 'regular-note'}`}
              >
                {note}
              </div>
            ))}
          </div>
        </Card>
      </div>
      <div className="scale-content">

        {/* Scale Degrees Table */}
        <Card title="Scale Degrees" className="scale-section">
          <ul className="degrees-list">
            {scale_degrees.map((degree, index) => (
              <li key={index} className="degree-item">
                <div className="degree-left">
                  <span className="degree-number">{degree.roman}</span>
                  <span className="degree-note">{degree.note}</span>
                </div>
                <div className="degree-right">
                  <span className="degree-chord">{degree.chord}</span>
                  <span className="degree-function">{degree.function}</span>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}

export default ScaleInfo