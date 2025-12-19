import React, { useState, useEffect, useRef } from 'react'
import { useChordPanel } from '../../contexts/ChordPanelContext'
import { useChordDisplay } from '../../contexts/ChordDisplayContext'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import PDFExportService from '../../services/PDFExportService.tsx'
import ChordDiagram from './ChordDiagram'
import './MusicProduction.css'

// Cache key for storing lyrics data
const LYRICS_CACHE_KEY = 'music-production-lyrics'

const MusicProduction = () => {
  const { progressionLines } = useChordPanel()
  const { showChordDiagrams, toggleChordDiagrams } = useChordDisplay()
  
  // Music lines structure: each line has chords and corresponding text sections
  const [musicLines, setMusicLines] = useState([])
  const [dragState, setDragState] = useState(null)
  const [isExporting, setIsExporting] = useState(false)
  const printContainerRef = useRef(null)

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
    
    // Get container for bounds checking
    const container = document.querySelector(`[data-line-id="${lineId}"] .chord-text-container`)
    
    if (container) {
      // Ensure position is within container bounds
      const containerWidth = container.offsetWidth;
      const chordWidth = showChordDiagrams ? 90 : 50; // Adjust based on display mode
      const boundedX = Math.max(0, Math.min(x, containerWidth - chordWidth));
      
      console.log('🔍 Position info:', {
        originalX: x,
        boundedX: boundedX,
        containerWidth: containerWidth,
        chordWidth: chordWidth
      })
      
      // Update the chord position in state and cache
      const updatedLines = musicLines.map(line => {
        if (line.id === lineId) {
          const chordPositions = { ...line.chordPositions }
          chordPositions[chordIndex] = boundedX // Store bounded position
          console.log('💾 Updated chord positions for line:', line.id, chordPositions)
          return { ...line, chordPositions }
        }
        return line
      })
      setMusicLines(updatedLines)
      saveLyricsToCache(updatedLines)
      console.log('✅ Position saved and cached')
    } else {
      console.warn('❌ Container not found for position update')
    }
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
    const chordWidth = showChordDiagrams ? 90 : 50; // Match the display mode
    const maxX = rect.width - chordWidth;
    const x = Math.max(0, Math.min(e.clientX - rect.left, maxX))
    console.log('🎯 Calculated position:', { x, containerWidth: rect.width, maxX, mouseRelative: e.clientX - rect.left })
    
    // Update position immediately using the stored element reference
    if (currentDragState.element) {
      currentDragState.element.style.left = `${x}px`
      currentDragState.element.style.transform = 'translateY(-2px) scale(1.1)'
      currentDragState.element.style.zIndex = '1000'
      currentDragState.element.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)'
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
      const chordWidth = showChordDiagrams ? 90 : 50;
      const maxX = rect.width - chordWidth;
      const x = Math.max(0, Math.min(e.clientX - rect.left, maxX))
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
      currentDragState.element.style.boxShadow = ''
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
    
    // Find the draggable element (parent of the clicked element)
    const draggableElement = e.target.closest('.draggable-chord-diagram, .draggable-chord-text')
    if (!draggableElement) {
      console.log('❌ Draggable element not found')
      return
    }
    
    console.log('✅ Container found:', container)
    console.log('✅ Draggable element found:', draggableElement)
    const rect = container.getBoundingClientRect()
    const startX = e.clientX - rect.left
    
    const newDragState = {
      lineId,
      chordIndex,
      startX,
      isDragging: true,
      element: draggableElement, // Use the draggable container, not the inner element
      container: container // Store container reference
    }
    
    console.log('🎵 New drag state:', newDragState)
    setDragState(newDragState)
    dragStateRef.current = newDragState // Update ref immediately
    
    // Add visual feedback immediately
    draggableElement.style.cursor = 'grabbing'
    draggableElement.style.transform = 'translateY(-1px) scale(1.05)'
    draggableElement.style.zIndex = '1000'
    
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

  const handleExport = async (type) => {
    setIsExporting(true)
    
    try {
      switch (type) {
        case 'pdf-hq':
          await PDFExportService.exportAsHighQualityPDF(musicLines, {
            title: 'My Song',
            fontSize: 14,
            chordFontSize: 14,
            lineSpacing: 25,
            showChords: true,
            showLyrics: true
          })
          break
          
        case 'print':
          PDFExportService.exportViaPrint(musicLines, { title: 'My Song' })
          break
          
        case 'text':
          PDFExportService.exportAsText(musicLines, 'My Song')
          break
          
        default:
          // Fallback to high-quality PDF
          await PDFExportService.exportAsHighQualityPDF(musicLines)
      }
      
      console.log(`✅ Export completed: ${type}`)
      
    } catch (error) {
      console.error('❌ Export failed:', error)
      alert(`Export failed: ${error.message}`)
    } finally {
      setIsExporting(false)
    }
  }
  
  // Calculate accurate chord positions based on interface pixel positions
  const calculateChordPositions = (text, chords, pixelPositions, lineIndex) => {
    const positions = []
    
    chords.forEach((chord, index) => {
      let xPos = 0
      
      if (pixelPositions[index] !== undefined) {
        // Use exact pixel position from interface
        const pixelPos = pixelPositions[index]
        
        const PDF_TEXT_WIDTH = 140 // Available width for text in PDF (mm)
        
        // PROPORTIONAL POSITIONING: Direct mathematical relationship
        // Get the actual interface container width dynamically
        let interfaceWidth = 1497 // Default from your logs
        
        // Try to get real interface width if available
        const currentContainer = document.querySelector('.chord-text-container')
        if (currentContainer) {
          interfaceWidth = currentContainer.offsetWidth
        }
        
        // Calculate position as percentage of interface width
        const positionPercentage = pixelPos / interfaceWidth
        
        // Apply same percentage to PDF text width
        xPos = positionPercentage * PDF_TEXT_WIDTH
        
        // Ensure bounds
        xPos = Math.max(0, Math.min(xPos, PDF_TEXT_WIDTH - 5))
        
        // Debugging information
        console.log(`📄 PROPORTIONAL MAPPING: Chord "${chord}"`)
        console.log(`   - Interface pixel: ${pixelPos}px`)
        console.log(`   - Interface width: ${interfaceWidth}px`)
        console.log(`   - Position percentage: ${(positionPercentage * 100).toFixed(1)}%`)
        console.log(`   - PDF position: ${xPos.toFixed(2)}mm`)
        console.log(`   - PDF width: ${PDF_TEXT_WIDTH}mm`)
        console.log(`   - Text: "${text.trim()}"`)
      } else {
        // Default positioning for chords without saved positions
        const spacing = 140 / (chords.length + 1)
        xPos = spacing * (index + 1) - 5
        xPos = Math.max(0, xPos)
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
            <button 
              onClick={toggleChordDiagrams}
              className="action-button toggle-chord-display"
              title={showChordDiagrams ? 'Show chord names' : 'Show chord diagrams'}
            >
              {showChordDiagrams ? '🎸 → ABC' : 'ABC → 🎸'}
            </button>
            <button 
              onClick={() => handleExport('pdf-hq')} 
              className="action-button"
              disabled={isExporting}
            >
              {isExporting ? 'Exporting...' : '📄 Export'}
            </button>
            <button 
              onClick={() => handleExport('print')} 
              className="action-button"
              disabled={isExporting}
            >
              🖨️ Print
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
              {/* Draggable Chord Diagrams Layer */}
              <div className="chords-layer">
                {line.chords.map((chord, chordIndex) => {
                  // Calculate positioning based on display mode
                  const containerWidth = showChordDiagrams ? 600 : 400; 
                  const chordWidth = showChordDiagrams ? 90 : 50; 
                  const totalChords = line.chords.length;
                  
                  let defaultPosition = 0;
                  if (totalChords > 1) {
                    // Distribute chords evenly across the available space
                    const availableSpace = containerWidth - chordWidth;
                    defaultPosition = (chordIndex / (totalChords - 1)) * availableSpace;
                  } else {
                    defaultPosition = 10; // Single chord, place near start
                  }
                  
                  const finalPosition = line.chordPositions && line.chordPositions[chordIndex] !== undefined 
                    ? line.chordPositions[chordIndex] 
                    : Math.max(0, Math.min(defaultPosition, containerWidth - chordWidth));
                  
                  return (
                    <div 
                      key={`chord-${line.id}-${chordIndex}`}
                      className={showChordDiagrams ? "draggable-chord-diagram" : "draggable-chord-text"}
                      style={{ 
                        left: `${finalPosition}px`,
                        position: 'absolute',
                        top: '0px',
                        zIndex: 10
                      }}
                      onMouseDown={(e) => handleChordMouseDown(e, line.id, chordIndex)}
                    >
                      {showChordDiagrams ? (
                        <ChordDiagram chord={chord} size="medium" />
                      ) : (
                        <div className="chord-text-display">
                          {chord}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Lyrics Input Line */}
              <div className="lyrics-line">
                <input
                  type="text"
                  value={line.text || ''}
                  onChange={(e) => {
                    // Strict character limit enforcement
                    const newText = e.target.value.slice(0, 120)
                    if (newText.length <= 120) {
                      updateLineText(line.id, newText)
                    }
                  }}
                  onKeyPress={(e) => {
                    // Prevent typing if at character limit
                    if (line.text && line.text.length >= 120 && e.key !== 'Backspace' && e.key !== 'Delete') {
                      e.preventDefault()
                    }
                  }}
                  className="lyrics-input"
                  placeholder="Write your lyrics here..."
                  maxLength={120}
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