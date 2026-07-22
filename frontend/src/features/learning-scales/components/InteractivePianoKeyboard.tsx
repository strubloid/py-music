// Interactive variant of the base PianoKeyboard.
// Reuses the base component's CSS classes so visual changes in
// frontend/src/components/PianoKeyboard/PianoKeyboard.scss propagate
// here automatically. Renders <button> elements that fire onSelect.

import React, { useEffect, useRef, useState } from 'react'
import '../../../components/PianoKeyboard/PianoKeyboard.scss'

const NATURAL_INDEX = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const ENHARMONIC = {
  1: ['C#', 'Db'],
  3: ['D#', 'Eb'],
  6: ['F#', 'Gb'],
  8: ['G#', 'Ab'],
  10: ['A#', 'Bb'],
}

const noteNameAt = (natural, semitoneOffset, scaleNotes = []) => {
  const base = NATURAL_INDEX[natural]
  if (base === undefined) return natural
  const semi = (base + semitoneOffset) % 12
  const aliases = ENHARMONIC[semi] || [CHROMATIC[semi]]
  for (const alias of aliases) {
    if (scaleNotes.includes(alias)) return alias
  }
  return CHROMATIC[semi]
}

const BLACK_KEY_OFFSETS = { 0: 1, 1: 1, 3: 1, 4: 1, 5: 1 }

export interface InteractivePianoSelection {
  note: string
  pitchClass: number
  midi: number
  naturalIndex: number
  isBlack: boolean
}

type StateClass = 'pk-key-active' | 'pk-key-match' | 'pk-key-miss' | 'pk-key-correct' | 'pk-key-wrong' | 'pk-key-hint'

type Props = {
  keyboardData: {
    natural_keys: string[]
    black_keys: Array<{ note: string; after_natural: number }>
    scale_notes: string[]
    root_note: string
  }
  selectedNotes?: string[]
  matchedNotes?: string[]
  missedNotes?: string[]
  correctNotes?: string[]
  wrongNotes?: string[]
  hintNotes?: string[]
  rootPitchClass?: number
  showLabels?: boolean
  disabled?: boolean
  onSelect?: (selection: InteractivePianoSelection) => void
  ariaLabel?: string
}

