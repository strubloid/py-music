import React, { useEffect, useRef } from 'react'
import { useChordPanel } from '../../contexts/ChordPanelContext'
import './LyricsSection.css'

const LYRICS_KEY = 'create-page-lyrics'

const LyricsSection = () => {
  const { progressionLines } = useChordPanel()
  const textareaRefs = useRef({})
  const [lyrics, setLyrics] = React.useState({})

  // Load cached lyrics on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(LYRICS_KEY)
      if (cached) setLyrics(JSON.parse(cached))
    } catch {}
  }, [])

  // Sync with progressionLines — prune removed lines
  useEffect(() => {
    setLyrics(prev => {
      const updated = {}
      progressionLines.forEach((_, i) => {
        updated[i] = prev[i] ?? ''
      })
      if (JSON.stringify(updated) !== JSON.stringify(prev)) {
        return updated
      }
      return prev
    })
  }, [progressionLines])

  const handleChange = (lineIndex, value) => {
    setLyrics(prev => {
      const updated = { ...prev, [lineIndex]: value }
      localStorage.setItem(LYRICS_KEY, JSON.stringify(updated))
      return updated
    })
  }

  return (
    <div className="lyrics-section">
      <div className="lyrics-header">
        <span className="lyrics-title">Lyrics</span>
      </div>
      <div className="lyrics-lines">
        {progressionLines.map((line, lineIndex) => (
          <div key={lineIndex} className="lyrics-line-row">
            <span className="lyrics-line-num">{lineIndex + 1}</span>
            <textarea
              ref={el => textareaRefs.current[lineIndex] = el}
              className="lyrics-textarea"
              placeholder={`Lyrics for line ${lineIndex + 1}…`}
              value={lyrics[lineIndex] ?? ''}
              onChange={e => handleChange(lineIndex, e.target.value)}
              rows={2}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default LyricsSection
