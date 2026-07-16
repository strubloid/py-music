import React, { useEffect, useMemo, useRef } from 'react'
import { isBlackPianoMidi, midiToNoteName, pianoRange, type AccidentalPreference } from './musicMath'
import type { InstrumentSelection } from './GameGuitarFretboard'
import './game-instruments.scss'

type Props = {
  startMidi?: number
  endMidi?: number
  activeMidi?: number[]
  legalMidi?: number[]
  correctMidi?: number[]
  wrongMidi?: number[]
  rootPitchClass?: number
  showLabels?: boolean
  accidental?: AccidentalPreference
  disabled?: boolean
  onSelect?: (selection: InstrumentSelection) => void
}

const KEYBOARD_MAP: Record<string, number> = {
  a: 0,
  w: 1,
  s: 2,
  e: 3,
  d: 4,
  f: 5,
  t: 6,
  g: 7,
  y: 8,
  h: 9,
  u: 10,
  j: 11,
  k: 12,
}

const GamePianoKeyboard = ({
  startMidi = 48,
  endMidi = 72,
  activeMidi = [],
  legalMidi = [],
  correctMidi = [],
  wrongMidi = [],
  rootPitchClass,
  showLabels = false,
  accidental = 'sharp',
  disabled = false,
  onSelect,
}: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const keys = useMemo(() => pianoRange(startMidi, endMidi), [startMidi, endMidi])
  const whiteKeys = keys.filter((midi) => !isBlackPianoMidi(midi))
  const active = new Set(activeMidi)
  const legal = new Set(legalMidi)
  const correct = new Set(correctMidi)
  const wrong = new Set(wrongMidi)
  const restricted = legalMidi.length > 0

  useEffect(() => {
    if (!activeMidi.length || !scrollRef.current) return
    scrollRef.current
      .querySelector<HTMLElement>(`[data-midi="${activeMidi[activeMidi.length - 1]}"]`)
      ?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [activeMidi])

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (disabled || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
      const offset = KEYBOARD_MAP[event.key.toLowerCase()]
      if (offset === undefined || startMidi + offset > endMidi) return
      event.preventDefault()
      const midi = startMidi + offset
      onSelect?.({ midi, pitchClass: midi % 12, note: midiToNoteName(midi, accidental) })
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [accidental, disabled, endMidi, onSelect, startMidi])

  return (
    <section
      className="game-piano"
      aria-label={`Piano keyboard ${midiToNoteName(startMidi)} through ${midiToNoteName(endMidi)}`}
    >
      <div className="game-piano__scroll" ref={scrollRef}>
        <div className="game-piano__keys" style={{ '--white-keys': whiteKeys.length } as React.CSSProperties}>
          {keys.map((midi) => {
            const black = isBlackPianoMidi(midi)
            const precedingWhites = keys.filter((candidate) => candidate < midi && !isBlackPianoMidi(candidate)).length
            const pitchClass = midi % 12
            const note = midiToNoteName(midi, accidental)
            return (
              <button
                type="button"
                key={midi}
                data-midi={midi}
                className={`game-piano__key ${black ? 'is-black' : 'is-white'} ${active.has(midi) ? 'is-active' : ''} ${legal.has(midi) ? 'is-legal' : ''} ${correct.has(midi) ? 'is-correct' : ''} ${wrong.has(midi) ? 'is-wrong' : ''} ${rootPitchClass === pitchClass ? 'is-root' : ''}`}
                style={black ? ({ '--white-before': precedingWhites } as React.CSSProperties) : undefined}
                aria-label={`${note}${legal.has(midi) ? ', legal destination' : ''}`}
                aria-pressed={active.has(midi) || correct.has(midi) || wrong.has(midi)}
                disabled={disabled || (restricted && !legal.has(midi))}
                onClick={() => onSelect?.({ midi, pitchClass, note })}
              >
                {showLabels && <span>{midiToNoteName(midi, accidental, false)}</span>}
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default React.memo(GamePianoKeyboard)
