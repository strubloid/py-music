import React from 'react'
import { useChordDisplay } from '../contexts/ChordDisplayContext'
import ChordDiagram from './common/ChordDiagram'

const ScaleInfo = ({ scaleData }) => {
  const { scale_name, notes, scale_degrees } = scaleData
  const { showChordDiagrams } = useChordDisplay()

  return (
    <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 mb-8">
      <h2 className="text-3xl font-bold text-center mb-4 text-yellow-400">
        {scale_name}
      </h2>
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* Scale Notes */}
        <div>
          <h3 className="text-xl font-semibold mb-4 text-blue-300">Scale Notes</h3>
          <div className="flex flex-wrap gap-2">
            {notes.map((note, index) => (
              <div
                key={index}
                className={`
                  px-4 py-2 rounded-full font-medium
                  ${index === 0 
                    ? 'bg-red-500 text-white' 
                    : 'bg-blue-500 text-white'
                  }
                `}
              >
                {note}
              </div>
            ))}
          </div>
        </div>

        {/* Scale Degrees Table */}
        <div>
          <h3 className="text-xl font-semibold mb-4 text-blue-300">Scale Degrees</h3>
          <div className="space-y-2">
            {scale_degrees.map((degree, index) => (
              <div
                key={index}
                className="flex justify-between items-center bg-white/5 rounded-lg p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-yellow-400 font-bold w-8">{degree.roman}</span>
                  <span className="font-medium w-8">{degree.note}</span>
                </div>
                <div className="flex items-center gap-3">
                  {showChordDiagrams ? (
                    <ChordDiagram chord={degree.chord} size="small" />
                  ) : (
                    <span className="text-green-400 chord-text-display">{degree.chord}</span>
                  )}
                  <span className="text-gray-400 text-sm">{degree.function}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ScaleInfo