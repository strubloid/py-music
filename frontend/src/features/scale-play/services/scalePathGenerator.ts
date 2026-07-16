// Deterministic Tier-1 fragment generator for Scale Path.
// Generates one-gap, two-candidate fragments in major/ionian or minor/aeolian.

import type { ScalePathFragment, ScalePathPosition } from '../state/scalePathReducer'

// Guitar standard tuning (string index 0 = high E, 5 = low E)
export const GUITAR_TUNING: Array<{ note: string; pitch: number }> = [
  { note: 'E', pitch: 4 }, // string 1 (high E)
  { note: 'B', pitch: 11 },
  { note: 'G', pitch: 7 },
  { note: 'D', pitch: 2 },
  { note: 'A', pitch: 9 },
  { note: 'E', pitch: 4 }, // string 6 (low E) — same pitch class, lower octave
]

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export function noteToPitch(note: string): number {
  const name = note.replace('#', '').toUpperCase()
  const isSharp = note.includes('#')
  const base = NOTE_NAMES.indexOf(name)
  return isSharp && base >= 0 ? base : base
}

// Mode interval patterns (semitones from root)
const MODE_PATTERNS: Record<string, number[]> = {
  ionian: [0, 2, 4, 5, 7, 9, 11],
  aeolian: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  locrian: [0, 1, 3, 5, 6, 8, 10],
}

export function getScalePositions(rootPitch: number, mode: string, maxFret: number): ScalePathPosition[] {
  const intervals = MODE_PATTERNS[mode] ?? MODE_PATTERNS.ionian
  const scalePitches = intervals.map((i) => (rootPitch + i) % 12)

  const positions: ScalePathPosition[] = []
  for (let si = 0; si < GUITAR_TUNING.length; si++) {
    const { note: openNote, pitch: openPitch } = GUITAR_TUNING[si]
    for (let fret = 0; fret <= maxFret; fret++) {
      const posPitch = (openPitch + fret) % 12
      const matching = scalePitches.indexOf(posPitch)
      if (matching >= 0) {
        const degree = intervals[matching]
        positions.push({
          string: openNote,
          fret,
          note: NOTE_NAMES[posPitch],
          stringIndex: si,
          pitch: posPitch,
        })
      }
    }
  }
  return positions
}

export function candidateId(pos: ScalePathPosition): string {
  return `${pos.string}-${pos.fret}`
}

export function generateTier1Fragment(
  positions: ScalePathPosition[],
  rootPitch: number,
  mode: string,
  seed = 0,
): ScalePathFragment | null {
  if (positions.length < 5) return null

  // Filter positions with enough room for suffix + gap
  const eligible = positions.filter((p) => p.fret >= 2 && p.stringIndex <= 4)
  if (eligible.length < 4) {
    // Fallback: use any positions
    return generateFromAvailable(positions, seed)
  }

  // Deterministic selection using seed
  const step = Math.max(1, Math.floor(eligible.length / 5))
  const anchorIdx = (seed * step) % eligible.length
  const anchor = eligible[anchorIdx]
  const anchorRawIdx = positions.indexOf(anchor)

  // suffix: next 3 positions after anchor
  const suffix = positions.slice(anchorRawIdx + 1, anchorRawIdx + 4)

  // gap: the next valid position
  const gapCandidates = positions.slice(anchorRawIdx + 4, anchorRawIdx + 7)
  const gap = gapCandidates[0] ?? positions[anchorRawIdx + 1] ?? null

  if (!gap) return null

  // Build two candidates: correct + one wrong
  const wrongOnSameString = positions.find(
    (p) => p.string === gap.string && p.fret !== gap.fret && p.fret <= 12 && Math.abs(p.fret - gap.fret) >= 2,
  )
  const wrong = wrongOnSameString ?? positions.find((p) => p.stringIndex === gap.stringIndex - 1 && p !== gap) ?? null

  const candidates: Array<ScalePathPosition & { isCorrect: boolean }> = [{ ...gap, isCorrect: true }]
  if (wrong) candidates.push({ ...wrong, isCorrect: false })

  // Shuffle deterministically
  if (seed % 2 === 0 && candidates.length === 2) {
    candidates.reverse()
  }

  // Direction: same string = left, adjacent string = up
  const direction: 'left' | 'up' = gap.string === anchor.string ? 'left' : 'up'

  // Degree clue
  const degreeName = getDegreeName(gap.pitch, rootPitch, mode)

  return {
    fragmentIndex: seed,
    root: NOTE_NAMES[rootPitch],
    mode,
    difficulty: 1,
    anchor,
    suffix,
    gap,
    candidates,
    direction,
    degreeClue: degreeName,
  }
}

function generateFromAvailable(positions: ScalePathPosition[], seed: number): ScalePathFragment | null {
  if (positions.length < 3) return null
  const idx = seed % Math.max(1, positions.length - 2)
  const anchor = positions[idx]
  const suffix = positions.slice(idx + 1, idx + 3)
  const gap = positions[idx + 3] ?? positions[idx + 2] ?? null
  if (!gap) return null

  const wrong = positions.find((p) => p !== gap && Math.abs(p.fret - gap.fret) > 1)

  return {
    fragmentIndex: seed,
    root: NOTE_NAMES[positions[0]?.pitch ?? 0],
    mode: 'ionian',
    difficulty: 1,
    anchor,
    suffix,
    gap,
    candidates: [{ ...gap, isCorrect: true }, ...(wrong ? [{ ...wrong, isCorrect: false }] : [])],
    direction: 'left',
    degreeClue: '?',
  }
}

function getDegreeName(gapPitch: number, rootPitch: number, mode: string): string {
  const intervals = MODE_PATTERNS[mode] ?? MODE_PATTERNS.ionian
  const diff = (((gapPitch - rootPitch) % 12) + 12) % 12
  const degreeIdx = intervals.indexOf(diff)
  if (degreeIdx < 0) return '?'
  const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']
  const degree = romanNumerals[degreeIdx]
  return diff > 6 ? `b${degree}` : degree
}
