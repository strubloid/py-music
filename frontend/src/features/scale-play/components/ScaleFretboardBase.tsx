// Interactive guitar fretboard base — shared by Scale Path and Scale Lab
// Distinct from the display-only GuitarFretboard component.

import React, { useCallback, useEffect, useRef } from 'react'
import '../styles/scale-fretboard.scss'

export interface FretboardPosition {
  string: string
  fret: number
  note: string
  stringIndex: number
  pitch: number
}

export type FretCellState =
  | 'default'
  | 'scale-note'
  | 'root'
  | 'candidate'
  | 'candidate-selected'
  | 'correct'
  | 'incorrect'
  | 'placed'
  | 'missing'
  | 'non-target'

interface ScaleFretboardBaseProps {
  fretCount: number
  positions: FretboardPosition[]
  // Visible note sets
  rootNote?: string
  scaleNotes?: FretboardPosition[]
  revealedNotes?: FretboardPosition[]
  eligibleCandidates?: FretboardPosition[]
  selectedCandidate?: FretboardPosition | null
  committedAnswer?: FretboardPosition | null
  correctAnswer?: FretboardPosition | null
  // Lab-specific
  placedNotes?: FretboardPosition[]
  missingNotes?: FretboardPosition[]
  nonTargetNotes?: FretboardPosition[]
  // Lab target
  targetMode?: string
  targetRoot?: string
  // Interaction
  selectedIndex?: number | null
  onPositionSelect?: (pos: FretboardPosition, index: number) => void
  onCommit?: (pos: FretboardPosition) => void
  // Keyboard
  onMoveLeft?: () => void
  onMoveRight?: () => void
  onCommitKey?: () => void
  focusIndex?: number | null
  // Visual
  reducedMotion?: boolean
  compact?: boolean
  children?: React.ReactNode
}

const STRING_ORDER = [0, 1, 2, 3, 4, 5] // high E to low E

const FretCell: React.FC<{
  pos: FretboardPosition
  state: FretCellState
  isFocused: boolean
  isRoot: boolean
  onSelect: () => void
  onCommit: () => void
  label: string
  reducedMotion: boolean
  compact: boolean
}> = ({ pos, state, isFocused, isRoot, onSelect, onCommit, label, reducedMotion, compact }) => {
  const classNames = [
    'sf-cell',
    `sf-cell--${state}`,
    isFocused ? 'sf-cell--focused' : '',
    isRoot ? 'sf-cell--root' : '',
    reducedMotion ? 'sf-cell--reduced' : '',
    compact ? 'sf-cell--compact' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type="button"
      className={classNames}
      onClick={onSelect}
      onDoubleClick={state === 'candidate' || state === 'placed' ? onCommit : undefined}
      aria-label={label}
      aria-pressed={state === 'candidate-selected' || state === 'placed'}
      data-string={pos.string}
      data-fret={pos.fret}
      title={label}
    >
      {pos.note && !compact && <span className="sf-cell__note">{pos.note}</span>}
      {isRoot && <span className="sf-cell__root-ring" aria-hidden="true" />}
    </button>
  )
}

