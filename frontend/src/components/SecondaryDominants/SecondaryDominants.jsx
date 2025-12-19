import React from 'react'
import { ArrowRight } from 'lucide-react'
import { useChordPanel } from '../../contexts/ChordPanelContext'
import ChordDiagram from '../common/ChordDiagram'

const SecondaryDominants = ({ chordSevenths, keyName }) => {
  const { showChords } = useChordPanel()
  
  return (
    <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6">
      <h3 className="text-2xl font-semibold mb-6 text-center text-yellow-400">
        🎯 Secondary Dominants in {keyName}
      </h3>
      
      <div className="mb-6 p-4 bg-purple-900/20 rounded-lg">
        <h4 className="font-semibold text-purple-300 mb-2">What are Secondary Dominants?</h4>
        <p className="text-sm text-gray-300">
          Secondary dominants are dominant 7th chords that resolve to chords other than the tonic. 
          They create temporary tonicization and add harmonic interest to progressions.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {chordSevenths.map((item, index) => {
          const romanNumerals = ["I", "ii", "iii", "IV", "V", "vi", "vii°"]
          const functions = ["Tonic", "Supertonic", "Mediant", "Subdominant", "Dominant", "Submediant", "Leading Tone"]
          
          return (
            <div
              key={index}
              className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-gray-400">
                  {romanNumerals[index]} - {functions[index]}
                </div>
                <div className="text-xs text-yellow-400">
                  V{index === 0 ? '7/I' : `7/${romanNumerals[index]}`}
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-3 py-2">
                <div className="secondary-dominant-chord">
                  {showChords ? (
                    <ChordDiagram chord={item.resolves_from} size="small" />
                  ) : (
                    <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-4 py-2 rounded-full font-medium">
                      {item.resolves_from}
                    </div>
                  )}
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
                <div className="target-chord">
                  {showChords ? (
                    <ChordDiagram chord={item.chord} size="small" />
                  ) : (
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full font-medium">
                      {item.chord}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-center text-xs text-gray-400 mt-2">
                Dominant → Target
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-8 grid md:grid-cols-2 gap-6">
        <div className="p-4 bg-green-900/20 rounded-lg">
          <h4 className="font-semibold text-green-300 mb-2">🎵 How to Use</h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Replace any chord with its secondary dominant</li>
            <li>• Creates smooth voice leading</li>
            <li>• Adds tension and resolution</li>
            <li>• Common in jazz and pop music</li>
          </ul>
        </div>

        <div className="p-4 bg-blue-900/20 rounded-lg">
          <h4 className="font-semibold text-blue-300 mb-2">📚 Example</h4>
          <p className="text-sm text-gray-300 mb-2">
            Instead of: {keyName} - Am - {keyName}
          </p>
          <p className="text-sm text-yellow-300">
            Try: {keyName} - E7 - Am - {keyName}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            (E7 is the secondary dominant of Am)
          </p>
        </div>
      </div>
    </div>
  )
}

export default SecondaryDominants