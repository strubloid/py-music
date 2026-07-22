// Scale Lab candidate analysis — identifies compatible scale families from placed notes

import type { ScaleLabCandidate } from '../state/scaleLabReducer'

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

// Mode interval patterns (semitones from root)
const MODE_PATTERNS: Record<string, { intervals: number[]; name: string }> = {
  ionian: { intervals: [0, 2, 4, 5, 7, 9, 11], name: 'Ionian (Major)' },
  dorian: { intervals: [0, 2, 3, 5, 7, 9, 10], name: 'Dorian' },
  phrygian: { intervals: [0, 1, 3, 5, 7, 8, 10], name: 'Phrygian' },
  lydian: { intervals: [0, 2, 4, 6, 7, 9, 11], name: 'Lydian' },
  mixolydian: { intervals: [0, 2, 4, 5, 7, 9, 10], name: 'Mixolydian' },
  aeolian: { intervals: [0, 2, 3, 5, 7, 8, 10], name: 'Aeolian (Minor)' },
  locrian: { intervals: [0, 1, 3, 5, 6, 8, 10], name: 'Locrian' },
}

export function notePitchClass(note: string): number {
  const name = note.replace(/\d/g, '').toUpperCase()
  return NOTE_NAMES.indexOf(name)
}

export function analyzeCandidates(placedNotes: Array<{ note: string }>, targetMode?: string): ScaleLabCandidate[] {
  if (placedNotes.length === 0) return []

  const placedPitches = placedNotes.map((n) => notePitchClass(n.note) % 12)

  // Find which modes are compatible with the placed notes
  const candidates: ScaleLabCandidate[] = []

  for (const [modeKey, { intervals, name }] of Object.entries(MODE_PATTERNS)) {
    // Check each possible root that would make these notes fit this mode
    for (const rootPitch of NOTE_NAMES.map((_, i) => i)) {
      const scalePitches = intervals.map((i) => (rootPitch + i) % 12)

      // Count how many placed notes match this scale
      let matchCount = 0
      const missingPitchClasses: number[] = []
      const extraPitchClasses: number[] = []

      for (const pp of placedPitches) {
        if (scalePitches.includes(pp)) {
          matchCount++
        } else {
          extraPitchClasses.push(pp)
        }
      }

      // Only include if at least 3 notes match and no more than 2 extra
      if (matchCount >= 3 && extraPitchClasses.length <= 2) {
        const missing = scalePitches.filter((sp) => !placedPitches.includes(sp))
        candidates.push({
          modeKey,
          modeName: name,
          matchCount,
          missingPitchClasses: missing,
          extraPitchClasses: extraPitchClasses.filter((e) => !missing.includes(e)),
        })
      }
    }
  }

  // Sort by match count descending
  candidates.sort((a, b) => b.matchCount - a.matchCount)

  // Deduplicate by mode+root pair (keep highest match count)
  const seen = new Set<string>()
  const deduped = candidates.filter((c) => {
    const key = c.modeKey
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return deduped.slice(0, 4)
}

export function getNoteNameFromPitch(pitch: number): string {
  return NOTE_NAMES[pitch % 12]
}

export function getMissingNotes(missingPitchClasses: number[], rootPitch: number): string[] {
  return missingPitchClasses.map((p) => {
    const diff = (((p - rootPitch) % 12) + 12) % 12
    const degree = ['', 'R', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7'][diff] ?? ''
    return `${getNoteNameFromPitch(p)} (${degree})`
  })
}
