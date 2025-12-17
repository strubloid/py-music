import React from 'react'
import Card from '../common/Card'
import './GuitarFretboard.css'

const GuitarFretboard = ({ fretboardData }) => {
  return (
    <Card title="🎸 Guitar Fretboard" size="large" className="fretboard-container">
      
      <div className="fretboard-scroll">
        <div className="fretboard-content">
          {/* Fret number headers */}
          <div className="fret-headers">
            <div className="string-label-header">String</div>
            {Array.from({ length: 13 }, (_, i) => (
              <div key={i} className="fret-number">
                {i}
              </div>
            ))}
          </div>

          {/* Fretboard strings */}
          <div className="strings-container">
            {fretboardData.map((stringData, stringIndex) => (
              <div key={stringIndex} className="guitar-string">
                {/* String name */}
                <div className="string-name">
                  {stringData.string}
                </div>
                
                {/* Frets */}
                <div className="frets-row">
                  {stringData.frets.map((fret, fretIndex) => (
                    <div
                      key={fretIndex}
                      className="fret-cell"
                    >
                      {/* Fret wire (vertical line) */}
                      {fretIndex > 0 && (
                        <div className="fret-wire"></div>
                      )}
                      
                      {/* String (horizontal line) */}
                      <div className="guitar-string-line"></div>
                      
                      {/* Note dot */}
                      {fret.is_scale_note && (
                        <div
                          className={`note-dot ${
                            fret.is_root ? 'root-note' : 'scale-note'
                          }`}
                          title={`${fret.note} - Fret ${fret.fret}`}
                        >
                          {fret.note}
                        </div>
                      )}
                      
                      {/* Fret markers for common positions */}
                      {([3, 5, 7, 9, 12].includes(fretIndex) && !fret.is_scale_note) && (
                        <div className="fret-marker"></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Fret position markers */}
          <div className="fret-position-markers">
            <div className="fret-position-spacer"></div>
            {Array.from({ length: 13 }, (_, i) => (
              <div key={i} className="fret-position-cell">
                {[3, 5, 7, 9].includes(i) && (
                  <div className="position-marker">•</div>
                )}
                {i === 12 && (
                  <div className="position-marker double">•</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="fretboard-legend">
        <div className="legend-item">
          <div className="legend-dot root"></div>
          <span>Root Note</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot scale"></div>
          <span>Scale Notes</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot marker"></div>
          <span>Fret Markers</span>
        </div>
      </div>

      <div className="practice-tip">
        <h4 className="practice-tip-title">🎯 Practice Tip</h4>
        <p className="practice-tip-text">
          Practice playing the scale pattern across all strings. Notice how the same notes appear in different positions!
        </p>
      </div>
    </Card>
  )
}

export default GuitarFretboard