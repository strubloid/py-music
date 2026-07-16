import React from 'react'
import { ArrowRight } from 'lucide-react'
import { useChordPanel } from '../../contexts/ChordPanelContext'
import ChordDiagram from '../common/ChordDiagram'
import './SecondaryDominants.scss'

const SecondaryDominants = ({ chordSevenths, keyName }) => {
  const { showChords } = useChordPanel()

  return (
    <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6">
      <h3 className="sd-section-title">Secondary Dominants in {keyName}</h3>

      <div className="sd-info-box">
        <h4 className="sd-info-title">What are Secondary Dominants?</h4>
        <p className="sd-info-text">
          Secondary dominants are dominant 7th chords that resolve to chords other than the tonic. They create temporary
          tonicization and add harmonic interest to progressions.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {chordSevenths.map((item, index) => {
          const romanNumerals = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°']
          const functions = ['Tonic', 'Supertonic', 'Mediant', 'Subdominant', 'Dominant', 'Submediant', 'Leading Tone']

          return (
            <div key={index} className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="sd-function-label">
                  {romanNumerals[index]} - {functions[index]}
                </div>
                <div className="sd-notation">V{index === 0 ? '7/I' : `7/${romanNumerals[index]}`}</div>
              </div>

              <div className="flex items-center justify-center gap-3 py-2">
                <div className="secondary-dominant-chord">
                  {showChords ? (
                    <ChordDiagram chord={item.resolves_from} size="small" />
                  ) : (
                    <div className="sd-chord-badge">{item.resolves_from}</div>
                  )}
                </div>
                <ArrowRight className="sd-arrow-icon" />
                <div className="target-chord">
                  {showChords ? (
                    <ChordDiagram chord={item.chord} size="small" />
                  ) : (
                    <div className="sd-chord-target">{item.chord}</div>
                  )}
                </div>
              </div>

              <div className="sd-analysis-text">Dominant → Target</div>
            </div>
          )
        })}
      </div>

      <div className="mt-8 grid md:grid-cols-2 gap-6">
        <div className="sd-use-box">
          <h4 className="sd-use-title">How to Use</h4>
          <ul className="sd-use-list">
            <li>• Replace any chord with its secondary dominant</li>
            <li>• Creates smooth voice leading</li>
            <li>• Adds tension and resolution</li>
            <li>• Common in jazz and pop music</li>
          </ul>
        </div>

        <div className="sd-example-box">
          <h4 className="sd-example-title">Example</h4>
          <p className="sd-example-text">
            Instead of: {keyName} - Am - {keyName}
          </p>
          <p className="sd-example-highlight">
            Try: {keyName} - E7 - Am - {keyName}
          </p>
          <p className="sd-example-note">(E7 is the secondary dominant of Am)</p>
        </div>
      </div>
    </div>
  )
}

export default SecondaryDominants