const InteractivePianoKeyboard = ({
  keyboardData,
  selectedNotes = [],
  matchedNotes = [],
  missedNotes = [],
  correctNotes = [],
  wrongNotes = [],
  hintNotes = [],
  rootPitchClass,
  showLabels = true,
  disabled = false,
  onSelect,
  ariaLabel = 'Interactive piano keyboard',
}: Props) => {
  const { natural_keys = [], black_keys = [], scale_notes = [], root_note } = keyboardData ?? {}
  const keyboardRef = useRef<HTMLDivElement>(null)
  const [keyboardWidth, setKeyboardWidth] = useState(0)

  useEffect(() => {
    if (!keyboardRef.current) return
    const el = keyboardRef.current
    const update = () => setKeyboardWidth(el.clientWidth)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const totalNaturals = natural_keys.length || 7
  const naturalWidth = keyboardWidth > 0 ? keyboardWidth / totalNaturals : 0
  const blackWidth = naturalWidth * 0.65
  const hasRoot = typeof root_note === 'string' && root_note.length > 0
  const isInScale = (note: string) => hasRoot && scale_notes?.includes(note)
  const isRoot = (note: string) => hasRoot && note === root_note

  const naturalClass = (note: string) => {
    if (isRoot(note)) return 'pk-natural-key root-note'
    if (isInScale(note)) return 'pk-natural-key scale-note'
    return 'pk-natural-key'
  }

  const blackClass = (note: string) => {
    if (isRoot(note)) return 'pk-black-key root-note'
    if (isInScale(note)) return 'pk-black-key scale-note'
    return 'pk-black-key'
  }

  const stateClassFor = (note: string): StateClass | null => {
    if (correctNotes.includes(note)) return 'pk-key-correct'
    if (wrongNotes.includes(note)) return 'pk-key-wrong'
    if (matchedNotes.includes(note)) return 'pk-key-match'
    if (missedNotes.includes(note)) return 'pk-key-miss'
    if (selectedNotes.includes(note)) return 'pk-key-active'
    if (hintNotes.includes(note)) return 'pk-key-hint'
    return null
  }

  const handleNaturalClick = (naturalIndex: number, note: string) => {
    if (disabled || !onSelect) return
    const pitchClass = NATURAL_INDEX[note]
    onSelect({
      note,
      pitchClass,
      midi: 60 + pitchClass,
      naturalIndex,
      isBlack: false,
    })
  }

  const handleBlackClick = (afterNatural: number, note: string) => {
    if (disabled || !onSelect) return
    const pitchClass = NATURAL_INDEX[natural_keys[afterNatural]] + 1
    onSelect({
      note,
      pitchClass: pitchClass % 12,
      midi: 60 + (pitchClass % 12),
      naturalIndex: afterNatural,
      isBlack: true,
    })
  }

  return (
    <div className="piano-container">
      <div
        className="piano-keyboard"
        ref={keyboardRef}
        data-natural-count={totalNaturals}
        style={{ '--natural-count': totalNaturals } as React.CSSProperties}
        role="group"
        aria-label={ariaLabel}
      >
        {keyboardWidth > 0 && (
          <div className="pk-black-keys-layer" aria-hidden="false">
            {black_keys.map((bk, i) => {
              const natural = natural_keys[bk.after_natural]
              if (!natural) return null
              const offset = BLACK_KEY_OFFSETS[natural_keys.filter((_, idx) => idx <= bk.after_natural).length - 1] ?? 1
              const chromaticName = noteNameAt(natural, offset, scale_notes)
              const state = stateClassFor(chromaticName)
              const centerX = (bk.after_natural + 1) * naturalWidth
              const left = centerX - blackWidth / 2
              const isRootKey = isRoot(chromaticName)
              return (
                <button
                  type="button"
                  key={`bk-${i}`}
                  className={`${blackClass(chromaticName)} pk-key-button ${state ?? ''}`.trim()}
                  style={{ left: `${left}px`, width: `${blackWidth}px` }}
                  title={chromaticName}
                  aria-label={`${chromaticName}${isRootKey ? ', root note' : ''}`}
                  aria-pressed={state === 'pk-key-active' || state === 'pk-key-correct' || state === 'pk-key-wrong'}
                  disabled={disabled}
                  onClick={() => handleBlackClick(bk.after_natural, chromaticName)}
                >
                  {showLabels && chromaticName}
                </button>
              )
            })}
          </div>
        )}

        <div className="pk-natural-keys-row">
          {natural_keys.map((note, i) => {
            const state = stateClassFor(note)
            const isRootKey = isRoot(note)
            return (
              <button
                type="button"
                key={`nk-${i}`}
                className={`${naturalClass(note)} pk-key-button ${state ?? ''}`.trim()}
                title={note}
                aria-label={`${note}${isRootKey ? ', root note' : ''}`}
                aria-pressed={
                  state === 'pk-key-active' ||
                  state === 'pk-key-match' ||
                  state === 'pk-key-miss' ||
                  state === 'pk-key-correct' ||
                  state === 'pk-key-wrong'
                }
                disabled={disabled}
                onClick={() => handleNaturalClick(i, note)}
              >
                {showLabels && note}
              </button>
            )
          })}
        </div>
      </div>

      <div className="piano-legend">
        {hasRoot && (
          <div className="legend-item">
            <div className="legend-key root" />
            <span>Root Note ({root_note})</span>
          </div>
        )}
        {hasRoot && scale_notes.length > 0 && (
          <div className="legend-item">
            <div className="legend-key scale" />
            <span>Scale Notes</span>
          </div>
        )}
        <div className="legend-item">
          <div className="legend-key match" aria-hidden="true" />
          <span>In Target (placed)</span>
        </div>
        <div className="legend-item">
          <div className="legend-key miss" aria-hidden="true" />
          <span>Off Target (placed)</span>
        </div>
      </div>
    </div>
  )
}

export default InteractivePianoKeyboard
