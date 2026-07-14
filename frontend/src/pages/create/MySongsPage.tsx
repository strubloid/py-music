import React, { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import {
  ArrowLeft,
  Download,
  FileText,
  FolderOpen,
  Music,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { createProgression, deleteProgression, getProgressions, updateProgression } from '../../services/api'
import './MySongsPage.scss'

const GUEST_SONGS_KEY = 'guestProgressions'
const NEW_SONGS_KEY = 'newSongsCount'
const DEFAULT_KEY = 'C'
const DEFAULT_INTERVAL = 'ionian'
const ROOT_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const FALLBACK_PALETTE = ['C', 'G', 'Am', 'F', 'Dm', 'Em']

const parseJson = (value, fallback) => {
  if (value === null || value === undefined || value === '') return fallback
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

const splitWords = (text = '') => {
  const regex = /"([^"]+)"|\S+/g
  const words = []
  let match
  while ((match = regex.exec(text)) !== null) words.push(match[1] || match[0])
  return words
}

const escapeHtml = (text = '') => String(text)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;')

const normalizeChordLines = (rawChords) => {
  const chords = parseJson(rawChords, [])
  if (!Array.isArray(chords) || chords.length === 0) return [[]]
  if (Array.isArray(chords[0])) return chords.map(line => line.filter(Boolean))
  return [chords.filter(Boolean)]
}

const normalizeSong = (song) => {
  const chordLines = normalizeChordLines(song.chords_json)
  const lyrics = parseJson(song.lyrics_json, {}) || {}
  const chordOverLyrics = parseJson(song.chord_over_lyrics_json, {}) || {}
  const lineCount = Math.max(chordLines.length, Object.keys(lyrics).length || 1)

  return {
    id: song.id,
    name: song.name || 'Untitled Song',
    key: song.key || DEFAULT_KEY,
    interval: song.interval === 'major' ? DEFAULT_INTERVAL : (song.interval || DEFAULT_INTERVAL),
    chordLines: Array.from({ length: lineCount }, (_, index) => chordLines[index] || []),
    lyrics: Array.from({ length: lineCount }, (_, index) => lyrics[index] || '').reduce((acc, text, index) => ({ ...acc, [index]: text }), {}),
    chordOverLyrics: Array.from({ length: lineCount }, (_, index) => chordOverLyrics[index] || []).reduce((acc, items, index) => ({ ...acc, [index]: items }), {}),
    created_at: song.created_at,
    updated_at: song.updated_at,
  }
}

const createBlankSong = () => ({
  id: null,
  name: 'Untitled Song',
  key: DEFAULT_KEY,
  interval: DEFAULT_INTERVAL,
  chordLines: [['C', 'G', 'Am', 'F']],
  lyrics: { 0: 'Write your first line here' },
  chordOverLyrics: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
})

const flattenChordCount = (song) => song.chordLines.reduce((sum, line) => sum + line.length, 0)
const placedChordCount = (song) => Object.values(song.chordOverLyrics || {}).flat().length
const lyricLineCount = (song) => Object.values(song.lyrics || {}).filter(line => line.trim()).length

const formatDate = (iso) => {
  if (!iso) return 'Draft'
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

const serializeSong = (song) => ({
  name: song.name.trim() || 'Untitled Song',
  key: song.key,
  interval: song.interval || DEFAULT_INTERVAL,
  chords: song.chordLines,
  lyrics: JSON.stringify(song.lyrics),
  chordOverLyrics: JSON.stringify(song.chordOverLyrics),
})

const MySongsPage = () => {
  const { isLoggedIn, promptLogin } = useAuth()
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [picker, setPicker] = useState(null)
  const [palette, setPalette] = useState(FALLBACK_PALETTE)
  const [customChord, setCustomChord] = useState('')

  const loadSongs = useCallback(async () => {
    setLoading(true)
    if (!isLoggedIn) {
      const saved = parseJson(localStorage.getItem(GUEST_SONGS_KEY), [])
      setSongs(Array.isArray(saved) ? saved.map(normalizeSong) : [])
      setLoading(false)
      return
    }

    try {
      const res = await getProgressions()
      setSongs((res.data.progressions || []).map(normalizeSong))
    } catch {
      setSongs([])
    } finally {
      setLoading(false)
    }
  }, [isLoggedIn])

  useEffect(() => {
    loadSongs()
  }, [loadSongs])

  useEffect(() => {
    if (!draft?.key) return

    let cancelled = false
    axios.get(`/api/scale/${encodeURIComponent(draft.key)}?interval=${draft.interval || DEFAULT_INTERVAL}`)
      .then(res => {
        if (cancelled) return
        const chords = (res.data?.scale_degrees || []).map(deg => deg.chord).filter(Boolean)
        const sevenths = (res.data?.chord_sevenths || []).map(item => item.seventh).filter(Boolean)
        setPalette([...new Set([...chords, ...sevenths])].slice(0, 14))
      })
      .catch(() => setPalette(FALLBACK_PALETTE))

    return () => { cancelled = true }
  }, [draft?.key, draft?.interval])

  const sortedSongs = useMemo(() => {
    return [...songs].sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0))
  }, [songs])

  const updateDraft = (updater) => {
    setDraft(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      return { ...next, updated_at: new Date().toISOString() }
    })
  }

  const startNewSong = () => {
    setDraft(createBlankSong())
    setPicker(null)
  }

  const openSong = (song) => {
    setDraft(normalizeSong({
      ...song,
      chords_json: song.chordLines,
      lyrics_json: song.lyrics,
      chord_over_lyrics_json: song.chordOverLyrics,
    }))
    setPicker(null)
  }

  const saveGuestSong = (song) => {
    const existing = parseJson(localStorage.getItem(GUEST_SONGS_KEY), [])
    const now = new Date().toISOString()
    const id = song.id || `guest_${Date.now()}`
    const record = {
      id,
      name: song.name.trim() || 'Untitled Song',
      key: song.key,
      interval: song.interval,
      chords_json: JSON.stringify(song.chordLines),
      lyrics_json: JSON.stringify(song.lyrics),
      chord_over_lyrics_json: JSON.stringify(song.chordOverLyrics),
      created_at: song.created_at || now,
      updated_at: now,
    }
    const updated = Array.isArray(existing)
      ? [record, ...existing.filter(item => item.id !== id)]
      : [record]
    localStorage.setItem(GUEST_SONGS_KEY, JSON.stringify(updated))
    return normalizeSong(record)
  }

  const bumpNewSongsCount = () => {
    const current = parseInt(localStorage.getItem(NEW_SONGS_KEY) || '0', 10)
    localStorage.setItem(NEW_SONGS_KEY, String(current + 1))
  }

  const saveSong = async () => {
    if (!draft) return
    setSaving(true)
    try {
      let saved
      if (isLoggedIn) {
        const payload = serializeSong(draft)
        const res = draft.id
          ? await updateProgression(draft.id, payload)
          : await createProgression(payload)
        saved = normalizeSong(res.data.progression)
      } else {
        saved = saveGuestSong(draft)
      }

      setSongs(prev => [saved, ...prev.filter(song => song.id !== saved.id)])
      setDraft(saved)
      if (!draft.id) bumpNewSongsCount()
    } finally {
      setSaving(false)
    }
  }

  const deleteSong = async (song) => {
    if (!window.confirm(`Delete "${song.name}"?`)) return
    setDeletingId(song.id)
    try {
      if (isLoggedIn && typeof song.id === 'number') {
        await deleteProgression(song.id)
      } else {
        const saved = parseJson(localStorage.getItem(GUEST_SONGS_KEY), [])
        localStorage.setItem(GUEST_SONGS_KEY, JSON.stringify(saved.filter(item => item.id !== song.id)))
      }
      setSongs(prev => prev.filter(item => item.id !== song.id))
      if (draft?.id === song.id) setDraft(null)
    } finally {
      setDeletingId(null)
    }
  }

  const setLineLyrics = (lineIndex, text) => updateDraft(song => ({
    ...song,
    lyrics: { ...song.lyrics, [lineIndex]: text },
    chordOverLyrics: {
      ...song.chordOverLyrics,
      [lineIndex]: (song.chordOverLyrics[lineIndex] || []).filter(item => item.wordIndex < splitWords(text).length),
    },
  }))

  const addLine = () => updateDraft(song => {
    const nextIndex = song.chordLines.length
    return {
      ...song,
      chordLines: [...song.chordLines, []],
      lyrics: { ...song.lyrics, [nextIndex]: '' },
      chordOverLyrics: { ...song.chordOverLyrics, [nextIndex]: [] },
    }
  })

  const removeLine = (lineIndex) => updateDraft(song => {
    if (song.chordLines.length <= 1) return song
    const chordLines = song.chordLines.filter((_, index) => index !== lineIndex)
    const lyrics = {}
    const chordOverLyrics = {}
    chordLines.forEach((_, newIndex) => {
      const oldIndex = newIndex >= lineIndex ? newIndex + 1 : newIndex
      lyrics[newIndex] = song.lyrics[oldIndex] || ''
      chordOverLyrics[newIndex] = song.chordOverLyrics[oldIndex] || []
    })
    return { ...song, chordLines, lyrics, chordOverLyrics }
  })

  const addChordToLine = (lineIndex, chord) => {
    if (!chord.trim()) return
    updateDraft(song => {
      const chordLines = song.chordLines.map((line, index) => index === lineIndex ? [...line, chord.trim()] : line)
      return { ...song, chordLines }
    })
    setCustomChord('')
  }

  const removeChordFromLine = (lineIndex, chordIndex) => updateDraft(song => {
    const chordToRemove = song.chordLines[lineIndex][chordIndex]
    const chordLines = song.chordLines.map((line, index) => index === lineIndex ? line.filter((_, i) => i !== chordIndex) : line)
    const chordOverLyrics = {
      ...song.chordOverLyrics,
      [lineIndex]: (song.chordOverLyrics[lineIndex] || []).filter(item => item.chord !== chordToRemove),
    }
    return { ...song, chordLines, chordOverLyrics }
  })

  const placeChord = (lineIndex, wordIndex, chord) => {
    updateDraft(song => {
      const existing = (song.chordOverLyrics[lineIndex] || []).filter(item => item.wordIndex !== wordIndex)
      const nextLine = chord ? [...existing, { wordIndex, chord }].sort((a, b) => a.wordIndex - b.wordIndex) : existing
      return {
        ...song,
        chordOverLyrics: { ...song.chordOverLyrics, [lineIndex]: nextLine },
      }
    })
    setPicker(null)
  }

  const removePlacedChord = (lineIndex, wordIndex) => placeChord(lineIndex, wordIndex, null)

  const exportSong = () => {
    if (!draft) return
    const lines = draft.chordLines.map((_, lineIndex) => {
      const words = splitWords(draft.lyrics[lineIndex] || '')
      const chordMap = Object.fromEntries((draft.chordOverLyrics[lineIndex] || []).map(item => [item.wordIndex, item.chord]))

      if (words.length === 0) {
        return `<section class="song-line empty"><div class="empty-line">Line ${lineIndex + 1}: instrumental / empty</div></section>`
      }

      const wordCells = words.map((word, wordIndex) => `
        <span class="word-cell">
          <span class="chord-mark">${escapeHtml(chordMap[wordIndex] || '')}</span>
          <span class="lyric-word">${escapeHtml(word)}</span>
        </span>
      `).join('')

      return `<section class="song-line"><div class="word-row">${wordCells}</div></section>`
    }).join('')

    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(draft.name)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Inter, Arial, sans-serif; color: #171717; background: #fff; padding: 36px 44px; max-width: 900px; margin: 0 auto; }
    header { border-bottom: 2px solid #171717; padding-bottom: 14px; margin-bottom: 28px; }
    h1 { margin: 0; font-size: 30px; letter-spacing: -0.03em; }
    .meta { margin-top: 6px; color: #666; font-size: 13px; }
    .sheet { display: flex; flex-direction: column; gap: 24px; }
    .song-line { break-inside: avoid; padding: 10px 0 14px; border-bottom: 1px solid #e5e7eb; }
    .word-row { display: flex; flex-wrap: wrap; gap: 6px 8px; align-items: flex-end; }
    .word-cell { display: inline-flex; flex-direction: column; align-items: flex-start; min-width: 24px; }
    .chord-mark { min-height: 18px; color: #b45309; font-weight: 800; font-size: 14px; line-height: 1; }
    .lyric-word { font-size: 18px; line-height: 1.55; }
    .empty-line { color: #999; font-style: italic; }
    footer { margin-top: 36px; padding-top: 12px; border-top: 1px solid #eee; color: #999; font-size: 12px; display: flex; justify-content: space-between; }
    @media print { body { padding: 18px 22px; } .song-line { page-break-inside: avoid; } }
  </style>
</head>
<body>
  <header>
    <h1>${escapeHtml(draft.name || 'Untitled Song')}</h1>
    <div class="meta">Key: ${escapeHtml(draft.key)} · ${placedChordCount(draft)} selected chords · ${lyricLineCount(draft)} lyric lines</div>
  </header>
  <main class="sheet">${lines}</main>
  <footer><span>Generated by Strubloid My Songs</span><span>${new Date().toLocaleDateString()}</span></footer>
</body>
</html>`)
    printWindow.document.close()
    setTimeout(() => {
      printWindow.focus()
      printWindow.print()
    }, 250)
  }

  if (draft) {
    return (
      <div className="mysongs-page song-editor-page">
        <div className="song-editor-topbar">
          <button className="ghost-btn" onClick={() => { setDraft(null); setPicker(null) }}>
            <ArrowLeft size={16} /> Library
          </button>
          <div className="song-title-stack">
            <input
              className="song-title-input"
              value={draft.name}
              onChange={event => updateDraft(song => ({ ...song, name: event.target.value }))}
              aria-label="Song title"
            />
            <span>{draft.key} · {draft.chordLines.length} line{draft.chordLines.length !== 1 ? 's' : ''} · {placedChordCount(draft)} placed chords</span>
          </div>
          <div className="song-editor-actions">
            <button className="ghost-btn" onClick={exportSong}><Download size={16} /> Export PDF</button>
            <button className="save-song-btn" onClick={saveSong} disabled={saving}>
              <Save size={16} /> {saving ? 'Saving...' : 'Save Song'}
            </button>
          </div>
        </div>

        <section className="song-key-panel">
          <div>
            <span className="panel-eyebrow">Key</span>
            <div className="root-note-grid">
              {ROOT_NOTES.map(note => (
                <button
                  key={note}
                  className={`root-note-chip ${draft.key === note ? 'active' : ''}`}
                  onClick={() => updateDraft(song => ({ ...song, key: note }))}
                >
                  {note}
                </button>
              ))}
            </div>
          </div>
          <div className="palette-panel">
            <span className="panel-eyebrow">Key palette</span>
            <div className="palette-chips">
              {palette.map(chord => <span key={chord} className="palette-chip">{chord}</span>)}
            </div>
          </div>
        </section>

        <section className="writer-help-card">
          <Sparkles size={18} />
          Write one lyric line, add the chords that belong to that line, then click words in the sheet row to place the harmony change exactly where you sing it.
        </section>

        <div className="song-lines-editor">
          {draft.chordLines.map((lineChords, lineIndex) => {
            const text = draft.lyrics[lineIndex] || ''
            const words = splitWords(text)
            const chordMap = Object.fromEntries((draft.chordOverLyrics[lineIndex] || []).map(item => [item.wordIndex, item.chord]))

            return (
              <section key={lineIndex} className="song-line-card">
                <div className="line-card-header">
                  <div>
                    <span className="panel-eyebrow">Line {lineIndex + 1}</span>
                    <strong>{lineChords.length} chord{lineChords.length !== 1 ? 's' : ''} available</strong>
                  </div>
                  {draft.chordLines.length > 1 && (
                    <button className="line-remove-btn" onClick={() => removeLine(lineIndex)}>
                      <Trash2 size={15} /> Remove line
                    </button>
                  )}
                </div>

                <textarea
                  className="line-lyrics-input"
                  value={text}
                  onChange={event => setLineLyrics(lineIndex, event.target.value)}
                  placeholder="Write a lyric line..."
                  rows={2}
                />

                <div className="line-chord-bank">
                  <span className="bank-label">Line chords</span>
                  <div className="bank-chords">
                    {lineChords.map((chord, chordIndex) => (
                      <button key={`${chord}-${chordIndex}`} className="bank-chord" onClick={() => removeChordFromLine(lineIndex, chordIndex)} title="Remove chord from this line">
                        {chord} <X size={12} />
                      </button>
                    ))}
                    {lineChords.length === 0 && <span className="empty-bank">Add a chord from the palette</span>}
                  </div>
                </div>

                <div className="quick-add-row">
                  {palette.slice(0, 8).map(chord => (
                    <button key={chord} className="quick-chord-btn" onClick={() => addChordToLine(lineIndex, chord)}>{chord}</button>
                  ))}
                  <input
                    value={customChord}
                    onChange={event => setCustomChord(event.target.value)}
                    onKeyDown={event => {
                      if (event.key === 'Enter') addChordToLine(lineIndex, customChord)
                    }}
                    placeholder="Custom"
                    className="custom-chord-input"
                  />
                  <button className="quick-chord-btn custom" onClick={() => addChordToLine(lineIndex, customChord)}>Add</button>
                </div>

                <div className="word-sheet-row">
                  {words.length === 0 ? (
                    <span className="word-empty-hint">Type lyrics above, then click words here to place chords.</span>
                  ) : words.map((word, wordIndex) => {
                    const chord = chordMap[wordIndex]
                    return (
                      <button
                        key={`${word}-${wordIndex}`}
                        className={`word-cell-btn ${chord ? 'has-chord' : ''}`}
                        onClick={() => setPicker({ lineIndex, wordIndex })}
                      >
                        <span className="word-chord-mark">{chord || '＋'}</span>
                        <span className="word-text">{word}</span>
                      </button>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>

        <button className="add-line-wide" onClick={addLine}><Plus size={16} /> Add lyric line</button>

        {picker && (
          <div className="chord-picker-overlay" onClick={() => setPicker(null)}>
            <div className="word-chord-picker" onClick={event => event.stopPropagation()}>
              <div className="picker-header">
                <div>
                  <span className="panel-eyebrow">Place chord</span>
                  <strong>{splitWords(draft.lyrics[picker.lineIndex] || '')[picker.wordIndex]}</strong>
                </div>
                <button onClick={() => setPicker(null)}><X size={18} /></button>
              </div>
              <div className="picker-grid">
                {(draft.chordLines[picker.lineIndex] || []).map((chord, index) => (
                  <button key={`${chord}-${index}`} onClick={() => placeChord(picker.lineIndex, picker.wordIndex, chord)}>{chord}</button>
                ))}
              </div>
              <button className="remove-placement-btn" onClick={() => removePlacedChord(picker.lineIndex, picker.wordIndex)}>
                Remove chord from this word
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="mysongs-page">
      <div className="mysongs-hero">
        <div>
          <div className="hero-kicker"><Music size={16} /> Songwriting desk</div>
          <h1>My Songs</h1>
          <p>Write lyrics, keep each line's chords close, and place changes above the exact words where they land.</p>
        </div>
        <button className="new-song-btn" onClick={startNewSong}><Plus size={18} /> New Song</button>
      </div>

      {!isLoggedIn && (
        <div className="guest-notice">
          Guest mode saves in this browser. <button onClick={() => promptLogin('save')}>Sign up free</button> to sync songs across devices.
        </div>
      )}

      {loading && <div className="loading-state">Loading your songs...</div>}

      {!loading && sortedSongs.length === 0 && (
        <section className="empty-library">
          <Wand2 size={34} />
          <h2>No songs yet</h2>
          <p>Start with a title, write one line, add a few chords, then place them above the words.</p>
          <button onClick={startNewSong}>Create your first song</button>
        </section>
      )}

      {!loading && sortedSongs.length > 0 && (
        <div className="songs-library-grid">
          {sortedSongs.map(song => {
            const firstLine = Object.values(song.lyrics).find(line => line.trim()) || 'No lyrics yet'
            return (
              <article key={song.id} className="library-song-card" onClick={() => openSong(song)}>
                <div className="song-card-topline">
                  <span className="song-key-pill">{song.key}</span>
                  <span>{formatDate(song.updated_at || song.created_at)}</span>
                </div>
                <h2>{song.name}</h2>
                <p className="song-first-line">{firstLine}</p>
                <div className="mini-sheet-preview">
                  {song.chordLines.slice(0, 2).map((line, lineIndex) => (
                    <div key={lineIndex}>
                      <span>{line.slice(0, 5).join('  ') || '—'}</span>
                      <small>{song.lyrics[lineIndex] || 'Instrumental line'}</small>
                    </div>
                  ))}
                </div>
                <div className="song-stats-row">
                  <span><FileText size={13} /> {lyricLineCount(song)} lines</span>
                  <span><Music size={13} /> {flattenChordCount(song)} chords</span>
                  <span><Sparkles size={13} /> {placedChordCount(song)} placed</span>
                </div>
                <div className="library-card-actions" onClick={event => event.stopPropagation()}>
                  <button className="open-song-btn" onClick={() => openSong(song)}><FolderOpen size={15} /> Open</button>
                  <button className="delete-song-btn" onClick={() => deleteSong(song)} disabled={deletingId === song.id}>
                    <Trash2 size={15} /> {deletingId === song.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default MySongsPage
