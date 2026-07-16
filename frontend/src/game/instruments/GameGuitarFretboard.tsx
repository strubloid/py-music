import React, { useMemo } from 'react'
import { guitarMidiAt, midiToNoteName, STANDARD_GUITAR_MIDI, type AccidentalPreference } from './musicMath'
import './game-instruments.scss'

export type InstrumentSelection = {
  midi: number
  pitchClass: number
  note: string
  stringIndex?: number
  fret?: number
}

type FretPosition = { stringIndex: number; fret: number }

type Props = {
  activeMidi?: number[]
  legalMidi?: number[]
  correctMidi?: number[]
  wrongMidi?: number[]
  activePositions?: FretPosition[]
  legalPositions?: FretPosition[]
  correctPositions?: FretPosition[]
  wrongPositions?: FretPosition[]
  rootPitchClass?: number
  fretCount?: number
  leftHanded?: boolean
  showLabels?: boolean
  accidental?: AccidentalPreference
  disabled?: boolean
  onSelect?: (selection: InstrumentSelection) => void
}

const MARKERS = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24]

const GameGuitarFretboard = ({
  activeMidi = [],
  legalMidi = [],
  correctMidi = [],
  wrongMidi = [],
  activePositions = [],
  legalPositions = [],
  correctPositions = [],
  wrongPositions = [],
  rootPitchClass,
  fretCount = 24,
  leftHanded = false,
  showLabels = false,
  accidental = 'sharp',
  disabled = false,
  onSelect,
}: Props) => {
  const strings = useMemo(() => STANDARD_GUITAR_MIDI.map((openMidi, stringIndex) => ({ openMidi, stringIndex })), [])
  const active = new Set(activeMidi)
  const legal = new Set(legalMidi)
  const correct = new Set(correctMidi)
  const wrong = new Set(wrongMidi)
  const positionKey = (stringIndex: number, fret: number) => `${stringIndex}:${fret}`
  const activePositionKeys = new Set(
    activePositions.map((position) => positionKey(position.stringIndex, position.fret)),
  )
  const legalPositionKeys = new Set(legalPositions.map((position) => positionKey(position.stringIndex, position.fret)))
  const correctPositionKeys = new Set(
    correctPositions.map((position) => positionKey(position.stringIndex, position.fret)),
  )
  const wrongPositionKeys = new Set(wrongPositions.map((position) => positionKey(position.stringIndex, position.fret)))
  const restrictByPosition = legalPositions.length > 0
  const restricted = restrictByPosition || legalMidi.length > 0
  return (
    <section className={`game-fretboard ${leftHanded ? 'is-left-handed' : ''}`} aria-label="Guitar fretboard">
      <div className="game-fretboard__overview" aria-hidden="true">
        <span style={{ width: `${Math.min(100, ((Math.max(...activeMidi, 0) - 40) / 48) * 100)}%` }} />
      </div>
      <div className="game-fretboard__scroll">
        <div className="game-fretboard__neck" style={{ '--frets': fretCount + 1 } as React.CSSProperties}>
          <div className="game-fretboard__markers" aria-hidden="true">
            {MARKERS.filter((fret) => fret <= fretCount).map((fret) => (
              <i
                key={fret}
                className={fret === 12 ? 'double' : ''}
                style={{ '--marker-fret': fret } as React.CSSProperties}
              />
            ))}
          </div>
          {strings
            .slice()
            .reverse()
            .map(({ stringIndex }) => (
              <div
                className="game-fretboard__string"
                key={stringIndex}
                style={{ '--string': stringIndex } as React.CSSProperties}
              >
                {Array.from({ length: fretCount + 1 }, (_, fret) => {
                  const midi = guitarMidiAt(stringIndex, fret)
                  const pitchClass = midi % 12
                  const note = midiToNoteName(midi, accidental)
                  const key = positionKey(stringIndex, fret)
                  const isActive = activePositionKeys.has(key) || active.has(midi)
                  const isLegal = restrictByPosition ? legalPositionKeys.has(key) : legal.has(midi)
                  const isCorrect = correctPositionKeys.has(key) || (!correctPositions.length && correct.has(midi))
                  const isWrong = wrongPositionKeys.has(key) || (!wrongPositions.length && wrong.has(midi))
                  const isRoot = rootPitchClass === pitchClass
                  return (
                    <button
                      type="button"
                      key={fret}
                      className={`game-fretboard__note ${isActive ? 'is-active' : ''} ${isLegal ? 'is-legal' : ''} ${isCorrect ? 'is-correct' : ''} ${isWrong ? 'is-wrong' : ''} ${isRoot ? 'is-root' : ''}`}
                      aria-label={`String ${6 - stringIndex}, fret ${fret}, ${note}${isLegal ? ', legal destination' : ''}`}
                      aria-pressed={isActive || isCorrect || isWrong}
                      disabled={disabled || (restricted && !isLegal)}
                      onClick={() => onSelect?.({ midi, pitchClass, note, stringIndex, fret })}
                    >
                      {showLabels && (isLegal || isActive || isCorrect || isWrong || isRoot) && (
                        <span>{midiToNoteName(midi, accidental, false)}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
        </div>
      </div>
    </section>
  )
}

export default React.memo(GameGuitarFretboard)
