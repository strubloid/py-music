import React, { useState } from 'react'
import { useChordPanel } from '../../contexts/ChordPanelContext'
import ChordTooltip from './ChordTooltip'
import ChordDiagram from './ChordDiagram'
import InlineChordDisplay from './InlineChordDisplay'
import './ProgressionBuilder.css'

const ProgressionBuilder = ({ scaleData, saveName = '' }) => {
  const { 
    progressionLines, 
    currentLine, 
    addChordToProgression, 
    removeChordFromProgression, 
    addProgressionLine, 
    removeProgressionLine, 
    clearProgression, 
    setCurrentProgressionLine,
    showChords,
    lyrics,
    chordOverLyrics,
  } = useChordPanel()
  


  const addChord = (chord) => {
    addChordToProgression(chord)
  }

  const removeChord = (lineIndex, chordIndex) => {
    removeChordFromProgression(lineIndex, chordIndex)
  }

  const addNewLine = () => {
    addProgressionLine()
  }

  const removeLine = (lineIndex) => {
    removeProgressionLine(lineIndex)
  }

  const clearAll = () => {
    clearProgression()
  }

  // Get words from lyric text, handling quoted phrases
  const getWords = (text) => {
    if (!text) return []
    const regex = /"([^"]+)"|\S+/g
    const words = []
    let match
    while ((match = regex.exec(text)) !== null) {
      words.push(match[1] || match[0])
    }
    return words
  }

  const exportToPDF = () => {
    // ─── Generate Music Sheet HTML ────────────────────────────────────────
    const linesHTML = progressionLines.map((line, lineIndex) => {
      const lyricText = lyrics[lineIndex] || ''
      const words = getWords(lyricText)
      const lineChords = chordOverLyrics[lineIndex] || []
      
      // Build chord map
      const chordMap = {}
      lineChords.forEach(({ wordIndex, chord }) => {
        chordMap[wordIndex] = chord
      })
      
      // Chord row HTML
      const chordRow = words.map((word, wordIndex) => {
        const chord = chordMap[wordIndex]
        if (chord) {
          return `<span class="chord"><span class="chord-name">${chord}</span></span>`
        }
        return '<span class="chord-spacer"></span>'
      }).join('')
      
      // Lyric row HTML
      const lyricRow = words.map(word => {
        // Handle quoted phrases - show them together with chord above opening quote
        return `<span class="lyric-word">${word}</span>`
      }).join(' ')
      
      if (!lyricText.trim()) {
        return `<div class="line line-empty">
          <div class="chord-row"><span class="line-label">Line ${lineIndex + 1}</span></div>
          <div class="lyric-row"><span class="empty-hint">No lyrics</span></div>
        </div>`
      }
      
      return `<div class="line">
        <div class="chord-row">${chordRow}</div>
        <div class="lyric-row">${lyricRow}</div>
      </div>`
    }).join('')

    const hasLyrics = Object.values(lyrics).some(t => t.trim())
    const title = saveName || 'Chord Progression'

    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: 'Inter', Arial, sans-serif;
      background: #fff;
      color: #1a1a2e;
      padding: 40px 48px;
      max-width: 800px;
      margin: 0 auto;
      line-height: 1.5;
    }
    
    .header {
      border-bottom: 2px solid #1a1a2e;
      padding-bottom: 16px;
      margin-bottom: 32px;
    }
    
    .header h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1a1a2e;
    }
    
    .header .meta {
      font-size: 0.875rem;
      color: #666;
      margin-top: 4px;
    }
    
    .sheet {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    
    .line {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 12px 16px;
      background: #f8f8fa;
      border-radius: 8px;
      border-left: 4px solid #fbbf24;
    }
    
    .line-empty {
      background: #f0f0f0;
      border-left-color: #ccc;
      opacity: 0.7;
    }
    
    .chord-row {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      min-height: 36px;
      gap: 0;
      padding-bottom: 4px;
      border-bottom: 2px solid #e5e5e5;
    }
    
    .chord {
      display: inline-flex;
      align-items: flex-end;
      justify-content: center;
      min-width: 36px;
      padding: 0 4px;
    }
    
    .chord-name {
      background: #fef3c7;
      border: 1.5px solid #f59e0b;
      border-radius: 6px;
      padding: 3px 8px;
      font-size: 0.9375rem;
      font-weight: 700;
      color: #92400e;
      line-height: 1;
    }
    
    .chord-spacer {
      display: inline-block;
      min-width: 36px;
    }
    
    .lyric-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      font-size: 1.0625rem;
      color: #333;
      line-height: 1.7;
      padding-top: 6px;
    }
    
    .lyric-word {
      /* Words flow naturally */
    }
    
    .line-label {
      font-size: 0.75rem;
      color: #888;
      font-weight: 500;
    }
    
    .empty-hint {
      font-size: 0.875rem;
      color: #aaa;
      font-style: italic;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px solid #eee;
      font-size: 0.75rem;
      color: #999;
      display: flex;
      justify-content: space-between;
    }
    
    /* Print styles */
    @media print {
      body { padding: 20px; }
      .line { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${title}</h1>
    <div class="meta">Key: ${selectedKey} ${selectedInterval}</div>
  </div>
  
  <div class="sheet">
    ${linesHTML || '<div class="line line-empty"><div class="chord-row"></div><div class="lyric-row"><span class="empty-hint">No progression</span></div></div>'}
  </div>
  
  <div class="footer">
    <span>Generated by Strubloid Music Theory</span>
    <span>${new Date().toLocaleDateString()}</span>
  </div>
</body>
</html>
`)
    printWindow.document.close()
    
    // Give fonts time to load, then print
    setTimeout(() => {
      printWindow.focus()
      printWindow.print()
    }, 500)
  }

  return (
    <div className="progression-builder-panel">
      <div className="panel-header">
        <h3 className="panel-title">Building Progressions</h3>
        <div className="panel-actions">
          <button className="export-button" onClick={exportToPDF}>
            📄 Export PDF
          </button>
          <button className="clear-button" onClick={clearAll}>
            Clear All
          </button>
        </div>
      </div>

      {/* Scale Chords and Seventh Notes */}
      <div className="chord-selection-grid">
        <div className="scale-chords-section">
          <h4 className="section-title">Scale Chords:</h4>
          <div className="compact-chords-grid">
            {scaleData?.scale_degrees?.map((degree, index) => (
              <button
                key={index}
                className="compact-chord-button"
                onClick={() => addChord(degree.chord)}
                title={`${degree.roman} - ${degree.chord}`}
              >
                {showChords ? (
                  <ChordDiagram chord={degree.chord} size="small" />
                ) : (
                  <span className="chord-text-display">{degree.chord}</span>
                )}
              </button>
            ))}
          </div>
        </div>
        
        <div className="seventh-notes-section">
          <h4 className="section-title">Seventh Notes:</h4>
          <div className="compact-chords-grid">
            {scaleData?.chord_sevenths?.map((seventhData, index) => (
              <button
                key={index}
                className="compact-seventh-button"
                onClick={() => addChord(seventhData.seventh)}
                title={`Resolves to ${seventhData.resolves_to}`}
              >
                {showChords ? (
                  <ChordDiagram chord={seventhData.seventh} size="small" />
                ) : (
                  <span className="chord-text-display">{seventhData.seventh}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>


      <div className="progression-section">
        <div className="progression-header">
          <h4 className="section-title">Progression:</h4>
          <button className="add-line-button" onClick={addNewLine}>
            ➕ New Line
          </button>
        </div>

        <div className="progression-lines">
          {progressionLines.map((line, lineIndex) => (
            <div
              key={lineIndex}
              className={`progression-line ${currentLine === lineIndex ? 'active' : ''}`}
            >
              <div className="line-header">
                <button
                  className="line-select-button"
                  onClick={() => setCurrentProgressionLine(lineIndex)}
                  title="Select this line for adding chords"
                >
                  {currentLine === lineIndex ? '✓' : '○'}
                </button>
                {progressionLines.length > 1 && (
                  <button
                    className="remove-line-button"
                    onClick={() => removeLine(lineIndex)}
                    title="Remove this line"
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="line-chords">
                {line.length === 0 ? (
                  <div className="empty-line">
                    {currentLine === lineIndex ? 'Add chords here...' : '(empty)'}
                  </div>
                ) : (
                  line.map((chord, chordIndex) => (
                    <div key={chordIndex} className="progression-chord-item">
                      <div className="chord-with-diagram">
                        {showChords ? (
                          <ChordDiagram chord={chord} size="medium" />
                        ) : (
                          <div className="chord-text-large">{chord}</div>
                        )}
                        <button
                          className="remove-chord-button"
                          onClick={() => removeChord(lineIndex, chordIndex)}
                          title="Remove chord"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="progression-info">
        <span className="progression-stats">
          {(() => {
            const totalChords = progressionLines.reduce((total, line) => total + line.length, 0);
            return `${progressionLines.length} line${progressionLines.length !== 1 ? 's' : ''}, ${totalChords} chord${totalChords !== 1 ? 's' : ''} total`;
          })()}
        </span>
      </div>
    </div>
  )
}

export default ProgressionBuilder