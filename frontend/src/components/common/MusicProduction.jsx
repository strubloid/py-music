import React, { useState, useEffect } from 'react'
import { useChordPanel } from '../../contexts/ChordPanelContext'
import './MusicProduction.css'

const MusicProduction = () => {
  const { progressionLines } = useChordPanel()
  
  // Music lines structure: each line has chords and corresponding text sections
  const [musicLines, setMusicLines] = useState([])

  // Sync with progression lines from Building Progressions
  useEffect(() => {
    if (!progressionLines || progressionLines.length === 0) {
      setMusicLines([])
      return
    }
    
    const syncedLines = progressionLines.map((chordsArray, index) => {
      // progressionLines is an array of arrays, where each inner array contains chord strings
      const chords = chordsArray && chordsArray.length > 0 ? chordsArray : ['C']
      return {
        id: index + 1,
        chords: chords,
        textSections: chords.map(() => '')
      }
    })
    setMusicLines(syncedLines)
  }, [progressionLines])

  const addMusicLine = () => {
    // Add a new empty line that will be managed by Building Progressions
    const newLine = {
      id: musicLines.length + 1,
      chords: ['C'], // Default single chord
      textSections: ['']
    }
    setMusicLines(prev => [...prev, newLine])
  }

  const addTextSection = (lineId) => {
    setMusicLines(prev => prev.map(line => 
      line.id === lineId 
        ? {
            ...line,
            chords: [...line.chords, 'C'], // Add default chord
            textSections: [...line.textSections, ''] // Add empty text section
          }
        : line
    ))
  }

  const updateTextSection = (lineId, sectionIndex, text) => {
    setMusicLines(prev => prev.map(line => 
      line.id === lineId 
        ? {
            ...line,
            textSections: line.textSections.map((section, index) => 
              index === sectionIndex ? text : section
            )
          }
        : line
    ))
  }

  const updateChord = (lineId, chordIndex, chord) => {
    // Note: Chord updates should ideally be managed through Building Progressions
    // This is for temporary local editing only
    setMusicLines(prev => prev.map(line => 
      line.id === lineId 
        ? {
            ...line,
            chords: line.chords.map((c, index) => 
              index === chordIndex ? chord : c
            )
          }
        : line
    ))
  }

  const removeTextSection = (lineId, sectionIndex) => {
    setMusicLines(prev => prev.map(line => 
      line.id === lineId && line.textSections.length > 1
        ? {
            ...line,
            chords: line.chords.filter((_, index) => index !== sectionIndex),
            textSections: line.textSections.filter((_, index) => index !== sectionIndex)
          }
        : line
    ))
  }

  const removeMusicLine = (lineId) => {
    if (musicLines.length > 1) {
      setMusicLines(prev => prev.filter(line => line.id !== lineId))
    }
  }

  return (
    <div className="music-production-panel">
      <div className="panel-header">
        <h3 className="panel-title">Music Production</h3>
        <div className="panel-actions">
          <button 
            className="add-line-button"
            onClick={addMusicLine}
          >
            ➕ Add Line
          </button>
          <button className="export-song-button">
            💾 Export Song
          </button>
        </div>
      </div>

      {/* Music Editor */}
      <div className="music-editor">
        {musicLines && musicLines.length > 0 ? musicLines.map((line, lineIndex) => (
          <div key={line.id} className="music-line">
            <div className="line-header">
              <span className="line-number">Line {lineIndex + 1}</span>
              {musicLines.length > 1 && (
                <button
                  className="remove-line-btn"
                  onClick={() => removeMusicLine(line.id)}
                  title="Remove this line"
                >
                  ×
                </button>
              )}
            </div>
            
            {/* Chords Row */}
            <div className="chords-row">
              {line.chords.map((chord, chordIndex) => (
                <div key={chordIndex} className="chord-section">
                  <input
                    type="text"
                    value={chord}
                    onChange={(e) => updateChord(line.id, chordIndex, e.target.value)}
                    className="chord-input"
                    placeholder="Chord"
                  />
                </div>
              ))}
              <button
                className="add-section-btn"
                onClick={() => addTextSection(line.id)}
                title="Add text section"
              >
                +
              </button>
            </div>
            
            {/* Text/Lyrics Row */}
            <div className="text-row">
              {line.textSections.map((text, textIndex) => (
                <div key={textIndex} className="text-section">
                  <textarea
                    value={text}
                    onChange={(e) => updateTextSection(line.id, textIndex, e.target.value)}
                    className="text-input"
                    placeholder="Lyrics..."
                    rows="2"
                  />
                  {line.textSections.length > 1 && (
                    <button
                      className="remove-section-btn"
                      onClick={() => removeTextSection(line.id, textIndex)}
                      title="Remove section"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )) : (
          <div className="empty-state">
            <p>No progression lines available. Create some progressions in the Building Progressions tab first!</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default MusicProduction