const ScaleFretboardBase: React.FC<ScaleFretboardBaseProps> = ({
  fretCount,
  positions,
  rootNote,
  revealedNotes = [],
  eligibleCandidates = [],
  selectedCandidate,
  committedAnswer,
  correctAnswer,
  placedNotes = [],
  missingNotes = [],
  nonTargetNotes = [],
  selectedIndex = null,
  onPositionSelect,
  onCommit,
  onMoveLeft,
  onMoveRight,
  onCommitKey,
  focusIndex = null,
  reducedMotion = false,
  compact = false,
  children,
}) => {
  const boardRef = useRef<HTMLDivElement>(null)

  const positionKey = (pos: FretboardPosition) => `${pos.string}-${pos.fret}`

  const posMap = new Map(positions.map((p) => [positionKey(p), p]))

  const revealedSet = new Set(revealedNotes.map(positionKey))
  const eligibleSet = new Set(eligibleCandidates.map(positionKey))
  const placedSet = new Set(placedNotes.map(positionKey))
  const missingSet = new Set(missingNotes.map(positionKey))
  const nonTargetSet = new Set(nonTargetNotes.map(positionKey))
  const committedKey = committedAnswer ? positionKey(committedAnswer) : null
  const correctKey = correctAnswer ? positionKey(correctAnswer) : null
  const selectedKey = selectedCandidate ? positionKey(selectedCandidate) : null

  // Build a flat list of eligible positions for keyboard nav
  const eligibleList = eligibleCandidates

  const handleCellSelect = useCallback(
    (pos: FretboardPosition, idx: number) => {
      onPositionSelect?.(pos, idx)
    },
    [onPositionSelect],
  )

  // Keyboard handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault()
        onMoveLeft?.()
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault()
        onMoveRight?.()
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onCommitKey?.()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onMoveLeft, onMoveRight, onCommitKey])

  const getCellState = (pos: FretboardPosition): FretCellState => {
    const key = positionKey(pos)
    if (committedKey === key) return correctKey === key ? 'correct' : 'incorrect'
    if (selectedKey === key) return 'candidate-selected'
    if (eligibleSet.has(key)) return 'candidate'
    if (placedSet.has(key)) return 'placed'
    if (missingSet.has(key)) return 'missing'
    if (nonTargetSet.has(key)) return 'non-target'
    if (revealedSet.has(key)) return 'scale-note'
    return 'default'
  }

  const getCellLabel = (pos: FretboardPosition, idx: number): string => {
    const state = getCellState(pos)
    const stateLabels: Record<FretCellState, string> = {
      default: '',
      'scale-note': 'scale note',
      root: 'root note',
      candidate: 'candidate',
      'candidate-selected': 'selected',
      correct: 'correct',
      incorrect: 'incorrect',
      placed: 'placed',
      missing: 'missing',
      'non-target': 'not in target scale',
    }
    return `String ${pos.string}, fret ${pos.fret}, ${pos.note}. ${stateLabels[state]}.`
  }

  return (
    <div
      className={`scale-fretboard ${reducedMotion ? 'scale-fretboard--reduced' : ''} ${compact ? 'scale-fretboard--compact' : ''}`}
    >
      <div className="scale-fretboard__scroll" ref={boardRef}>
        <div className="sf-board" style={{ '--fret-count': fretCount + 1 } as React.CSSProperties}>
          {/* Fret number headers */}
          <div className="sf-headers" aria-hidden="true">
            <div className="sf-header sf-header--string" />
            {Array.from({ length: fretCount + 1 }, (_, i) => (
              <div key={i} className="sf-header">
                {i}
              </div>
            ))}
          </div>

          {/* Strings */}
          {STRING_ORDER.map((stringIdx) => {
            const stringPositions = positions.filter((p) => p.stringIndex === stringIdx)
            return (
              <div key={stringIdx} className="sf-string" role="presentation">
                <div className="sf-string__label" aria-hidden="true">
                  {stringIdx === 0
                    ? 'E'
                    : stringIdx === 1
                      ? 'B'
                      : stringIdx === 2
                        ? 'G'
                        : stringIdx === 3
                          ? 'D'
                          : stringIdx === 4
                            ? 'A'
                            : 'e'}
                </div>
                <div className="sf-string__frets">
                  {Array.from({ length: fretCount + 1 }, (_, fretIdx) => {
                    const pos = stringPositions.find((p) => p.fret === fretIdx)
                    if (!pos) {
                      return (
                        <div key={fretIdx} className="sf-fret-empty">
                          {fretIdx > 0 && <div className="sf-wire" />}
                        </div>
                      )
                    }
                    const idx = eligibleList.findIndex((ep) => positionKey(ep) === positionKey(pos))
                    const isFocused = idx === focusIndex
                    const isRoot = pos.note === rootNote && revealedSet.has(positionKey(pos))
                    return (
                      <div key={fretIdx} className="sf-fret-cell">
                        {fretIdx > 0 && <div className="sf-wire" />}
                        <FretCell
                          pos={pos}
                          state={getCellState(pos)}
                          isFocused={isFocused}
                          isRoot={isRoot}
                          onSelect={() => handleCellSelect(pos, idx >= 0 ? idx : 0)}
                          onCommit={() => onCommit?.(pos)}
                          label={getCellLabel(pos, idx)}
                          reducedMotion={reducedMotion}
                          compact={compact}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Fret markers */}
          <div className="sf-markers" aria-hidden="true">
            {[3, 5, 7, 9, 12, 15, 17, 19, 21].map((fret) =>
              fret <= fretCount ? (
                <div
                  key={fret}
                  className={`sf-marker ${fret === 12 ? 'sf-marker--double' : ''}`}
                  style={{
                    left: `calc(${(fret / (fretCount + 1)) * 100}% + 24px)`,
                  }}
                />
              ) : null,
            )}
          </div>
        </div>
      </div>

      {children && <div className="scale-fretboard__extras">{children}</div>}
    </div>
  )
}

export default ScaleFretboardBase
