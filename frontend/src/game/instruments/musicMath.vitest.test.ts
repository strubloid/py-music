import { describe, expect, it } from 'vitest'
import { guitarMidiAt, isBlackPianoMidi, midiToNoteName, pianoRange, STANDARD_GUITAR_MIDI } from './musicMath'

describe('shared instrument music math', () => {
  it('calculates standard guitar pitches exactly through fret 24', () => {
    expect(STANDARD_GUITAR_MIDI.map((midi) => midiToNoteName(midi))).toEqual(['E2', 'A2', 'D3', 'G3', 'B3', 'E4'])
    for (let stringIndex = 0; stringIndex < STANDARD_GUITAR_MIDI.length; stringIndex += 1) {
      for (let fret = 0; fret <= 24; fret += 1) {
        expect(guitarMidiAt(stringIndex, fret)).toBe(STANDARD_GUITAR_MIDI[stringIndex] + fret)
      }
      expect(midiToNoteName(guitarMidiAt(stringIndex, 12), 'sharp', false)).toBe(
        midiToNoteName(STANDARD_GUITAR_MIDI[stringIndex], 'sharp', false),
      )
    }
  })

  it('spells the same pitch contextually with sharps or flats', () => {
    expect(midiToNoteName(61, 'sharp')).toBe('C#4')
    expect(midiToNoteName(61, 'flat')).toBe('Db4')
    expect(midiToNoteName(70, 'flat')).toBe('Bb4')
  })

  it('keeps piano ranges stable from C through C with correct black-key grouping', () => {
    const keys = pianoRange(48, 72)
    expect(keys).toHaveLength(25)
    expect(midiToNoteName(keys[0])).toBe('C3')
    expect(midiToNoteName(keys.at(-1) || 0)).toBe('C5')
    expect(keys.filter(isBlackPianoMidi).map((midi) => midi % 12)).toEqual([1, 3, 6, 8, 10, 1, 3, 6, 8, 10])
  })

  it('rejects instrument ranges that violate physical constraints', () => {
    expect(() => guitarMidiAt(-1, 0)).toThrow(RangeError)
    expect(() => guitarMidiAt(0, 25)).toThrow(RangeError)
    expect(() => pianoRange(49, 72)).toThrow(RangeError)
  })
})
