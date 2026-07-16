import React, { useMemo, useState } from 'react'
import PianoKeyboard from '../../../components/PianoKeyboard/PianoKeyboard'
import GuitarFretboard from '../../../components/GuitarFretboard/GuitarFretboard'

type ScaleChallengeInstrumentsProps = {
  root: string
  steps: string[]
}

const SHARP_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const FLAT_TO_SHARP: Record<string, string> = { Db: 'C#', Eb: 'D#', Gb: 'F#', Ab: 'G#', Bb: 'A#' }
const TUNING = ['E', 'B', 'G', 'D', 'A', 'E']
const BLACK_KEYS = [
  { after_natural: 0 },
  { after_natural: 1 },
  { after_natural: 3 },
  { after_natural: 4 },
  { after_natural: 5 },
]

const ScaleChallengeInstruments = ({ root, steps }: ScaleChallengeInstrumentsProps) => {
  const [instrument, setInstrument] = useState<'piano' | 'guitar'>('piano')
  const scaleData = useMemo(() => {
    const normalizedRoot = FLAT_TO_SHARP[root] || root
    const rootIndex = Math.max(0, SHARP_NOTES.indexOf(normalizedRoot))
    const scaleNotes = steps.reduce<string[]>(
      (notes, step) => {
        const previousIndex = SHARP_NOTES.indexOf(notes[notes.length - 1])
        notes.push(SHARP_NOTES[(previousIndex + (step === 'W' ? 2 : 1)) % 12])
        return notes
      },
      [normalizedRoot],
    )
    const fretboardData = TUNING.map((string) => {
      const stringIndex = SHARP_NOTES.indexOf(string)
      return {
        string,
        frets: Array.from({ length: 13 }, (_, fret) => {
          const note = SHARP_NOTES[(stringIndex + fret) % 12]
          return { fret, note, is_scale_note: scaleNotes.includes(note), is_root: note === normalizedRoot }
        }),
      }
    })
    return {
      keyboardData: {
        natural_keys: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
        black_keys: BLACK_KEYS,
        scale_notes: scaleNotes,
        root_note: normalizedRoot,
      },
      fretboardData,
      scaleNotes,
      rootIndex,
    }
  }, [root, steps])

  return (
    <section className="scale-challenge-preview" aria-label={`${root} scale shape preview`}>
      <header>
        <div>
          <span>Scale shape</span>
          <strong>{root} root highlighted in gold</strong>
        </div>
        <div className="scale-challenge-preview__tabs" role="tablist" aria-label="Scale shape instrument">
          <button
            type="button"
            role="tab"
            aria-selected={instrument === 'piano'}
            className={instrument === 'piano' ? 'is-active' : ''}
            onClick={() => setInstrument('piano')}
          >
            Piano
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={instrument === 'guitar'}
            className={instrument === 'guitar' ? 'is-active' : ''}
            onClick={() => setInstrument('guitar')}
          >
            Fretboard
          </button>
        </div>
      </header>
      {instrument === 'piano' ? (
        <PianoKeyboard keyboardData={scaleData.keyboardData} />
      ) : (
        <GuitarFretboard fretboardData={scaleData.fretboardData} fretCount={12} />
      )}
    </section>
  )
}

export default ScaleChallengeInstruments
