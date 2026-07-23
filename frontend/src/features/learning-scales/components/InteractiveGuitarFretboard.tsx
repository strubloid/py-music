// Interactive variant of the base GuitarFretboard.
// Reuses the base component's CSS classes so visual changes in
// frontend/src/components/GuitarFretboard/GuitarFretboard.scss propagate
// here automatically. Renders <button> elements that fire onSelect.

import React, { useEffect, useRef, useState } from 'react'
import '../../../components/GuitarFretboard/GuitarFretboard.scss'
import { MAX_FRETS, MIN_FRET_COUNT } from '../../../config/musicConfig'

export interface InteractiveFretboardSelection {
  string: string
  stringIndex: number
  fret: number
  note: string
  pitch: number
  isScaleNote: boolean
  isRoot: boolean
}

type StateClass =
  | 'pk-key-active'
  | 'pk-key-match'
  | 'pk-key-miss'
  | 'pk-key-correct'
  | 'pk-key-wrong'
  | 'pk-key-hint'
  | 'pk-key-legal'
  | 'pk-key-start'

type FretKey = { string?: string; stringIndex?: number; fret: number }

type Props = {
  fretboardData: Array<{
    string: string
    frets: Array<{
      fret: number
      note: string
      is_scale_note: boolean
      is_root: boolean
    }>
  }>
  fretCount?: number
  selectedKeys?: FretKey[]
  matchedKeys?: FretKey[]
  missedKeys?: FretKey[]
  correctKeys?: FretKey[]
  wrongKeys?: FretKey[]
  hintKeys?: FretKey[]
  legalKeys?: FretKey[]
  startKeys?: FretKey[]
  showLabels?: boolean
  disabled?: boolean
  onSelect?: (selection: InteractiveFretboardSelection) => void
  ariaLabel?: string
}

