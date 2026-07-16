import React from 'react'
import { Play } from 'lucide-react'
import { useChordPanel } from '../../contexts/ChordPanelContext'
import PracticeTip from '../common/PracticeTip'
import ChordTooltip from '../common/ChordTooltip'
import ChordDiagram from '../common/ChordDiagram'
import './ChordProgressions.scss'

const ChordProgressions = ({ progressions, keyName }) => {
  const { showChords } = useChordPanel()

  return (
    <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6">
      <h3 className="progressions-title">Common Chord Progressions in {keyName}</h3>

      <div className="progressions-grid">
        {Object.entries(progressions as Record<string, string[]>).map(([name, chords]) => (
          <div key={name} className="progression-card">
            <div className="progression-header">
              <h4 className="progression-name">{name}</h4>
              <Play className="play-icon" />
            </div>

            <div className="progression-content">
              <div className="chords-sequence">
                {chords.map((chord, index) => (
                  <React.Fragment key={index}>
                    <div className="chord-progression-item">
                      {showChords ? (
                        <ChordDiagram chord={chord} size="small" />
                      ) : (
                        <span className="chord-badge">{chord}</span>
                      )}
                    </div>
                    {index < chords.length - 1 && <span className="chord-arrow">→</span>}
                  </React.Fragment>
                ))}
              </div>

              <div className="progression-analysis">{name}</div>
            </div>
          </div>
        ))}
      </div>

      <PracticeTip title="Tip" initialExpanded={true}>
        These progressions are the foundation of countless songs. Try playing them on piano or guitar!
      </PracticeTip>
    </div>
  )
}

export default ChordProgressions
