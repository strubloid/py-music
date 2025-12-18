import React, { useState, useEffect } from 'react'
import { useChordPanel } from '../../contexts/ChordPanelContext'
import './MusicProduction.css'

// Cache key for storing lyrics data
const LYRICS_CACHE_KEY = 'music-production-lyrics'

// Note: jsPDF is dynamically imported in the export function to reduce bundle size

const MusicProduction = () => {
  const { progressionLines } = useChordPanel()
  
  // Music lines structure: each line has chords and corresponding text sections
  const [musicLines, setMusicLines] = useState([])

  // Cache functions
  const saveLyricsToCache = (lines) => {
    try {
      const lyricsData = lines.map(line => ({
        id: line.id,
        text: line.text || '',
        chordPositions: line.chordPositions || {}
      }))
      localStorage.setItem(LYRICS_CACHE_KEY, JSON.stringify(lyricsData))
    } catch (error) {
      console.warn('Failed to save lyrics to cache:', error)
    }
  }

  const loadLyricsFromCache = () => {
    try {
      const cached = localStorage.getItem(LYRICS_CACHE_KEY)
      return cached ? JSON.parse(cached) : []
    } catch (error) {
      console.warn('Failed to load lyrics from cache:', error)
      return []
    }
  }

  // Sync with progression lines from Building Progressions
  useEffect(() => {
    if (!progressionLines || progressionLines.length === 0) {
      setMusicLines([])
      return
    }
    
    const cachedLyrics = loadLyricsFromCache()
    
    const syncedLines = progressionLines.map((chordsArray, index) => {
      // progressionLines is an array of arrays, where each inner array contains chord strings
      const chords = chordsArray && chordsArray.length > 0 ? chordsArray : ['C']
      
      // Try to find existing lyrics for this line
      const existingLyrics = cachedLyrics.find(cached => cached.id === index + 1)
      
      return {
        id: index + 1,
        chords: chords,
        text: existingLyrics ? existingLyrics.text : '', // Preserve cached lyrics
        chordPositions: existingLyrics ? existingLyrics.chordPositions : {}
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

  const updateLineText = (lineId, text) => {
    const updatedLines = musicLines.map(line => 
      line.id === lineId ? { ...line, text } : line
    )
    setMusicLines(updatedLines)
    saveLyricsToCache(updatedLines)
  }

  const addChord = (lineId) => {
    setMusicLines(prev => prev.map(line => 
      line.id === lineId 
        ? { ...line, chords: [...line.chords, 'C'] }
        : line
    ))
  }

  const removeChord = (lineId, chordIndex) => {
    setMusicLines(prev => prev.map(line => 
      line.id === lineId 
        ? { 
            ...line, 
            chords: line.chords.filter((_, index) => index !== chordIndex)
          }
        : line
    ))
  }

  const handleChordDragStart = (e, lineId, chordIndex) => {
    e.dataTransfer.setData('text/plain', `${lineId}-${chordIndex}`)
  }

  const handleChordDrag = (e, lineId, chordIndex) => {
    // Update chord position during drag
  }

  const handleChordDragEnd = (e, lineId, chordIndex) => {
    // Finalize chord position
    const rect = e.target.closest('.chord-text-container').getBoundingClientRect()
    const x = e.clientX - rect.left
    updateChordPosition(lineId, chordIndex, x)
  }

  const updateChordPosition = (lineId, chordIndex, x) => {
    // Update the chord position in state and cache
    const updatedLines = musicLines.map(line => {
      if (line.id === lineId) {
        const chordPositions = { ...line.chordPositions }
        chordPositions[chordIndex] = Math.max(0, x - 25)
        return { ...line, chordPositions }
      }
      return line
    })
    setMusicLines(updatedLines)
    saveLyricsToCache(updatedLines)
    
    // Update DOM position
    const chord = document.querySelector(`[data-line-id="${lineId}"] .draggable-chord:nth-child(${chordIndex + 1})`)
    if (chord) {
      chord.style.left = `${Math.max(0, x - 25)}px`
    }
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
      const updatedLines = musicLines.filter(line => line.id !== lineId)
      setMusicLines(updatedLines)
      saveLyricsToCache(updatedLines)
    }
  }

  const exportSong = async () => {
    try {
      // Dynamically import jsPDF
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF()
      
      // PDF settings
      const pageWidth = doc.internal.pageSize.getWidth()
      const margin = 20
      let yPosition = margin + 10
      
      // Title
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text('My Song', margin, yPosition)
      
      yPosition += 10
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPosition)
      
      yPosition += 20
      
      // Process each line with accurate chord positioning
      musicLines.forEach((line, index) => {
        if (line.chords.length > 0 || line.text) {
          if (yPosition > 250) { // New page if needed
            doc.addPage()
            yPosition = margin + 10
          }
          
          // Line number
          doc.setFontSize(12)
          doc.setFont('helvetica', 'bold')
          doc.text(`Line ${index + 1}:`, margin, yPosition)
          yPosition += 15
          
          const text = line.text || ''
          const chords = line.chords || []
          
          if (chords.length > 0) {
            // Calculate accurate chord positions based on text content
            const chordPositions = calculateChordPositions(text, chords, line.chordPositions || {})
            
            // Draw chords
            doc.setFontSize(11)
            doc.setFont('helvetica', 'bold')
            chordPositions.forEach(({ chord, xPos }) => {
              doc.text(chord, margin + xPos, yPosition)
            })
            
            yPosition += 15
          }
          
          // Draw lyrics
          if (text) {
            doc.setFontSize(11)
            doc.setFont('helvetica', 'normal')
            
            // Split long lines if needed
            const textLines = doc.splitTextToSize(text, pageWidth - (margin * 2))
            textLines.forEach(textLine => {
              doc.text(textLine, margin, yPosition)
              yPosition += 12
            })
          }
          
          yPosition += 10 // Space between lines
        }
      })
      
      // Save PDF
      doc.save(`song-${Date.now()}.pdf`)
      console.log('Song exported to PDF successfully!')
      
    } catch (error) {
      console.error('PDF export failed:', error)
      alert('PDF export failed. Make sure you have internet connection for the first time loading the PDF library.')
    }
  }
  
  // Calculate accurate chord positions based on text and pixel positions
  const calculateChordPositions = (text, chords, pixelPositions) => {
    const positions = []
    const avgCharWidth = 5.5 // More accurate character width in PDF units
    
    chords.forEach((chord, index) => {
      let xPos = 0
      
      if (pixelPositions[index] !== undefined) {
        // Get pixel position from drag
        const pixelPos = pixelPositions[index]
        
        // More accurate conversion: assume text area is about 500px wide for full text
        const textAreaWidth = 500
        const textLength = text.length
        const charPositionRatio = pixelPos / textAreaWidth
        const estimatedCharPos = Math.floor(charPositionRatio * textLength)
        
        // Convert to PDF units
        xPos = Math.max(0, Math.min(estimatedCharPos * avgCharWidth, textLength * avgCharWidth))
      } else {
        // Default evenly spaced positioning
        const spacing = Math.max(40, (text.length * avgCharWidth) / (chords.length + 1))
        xPos = spacing * (index + 1)
      }
      
      positions.push({ chord, xPos })
    })
    
    return positions
  }

  return (
    <div className="music-production-panel">
      <div className="panel-header">
        <div className="header-content">
          <h2 className="panel-title">Create your Shit</h2>
          <div className="panel-actions">
            <button onClick={addMusicLine} className="action-button">
              + Add Line
            </button>
            <button onClick={exportSong} className="action-button">
              Export PDF
            </button>
          </div>
        </div>
        <div className="header-divider"></div>
      </div>

      {/* Music Editor */}
      <div className="music-editor">
        <div className="editor-container">
          {musicLines && musicLines.length > 0 ? musicLines.map((line, lineIndex) => (
            <div key={line.id} className="music-line-card">
              <div className="card-glow"></div>
              <div className="line-header">
                <span className="line-number">{lineIndex + 1}</span>
                {musicLines.length > 1 && (
                  <button
                    className="remove-line-btn"
                    onClick={() => removeMusicLine(line.id)}
                  >
                    ×
                  </button>
                )}
              </div>
            
            <div className="chord-text-container" data-line-id={line.id}>
              {/* Draggable Chords Layer */}
              <div className="chords-layer">
                {line.chords.map((chord, chordIndex) => (
                  <div 
                    key={chordIndex} 
                    className="draggable-chord"
                    style={{ 
                      left: `${line.chordPositions && line.chordPositions[chordIndex] !== undefined 
                        ? line.chordPositions[chordIndex] 
                        : (chordIndex * 80) + 10}px` 
                    }}
                    draggable
                    onDragStart={(e) => handleChordDragStart(e, line.id, chordIndex)}
                    onDrag={(e) => handleChordDrag(e, line.id, chordIndex)}
                    onDragEnd={(e) => handleChordDragEnd(e, line.id, chordIndex)}
                  >
                    <input
                      type="text"
                      value={chord}
                      onChange={(e) => updateChord(line.id, chordIndex, e.target.value)}
                      className="chord-input"
                      placeholder="C"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button 
                      className="remove-chord-btn"
                      onClick={() => removeChord(line.id, chordIndex)}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  className="add-chord-btn"
                  onClick={() => addChord(line.id)}
                >
                  +
                </button>
              </div>
              
              {/* Text Input Line */}
              <div className="text-line">
                <textarea
                  value={line.text || ''}
                  onChange={(e) => updateLineText(line.id, e.target.value)}
                  className="line-text-input"
                  placeholder="Write your lyrics here..."
                  rows="2"
                />
              </div>
            </div>

          </div>
        )) : (
          <div className="empty-state">
            <p>Create chord progressions in Building Progressions first</p>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}

export default MusicProduction