const InteractiveGuitarFretboard = ({
  fretboardData,
  fretCount: fretCountProp = 12,
  selectedKeys = [],
  matchedKeys = [],
  missedKeys = [],
  correctKeys = [],
  wrongKeys = [],
  hintKeys = [],
  legalKeys = [],
  startKeys = [],
  showLabels = true,
  disabled = false,
  onSelect,
  ariaLabel = 'Interactive guitar fretboard',
}: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const fretCount = Math.max(MIN_FRET_COUNT, Math.min(MAX_FRETS, fretCountProp))

  // The base display component computes note states from is_scale_note /
  // is_root; the interactive variant additionally tracks selection /
  // correctness / hint keys to extend the base CSS.
  const keyFor = (key: FretKey) => `${key.stringIndex ?? key.string}-${key.fret}`
  const selectedSet = new Set(selectedKeys.map(keyFor))
  const matchedSet = new Set(matchedKeys.map(keyFor))
  const missedSet = new Set(missedKeys.map(keyFor))
  const correctSet = new Set(correctKeys.map(keyFor))
  const wrongSet = new Set(wrongKeys.map(keyFor))
  const hintSet = new Set(hintKeys.map(keyFor))
  const legalSet = new Set(legalKeys.map(keyFor))
  const startSet = new Set(startKeys.map(keyFor))

  const [scrollState, setScrollState] = useState({ left: false, right: true, showStringNames: true })

  useEffect(() => {
    const handleScroll = () => {
      const element = scrollRef.current
      if (!element) return
      const scrollPos = element.scrollLeft
      const isScrolledLeft = scrollPos > 10
      const isScrolledRight = scrollPos < element.scrollWidth - element.clientWidth - 10
      setScrollState({
        left: isScrolledLeft,
        right: isScrolledRight,
        showStringNames: scrollPos < 50 || scrollPos > 150,
      })
    }
    const element = scrollRef.current
    if (element) {
      element.addEventListener('scroll', handleScroll)
      setTimeout(handleScroll, 100)
      return () => element.removeEventListener('scroll', handleScroll)
    }
    return undefined
  }, [fretCount])

  const stateForKey = (string: string, stringIndex: number, fret: number): StateClass | null => {
    const indexedKey = `${stringIndex}-${fret}`
    const namedKey = `${string}-${fret}`
    const has = (set: Set<string>) => set.has(indexedKey) || set.has(namedKey)
    if (has(startSet)) return 'pk-key-start'
    if (has(correctSet)) return 'pk-key-correct'
    if (has(wrongSet)) return 'pk-key-wrong'
    if (has(matchedSet)) return 'pk-key-match'
    if (has(missedSet)) return 'pk-key-miss'
    if (has(selectedSet)) return 'pk-key-active'
    if (has(hintSet)) return 'pk-key-hint'
    if (has(legalSet)) return 'pk-key-legal'
    return null
  }

  const isLegalKey = (string: string, stringIndex: number, fret: number) =>
    legalSet.has(`${stringIndex}-${fret}`) || legalSet.has(`${string}-${fret}`)

  const handleSelect = (
    stringData: {
      string: string
      frets: Array<{ fret: number; note: string; is_scale_note: boolean; is_root: boolean }>
    },
    stringIndex: number,
    fret: number,
  ) => {
    if (disabled || !onSelect) return
    const fretData = stringData.frets[fret]
    if (!fretData) return
    onSelect({
      string: stringData.string,
      stringIndex,
      fret,
      note: fretData.note,
      pitch: fretData.note
        ? ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].indexOf(fretData.note)
        : 0,
      isScaleNote: fretData.is_scale_note,
      isRoot: fretData.is_root,
    })
  }

  return (
    <div className="fretboard-container">
      <div className="fretboard-wrapper">
        <div
          ref={scrollRef}
          className={`fretboard-scroll ${scrollState.left ? 'scrolled-left' : ''} ${
            !scrollState.right ? 'scrolled-right' : ''
          } ${scrollState.showStringNames ? 'show-string-names' : 'hide-string-names'}`}
          role="group"
          aria-label={ariaLabel}
        >
          <div className="fretboard-content" style={{ '--fret-cells': fretCount + 1 } as React.CSSProperties}>
            {/* Fret number headers */}
            <div className="fret-headers" aria-hidden="true">
              <div className="string-label-header" />
              {Array.from({ length: fretCount + 1 }, (_, i) => (
                <div key={i} className="fret-number">
                  {i}
                </div>
              ))}
            </div>

            {/* Strings */}
            <div className="strings-container">
              {fretboardData.map((stringData, stringIndex) => (
                <div key={stringIndex} className="guitar-string">
                  <div className="string-name" aria-hidden="true">
                    {stringData.string}
                  </div>
                  <div className="frets-row">
                    {stringData.frets.slice(0, fretCount + 1).map((fret, fretIndex) => {
                      const state = stateForKey(stringData.string, stringIndex, fret.fret)
                      const isLegal = isLegalKey(stringData.string, stringIndex, fret.fret)
                      const showDot = fret.is_scale_note || state !== null
                      const baseDotClass = fret.is_root ? 'root-note' : fret.is_scale_note ? 'scale-note' : ''
                      return (
                        <button
                          type="button"
                          key={fretIndex}
                          className={`fret-cell pk-fret-button ${state ?? ''}`.trim()}
                          aria-label={`String ${stringData.string}, fret ${fret.fret}, ${fret.note}${
                            fret.is_root ? ', root note' : fret.is_scale_note ? ', scale note' : ''
                          }${isLegal ? ', legal destination' : ''}`}
                          aria-pressed={
                            state === 'pk-key-active' ||
                            state === 'pk-key-match' ||
                            state === 'pk-key-miss' ||
                            state === 'pk-key-correct' ||
                            state === 'pk-key-wrong'
                          }
                          disabled={disabled || (legalKeys.length > 0 && !isLegal)}
                          onClick={() => handleSelect(stringData, stringIndex, fret.fret)}
                        >
                          {fretIndex > 0 && <div className="fret-wire" aria-hidden="true" />}
                          <div className="guitar-string-line" aria-hidden="true" />
                          {showDot && (
                            <div
                              className={`note-dot ${baseDotClass} pk-key-button ${state ?? ''}`.trim()}
                              title={`${fret.note} - Fret ${fret.fret}`}
                            >
                              {showLabels && (legalKeys.length === 0 || state !== null) ? fret.note : ''}
                            </div>
                          )}
                          {[3, 5, 7, 9, 12, 15, 17, 19, 21].includes(fret.fret) && !showDot && (
                            <div className="fret-marker" aria-hidden="true" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="fretboard-legend">
        {legalKeys.length > 0 ? (
          <>
            <div className="legend-item">
              <div className="legend-dot pk-legend-start" />
              <span>Start</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot pk-legend-target" />
              <span>Choose</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot match" />
              <span>Correct</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot miss" />
              <span>Wrong</span>
            </div>
          </>
        ) : (
          <>
            <div className="legend-item">
              <div className="legend-dot root" />
              <span>Root Note</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot scale" />
              <span>Scale Notes</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot match" />
              <span>In Target (placed)</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot miss" />
              <span>Off Target (placed)</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot marker" />
              <span>Fret Markers</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default InteractiveGuitarFretboard
