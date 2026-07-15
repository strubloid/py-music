# Chord Learning

## Purpose And Outcome

`/learn/chords` lets a learner inspect chord tones, qualities, guitar variations, and piano voicings. It supports ear training and songwriting but is not itself an assessed reward screen.

## Flow

The learner selects a chromatic root and quality, views a guitar or piano representation, and may select a CAGED/display variation. A musical learning extension must let the learner hear, locate, build, or compare chord tones rather than merely recognize a printed symbol.

## Ownership

| Area | Files |
| --- | --- |
| route/page | `frontend/src/pages/learn/ChordsPage.tsx` |
| display shapes/variations | `frontend/src/services/ChordDataService.ts`, `comprehensive_chords.json` |
| chord diagram | `frontend/src/components/common/ChordDiagram.tsx` |
| instrument display preference | `frontend/src/contexts/ChordDisplayContext.tsx` |
| assessed chord authority | `data/chord_inventory.json`, backend chord inventory adapter |

## Rules

- Display fingerings and canonical ear-training chords are separate datasets with separate authority.
- A quality exercise shows/hears actual tones; the printed suffix cannot be its own evidence.
- Comparisons render both chords simultaneously and identify changed degrees/common tones after the attempt.
- CAGED, barre, sus, inversion, and tuning concepts are demonstrated through physical/audible consequence, not definition recall.
- Open/drop voicings require explicit canonical metadata before assessment.

## Tests And Boundaries

Test data normalization, chord tones, variation switching, piano/fretboard representation, and comparison accessibility. The current page has no dedicated browser test and no page-level audio/persistence; new work must add coverage before claiming those capabilities.
