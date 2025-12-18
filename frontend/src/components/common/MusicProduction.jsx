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
  const [dragState, setDragState] = useState(null)

  // Refs to avoid stale closures
  const dragStateRef = React.useRef(null)
  const musicLinesRef = React.useRef(musicLines)
  
  // Keep refs updated
  useEffect(() => {
    dragStateRef.current = dragState
  }, [dragState])
  
  useEffect(() => {
    musicLinesRef.current = musicLines
  }, [musicLines])

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

  const updateChordPosition = (lineId, chordIndex, x) => {
    console.log('💾 updateChordPosition called:', { lineId, chordIndex, x })
    // Update the chord position in state and cache
    const updatedLines = musicLines.map(line => {
      if (line.id === lineId) {
        const chordPositions = { ...line.chordPositions }
        chordPositions[chordIndex] = x // Store exact position
        console.log('💾 Updated chord positions for line:', line.id, chordPositions)
        return { ...line, chordPositions }
      }
      return line
    })
    setMusicLines(updatedLines)
    saveLyricsToCache(updatedLines)
    console.log('✅ Position saved and cached')
  }

  const handleMouseMove = (e) => {
    const currentDragState = dragStateRef.current
    console.log('🖱️ Mouse move:', { mouseX: e.clientX, hasDragState: !!currentDragState })
    
    if (!currentDragState || !currentDragState.isDragging) {
      console.log('❌ No drag state or not dragging')
      return
    }
    
    e.preventDefault()
    e.stopPropagation()
    
    // Use stored container reference
    const container = currentDragState.container
    if (!container) {
      console.log('❌ No container in drag state')
      return
    }
    
    const rect = container.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width - 60))
    console.log('🎯 Calculated position:', { x, containerWidth: rect.width, mouseRelative: e.clientX - rect.left })
    
    // Update position immediately using the stored element reference
    if (currentDragState.element) {
      currentDragState.element.style.left = `${x}px`
      currentDragState.element.style.transform = 'translateY(-1px) scale(1.05)'
      currentDragState.element.style.zIndex = '1000'
      console.log('✅ Element position updated to:', x)
    } else {
      console.log('❌ No element reference in drag state')
    }
  }

  const handleMouseUp = (e) => {
    const currentDragState = dragStateRef.current
    console.log('🔚 Drag ended:', { mouseX: e.clientX, hasDragState: !!currentDragState })
    
    if (!currentDragState || !currentDragState.isDragging) {
      console.log('❌ No drag state on mouse up')
      return
    }
    
    e.preventDefault()
    e.stopPropagation()
    
    // Use stored container reference
    const container = currentDragState.container
    if (container) {
      const rect = container.getBoundingClientRect()
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width - 60))
      console.log('💾 Saving final position:', x)
      updateChordPosition(currentDragState.lineId, currentDragState.chordIndex, x)
    } else {
      console.log('❌ No container in drag state on mouse up')
    }
    
    // Reset visual feedback using the stored element reference
    if (currentDragState.element) {
      currentDragState.element.style.cursor = 'grab'
      currentDragState.element.style.transform = ''
      currentDragState.element.style.zIndex = ''
      console.log('✅ Visual feedback reset')
    }
    
    setDragState(null)
    dragStateRef.current = null
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    console.log('🧹 Drag cleanup completed')
  }

  const handleChordMouseDown = (e, lineId, chordIndex) => {
    console.log('🎵 Drag started:', { lineId, chordIndex, target: e.target })
    e.preventDefault()
    e.stopPropagation()
    
    const container = e.target.closest('.chord-text-container')
    if (!container) {
      console.log('❌ Container not found')
      return
    }
    
    console.log('✅ Container found:', container)
    const rect = container.getBoundingClientRect()
    const startX = e.clientX - rect.left
    
    const newDragState = {
      lineId,
      chordIndex,
      startX,
      isDragging: true,
      element: e.target, // Store reference to the dragged element
      container: container // Store container reference
    }
    
    console.log('🎵 New drag state:', newDragState)
    setDragState(newDragState)
    dragStateRef.current = newDragState // Update ref immediately
    
    // Add visual feedback immediately
    e.target.style.cursor = 'grabbing'
    e.target.style.transform = 'translateY(-1px) scale(1.05)'
    e.target.style.zIndex = '1000'
    
    // Add event listeners for mouse move and up
    document.addEventListener('mousemove', handleMouseMove, { passive: false })
    document.addEventListener('mouseup', handleMouseUp, { passive: false })
    console.log('🎵 Event listeners added')
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
    const avgCharWidth = 5.8 // PDF character width
    const textAreaWidth = 400 // Approximate text area width in the interface
    
    chords.forEach((chord, index) => {
      let xPos = 0
      
      if (pixelPositions[index] !== undefined && text.length > 0) {
        // Convert pixel position to character position
        const pixelPos = pixelPositions[index]
        
        // Calculate percentage of text area width
        const positionRatio = pixelPos / textAreaWidth
        
        // Map to character position in text
        const charPosition = Math.floor(positionRatio * text.length)
        
        // Convert to PDF units, ensuring we don't go beyond text
        xPos = Math.max(0, Math.min(charPosition * avgCharWidth, (text.length - 1) * avgCharWidth))
      } else {
        // Default positioning - spread evenly across the text
        if (text.length > 0) {
          const textWidth = text.length * avgCharWidth
          const spacing = textWidth / (chords.length + 1)
          xPos = spacing * (index + 1) - (chord.length * avgCharWidth / 2)
        } else {
          xPos = index * 40 // Fallback spacing
        }
      }
      
      positions.push({ chord, xPos: Math.max(0, xPos) })
    })
    
    return positions
  }

  return (
    <div className="music-production-panel">
      <div className="panel-header">
        <div className="header-content">
          <h2 className="panel-title">Create your Shit</h2>
          <div className="panel-actions">
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
                    onMouseDown={(e) => handleChordMouseDown(e, line.id, chordIndex)}
                  >
                    {chord}
                  </div>
                ))}
              </div>
              
              {/* Lyrics Input Line */}
              <div className="lyrics-line">
                <input
                  type="text"
                  value={line.text || ''}
                  onChange={(e) => updateLineText(line.id, e.target.value)}
                  className="lyrics-input"
                  placeholder="Write your lyrics here..."
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