import React from 'react'
import './PianoKeyboard.css'

// Helper: given a natural key name (C, D, E, F, G, A, B) and a chromatic position
// offset (1 semitone up = the black key between this natural and the next),
// return the note name to display. Prefers the name used in `scale_notes`
// (e.g. for F major the black key between A-B is "Bb" not "A#"), falls back
// to the sharp name if the scale doesn't disambiguate.
const NATURAL_INDEX = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
// Enharmonic equivalents: for each position in the 12-tone chromatic, list aliases.
const ENHARMONIC = {
  1:  ['C#', 'Db'], 3:  ['D#', 'Eb'], 6:  ['F#', 'Gb'],
  8:  ['G#', 'Ab'], 10: ['A#', 'Bb'],
}

const noteNameAt = (natural, semitoneOffset, scaleNotes = []) => {
  const base = NATURAL_INDEX[natural]
  if (base === undefined) return natural
  const semi = (base + semitoneOffset) % 12
  // Prefer a name that's actually in the scale, so flats appear in flat keys
  const aliases = ENHARMONIC[semi] || [CHROMATIC[semi]]
  for (const alias of aliases) {
    if (scaleNotes.includes(alias)) return alias
  }
  return CHROMATIC[semi]
}

const PianoKeyboard = ({ keyboardData }) => {
  const { natural_keys, black_keys, scale_notes, root_note } = keyboardData
  const containerRef = React.useRef(null)
  const [containerWidth, setContainerWidth] = React.useState(0)

  // Measure container width on mount and resize
  React.useEffect(() => {
    if (!containerRef.current) return
    const el = containerRef.current
    const update = () => setContainerWidth(el.clientWidth)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const isInScale = (note) => scale_notes?.includes(note)
  const isRoot = (note) => note === root_note

  const naturalClass = (note) => {
    if (isRoot(note)) return 'pk-natural-key root-note'
    if (isInScale(note)) return 'pk-natural-key scale-note'
    return 'pk-natural-key'
  }

  const blackClass = (note) => {
    if (isRoot(note)) return 'pk-black-key root-note'
    if (isInScale(note)) return 'pk-black-key scale-note'
    return 'pk-black-key'
  }

  const totalNaturals = natural_keys?.length || 7
  const naturalWidth = containerWidth > 0 ? containerWidth / totalNaturals : 0
  const blackWidth = naturalWidth * 0.65

  return (
    <div className="piano-container" ref={containerRef}>
      <div className="piano-keyboard" data-natural-count={totalNaturals}>
        {/* Black keys absolutely positioned by JS to avoid CSS calc edge cases */}
        {containerWidth > 0 && (
          <div className="pk-black-keys-layer" aria-hidden="true">
            {black_keys?.map((bk, i) => {
              const natural = natural_keys[bk.after_natural]
              const chromaticName = noteNameAt(natural, 1, scale_notes)
              const centerX = (bk.after_natural + 1) * naturalWidth
              const left = centerX - blackWidth / 2
              return (
                <div
                  key={i}
                  className={blackClass(chromaticName)}
                  style={{ left: `${left}px`, width: `${blackWidth}px` }}
                  title={chromaticName}
                >
                  {chromaticName}
                </div>
              )
            })}
          </div>
        )}

        {/* Natural (white) keys — flex row */}
        <div className="pk-natural-keys-row">
          {natural_keys?.map((note, i) => (
            <div
              key={i}
              className={naturalClass(note)}
              title={note}
            >
              {note}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="piano-legend">
        <div className="legend-item">
          <div className="legend-key root"></div>
          <span>Root Note ({root_note})</span>
        </div>
        <div className="legend-item">
          <div className="legend-key scale"></div>
          <span>Scale Notes</span>
        </div>
        <div className="legend-item">
          <div className="legend-key white"></div>
          <span>Other Notes</span>
        </div>
      </div>
    </div>
  )
}

export default PianoKeyboard
