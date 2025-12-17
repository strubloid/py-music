import React from 'react'
import Card from '../common/Card'
import PracticeTip from '../common/PracticeTip'
import ChordTooltip from '../common/ChordTooltip'
import './PianoKeyboard.css'

const PianoKeyboard = ({ keyboardData }) => {
  const { white_keys, black_keys, scale_notes, root_note } = keyboardData

  const getKeyClasses = (note, isBlack = false) => {
    const isScaleNote = scale_notes.includes(note)
    const isRoot = note === root_note
    
    let classes = [isBlack ? 'black-key' : 'white-key']
    
    if (isRoot) {
      classes.push('root-note')
    } else if (isScaleNote) {
      classes.push('scale-note')
    }
    
    return classes.join(' ')
  }

  return (
    <Card title="🎹 Piano Keyboard" size="large">
      <div className="piano-container">
        <div className="piano-keyboard">
          {/* Black keys row */}
          <div className="black-keys-row">
            {black_keys.map((key, index) => (
              <div key={index} className="black-key-container">
                {key && (
                  <ChordTooltip chord={key}>
                    <div className={getKeyClasses(key, true)}>
                      {key}
                    </div>
                  </ChordTooltip>
                )}
              </div>
            ))}
          </div>

          {/* White keys row */}
          <div className="white-keys-row">
            {white_keys.map((key) => (
              <ChordTooltip key={key} chord={key}>
                <div
                  className={getKeyClasses(key, false)}
                >
                  {key}
                </div>
              </ChordTooltip>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="piano-legend">
        <div className="legend-item">
          <div className="legend-key root"></div>
          <span>Root Note ({root_note})</span>
        </div>
        <div className="legend-item">
          <div className="legend-key scale"></div>
          <span>Scale Notes</span>
        </div>
        <div className="legend-item">
          <div className="legend-key white"></div>
          <span>Other Notes</span>
        </div>
      </div>

      <PracticeTip>
        Practice playing the scale from the root note. Notice how the pattern repeats in higher octaves!
      </PracticeTip>
    </Card>
  )
}

export default PianoKeyboard