import React, { useRef, useEffect, useState } from 'react'
import { useChordPanel } from '../../contexts/ChordPanelContext'
import './LyricsSection.scss'

const LYRICS_KEY = 'create-page-lyrics'

const LyricsSection = () => {
  const { 
    progressionLines, 
    lyrics, 
    setLyricLine,
    chordOverLyrics,
    placeChordAtWord,
    removeChordFromWord,
    getChordAtWord,
    clearLineChords,
    showChords,
    viewMode,
    setViewMode
  } = useChordPanel()
  
  const textareaRefs = useRef({})

  // Load cached lyrics on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(LYRICS_KEY)
      if (cached) {
        const parsed = JSON.parse(cached)
        // Support both old format (string[]) and new format ({ lineIndex: text })
        if (Array.isArray(parsed)) {
          const newFormat = {}
          parsed.forEach((text, i) => { newFormat[i] = text })
          Object.entries(newFormat).forEach(([i, text]) => setLyricLine(parseInt(i), text))
        } else {
          Object.entries(parsed).forEach(([i, text]) => setLyricLine(parseInt(i), text))
        }
      }
    } catch {}
  }, [])

  // Save lyrics to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem(LYRICS_KEY, JSON.stringify(lyrics))
    } catch {}
  }, [lyrics])

  // Handle lyric text change for a specific line
  const handleLyricChange = (lineIndex, value) => {
    setLyricLine(lineIndex, value)
  }

  // Get words from a lyric line, handling quoted phrases as single units
  const getWords = (text) => {
    if (!text) return []
    // Split by spaces, but keep quoted phrases together
    const regex = /"([^"]+)"|\S+/g
    const words = []
    let match
    while ((match = regex.exec(text)) !== null) {
      words.push(match[1] || match[0])
    }
    return words
  }

  // Handle clicking on a word to place a chord
  const handleWordClick = (lineIndex, wordIndex, event) => {
    event.stopPropagation()
    const existingChord = getChordAtWord(lineIndex, wordIndex)
    
    if (existingChord) {
      // Show chord options or remove
      removeChordFromWord(lineIndex, wordIndex)
    } else {
      // Place the first available chord from progression
      const lineChords = progressionLines[lineIndex] || []
      if (lineChords.length > 0) {
        // Get the next unplaced chord in sequence
        const usedChords = chordOverLyrics[lineIndex] || []
        const usedIndices = usedChords.map(c => c.wordIndex)
        
        // Find next chord index
        let nextChordIndex = 0
        for (let i = 0; i < lineChords.length; i++) {
          if (!usedIndices.includes(i)) {
            nextChordIndex = i
            break
          }
        }
        
        placeChordAtWord(lineIndex, wordIndex, lineChords[nextChordIndex])
      }
    }
  }

  // Quick chord picker popup
  const [pickerOpen, setPickerOpen] = useState(null) // { lineIndex, wordIndex }

  const openChordPicker = (lineIndex, wordIndex, event) => {
    event.stopPropagation()
    setPickerOpen({ lineIndex, wordIndex })
  }

  const selectChord = (chord) => {
    if (pickerOpen) {
      placeChordAtWord(pickerOpen.lineIndex, pickerOpen.wordIndex, chord)
      setPickerOpen(null)
    }
  }

  // Render a single line of lyrics with chord positions
  const renderLyricLineWithChords = (lineIndex) => {
    const text = lyrics[lineIndex] || ''
    const words = getWords(text)
    const lineChords = chordOverLyrics[lineIndex] || []
    
    // Build chord map: wordIndex -> chord
    const chordMap = {}
    lineChords.forEach(({ wordIndex, chord }) => {
      chordMap[wordIndex] = chord
    })

    // For words without chords, show placeholders for remaining chords
    const placedIndices = new Set(lineChords.map(c => c.wordIndex))
    const unplacedChords = (progressionLines[lineIndex] || [])
      .filter((_, i) => !placedIndices.has(i))

    return (
      <div key={lineIndex} className="music-sheet-line">
        {/* Chord row */}
        <div className="chord-row">
          {words.map((word, wordIndex) => {
            const chord = chordMap[wordIndex]
            return (
              <span 
                key={wordIndex} 
                className={`chord-slot ${chord ? 'has-chord' : 'empty'}`}
                onClick={(e) => openChordPicker(lineIndex, wordIndex, e)}
              >
                {chord && (
                  <span 
                    className="placed-chord" 
                    onClick={(e) => { e.stopPropagation(); removeChordFromWord(lineIndex, wordIndex) }}
                    title="Click to remove chord"
                  >
                    {chord}
                  </span>
                )}
              </span>
            )
          })}
          {/* Show remaining chords as placeholders */}
          {unplacedChords.map((chord, i) => (
            <span key={`unplaced-${i}`} className="chord-slot unplaced" title={`${chord} (not placed)`}>
              {chord}
            </span>
          ))}
        </div>
        {/* Lyric row */}
        <div className="lyric-row">
          {words.map((word, wordIndex) => (
            <span 
              key={wordIndex} 
              className="lyric-word"
              onClick={(e) => handleWordClick(lineIndex, wordIndex, e)}
            >
              {word}
            </span>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="lyrics-section">
      <div className="lyrics-header">
        <span className="lyrics-title">Lyrics</span>
        <div className="view-mode-toggle">
          <button 
            className={`mode-btn ${viewMode === 'builder' ? 'active' : ''}`}
            onClick={() => setViewMode('builder')}
          >
            Builder
          </button>
          <button 
            className={`mode-btn ${viewMode === 'sheet' ? 'active' : ''}`}
            onClick={() => setViewMode('sheet')}
          >
            Music Sheet
          </button>
        </div>
      </div>

      {viewMode === 'builder' ? (
        <>
          <div className="lyrics-lines">
            {progressionLines.map((line, lineIndex) => (
              <div key={lineIndex} className="lyrics-line-row">
                <span className="lyrics-line-num">{lineIndex + 1}</span>
                <textarea
                  ref={el => textareaRefs.current[lineIndex] = el}
                  className="lyrics-textarea"
                  placeholder={`Lyrics for line ${lineIndex + 1}…`}
                  value={lyrics[lineIndex] ?? ''}
                  onChange={e => handleLyricChange(lineIndex, e.target.value)}
                  rows={2}
                />
                {(lyrics[lineIndex] || '').trim() && (
                  <button 
                    className="clear-lyrics-btn"
                    onClick={() => { handleLyricChange(lineIndex, ''); clearLineChords(lineIndex) }}
                    title="Clear lyrics and chords for this line"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          
          {/* Instructions */}
          <div className="lyrics-help">
            <p>Type lyrics, then switch to "Music Sheet" view to position chords above words.</p>
            <p className="chord-count-hint">
              {progressionLines.reduce((sum, line) => sum + line.length, 0)} chords available
              {' · '}
              {Object.values(chordOverLyrics).flat().length} chords placed
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="music-sheet-view">
            {progressionLines.map((_, lineIndex) => {
              const text = lyrics[lineIndex]
              if (!text || !text.trim()) {
                return (
                  <div key={lineIndex} className="music-sheet-line empty-line">
                    <div className="chord-row">
                      <span className="empty-hint">Line {lineIndex + 1}: Add lyrics in Builder view</span>
                    </div>
                    <div className="lyric-row" />
                  </div>
                )
              }
              return renderLyricLineWithChords(lineIndex)
            })}
          </div>
          
          {/* Instructions for sheet view */}
          <div className="sheet-help">
            <p>Click above a word to place a chord. Click a placed chord to remove it.</p>
          </div>
        </>
      )}

      {/* Chord Picker Popup */}
      {pickerOpen && (
        <div className="chord-picker-overlay" onClick={() => setPickerOpen(null)}>
          <div className="chord-picker" onClick={e => e.stopPropagation()}>
            <div className="picker-header">
              <span>Select Chord</span>
              <button className="picker-close" onClick={() => setPickerOpen(null)}>×</button>
            </div>
            <div className="picker-chords">
              {(progressionLines[pickerOpen.lineIndex] || []).map((chord, i) => (
                <button 
                  key={i} 
                  className="picker-chord-btn"
                  onClick={() => selectChord(chord)}
                >
                  {chord}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LyricsSection
