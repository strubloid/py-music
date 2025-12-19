import React from 'react'
import { Play } from 'lucide-react'
import { useChordDisplay } from '../../contexts/ChordDisplayContext'
import PracticeTip from '../common/PracticeTip'
import ChordTooltip from '../common/ChordTooltip'
import ChordDiagram from '../common/ChordDiagram'

const ChordProgressions = ({ progressions, keyName }) => {
  const { showChordDiagrams } = useChordDisplay()
  
  return (
    <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6">
      <h3 className="text-2xl font-semibold mb-6 text-center text-yellow-400">
        🎵 Common Chord Progressions in {keyName}
      </h3>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(progressions).map(([name, chords]) => (
          <div
            key={name}
            className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-blue-300">{name}</h4>
              <Play className="w-4 h-4 text-gray-400 group-hover:text-yellow-400 transition-colors" />
            </div>
            
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {chords.map((chord, index) => (
                  <React.Fragment key={index}>
                    <div className="chord-progression-item">
                      {showChordDiagrams ? (
                        <ChordDiagram chord={chord} size="small" />
                      ) : (
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                          {chord}
                        </div>
                      )}
                    </div>
                    {index < chords.length - 1 && (
                      <span className="text-gray-400 flex items-center">→</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
              
              {/* Roman Numeral Analysis */}
              <div className="text-xs text-gray-400 mt-2">
                {name}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <PracticeTip title="💡 Tip" initialExpanded={true}>
        These progressions are the foundation of countless songs. Try playing them on piano or guitar!
      </PracticeTip>
    </div>
  )
}

export default ChordProgressions