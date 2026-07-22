// Scale Lab page — /play/learn-scales
// Reuses the visual language of the base PianoKeyboard / GuitarFretboard
// components via the InteractivePianoKeyboard and InteractiveGuitarFretboard
// variants defined in this feature. Fetches the same scale analysis that
// the Explorer uses, so the Lab and Explorer share a single source of truth.

import React, { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import axios from 'axios'
import { CheckCircle, Eye, FlaskConical, Guitar, Piano, Trash2 } from 'lucide-react'
import {
  createInitialScaleLabState,
  scaleLabReducer,
  type LabPosition,
  type ScaleLabState,
} from '../state/scaleLabReducer'
import { analyzeCandidates, NOTE_NAMES } from '../services/scaleCandidateAnalysis'
import { verifyScaleLabBuild } from '../../../services/scalePlayApi'
import InteractivePianoKeyboard from './InteractivePianoKeyboard'
import InteractiveGuitarFretboard from './InteractiveGuitarFretboard'
import ScaleCandidatePanel from './ScaleCandidatePanel'
import ScaleExplanationPanel from './ScaleExplanationPanel'
import KeySelector from '../../../components/KeySelector/KeySelector'
import { useMotionProfile } from '../../../contexts/MotionContext'
import { useActivitySession } from '../../../game/progression/useActivitySession'
import '../styles/scale-lab.scss'

// RANGE_LEVELS matches ScalesPage so the Lab grows in lockstep with Explorer.
const RANGE_LEVELS = [
  { id: 1, octaves: 1, frets: 12, label: 'Single' },
  { id: 2, octaves: 2, frets: 17, label: 'Double' },
  { id: 3, octaves: 3, frets: 22, label: 'Triple' },
] as const

const MODE_OPTIONS = [
  { key: 'ionian', label: 'Ionian (Major)' },
  { key: 'aeolian', label: 'Aeolian (Minor)' },
  { key: 'dorian', label: 'Dorian' },
  { key: 'mixolydian', label: 'Mixolydian' },
  { key: 'phrygian', label: 'Phrygian' },
  { key: 'lydian', label: 'Lydian' },
  { key: 'locrian', label: 'Locrian' },
] as const

interface ScaleAnalysisResponse {
  key: string
  interval_type: string
  scale_name: string
  notes: string[]
  scale_degrees: Array<{ degree: number; roman: string; note: string; chord: string; function: string }>
  keyboard_data: {
    natural_keys: string[]
    black_keys: Array<{ note: string; after_natural: number }>
    scale_notes: string[]
    root_note: string
  }
  fretboard_data: Array<{
    string: string
    frets: Array<{ fret: number; note: string; is_scale_note: boolean; is_root: boolean }>
  }>
}

const ScaleLab: React.FC = () => {
  const { motion } = useMotionProfile()
  const reducedMotion = motion === 'minimal'
  const [state, dispatch] = useReducer(scaleLabReducer, null, () => createInitialScaleLabState({ reducedMotion }))
  const activity = useActivitySession('scale-lab', state.selectedPositions.length > 0 && !state.verifiedResult)

  const [activeTab, setActiveTab] = useState<'build' | 'candidates' | 'explain'>('build')
  const [builderInstrument, setBuilderInstrument] = useState<'guitar' | 'piano'>('guitar')
  const [showReference, setShowReference] = useState(false)
  const [scaleData, setScaleData] = useState<ScaleAnalysisResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  const rootPitch = NOTE_NAMES.indexOf(state.root)
  const rangeLevel = RANGE_LEVELS.find((r) => r.id === state.rangeLevel) ?? RANGE_LEVELS[0]

  // Fetch the same scale analysis the Explorer uses so the visual style and
  // data stay in sync. Range grows the visible keyboard (octaves) and
  // fretboard (frets) together.
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        setLoading(true)
        setAnalysisError(null)
        const response = await axios.get<ScaleAnalysisResponse>(
          `/api/scale/${encodeURIComponent(state.root)}?interval=${state.mode || 'ionian'}&octaves=${rangeLevel.octaves}`,
        )
        if (!cancelled) setScaleData(response.data)
      } catch (err) {
        if (!cancelled) {
          setAnalysisError(
            (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to load scale data',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [state.root, state.mode, rangeLevel.octaves])

  const handleTogglePosition = useCallback((pos: LabPosition) => {
    dispatch({ type: 'TOGGLE_POSITION', position: pos })
  }, [])

  const handleClearAll = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' })
  }, [])

  const handleShowRest = useCallback(() => {
    dispatch({ type: 'SHOW_REST' })
  }, [])

  const handleVerify = useCallback(async () => {
    const selectedNotes = [...new Set(state.selectedPositions.map((p) => p.pitch % 12))]
    try {
      const res = await verifyScaleLabBuild({
        root: state.root,
        mode: state.mode,
        selectedNotes,
      })
      dispatch({ type: 'SET_VERIFIED', result: res.data })
      setActiveTab('explain')
      await activity.finish()
    } catch {
      dispatch({ type: 'SET_EXPLANATION', text: 'Verification unavailable. Check your connection.' })
    }
  }, [activity.finish, state.root, state.mode, state.selectedPositions])

  // Selected pitch classes (deduped) feed the piano candidate highlight.
  const placedPitches = useMemo(() => {
    const seen = new Set<number>()
    return state.selectedPositions.filter((p) => {
      if (seen.has(p.pitch)) return false
      seen.add(p.pitch)
      return true
    })
  }, [state.selectedPositions])

  const placedNoteNames = useMemo(() => placedPitches.map((p) => NOTE_NAMES[p.pitch % 12]), [placedPitches])

  const candidates = useMemo(
    () => analyzeCandidates(state.selectedPositions, state.mode),
    [state.selectedPositions, state.mode],
  )

  // Pitch classes the learner still needs to place when a target is set.
  const targetMissingPitchClasses = useMemo(() => {
    if (!state.showAllMissing || !state.mode || !scaleData) return [] as number[]
    const target = new Set(scaleData.keyboard_data.scale_notes.map((n: string) => NOTE_NAMES.indexOf(n)))
    const placed = new Set(placedPitches.map((p) => p.pitch))
    return [...target].filter((p) => !placed.has(p))
  }, [state.showAllMissing, state.mode, scaleData, placedPitches])

  const targetMissingNotes = useMemo(
    () => targetMissingPitchClasses.map((p) => NOTE_NAMES[p]),
    [targetMissingPitchClasses],
  )

  const handlePianoSelect = useCallback(
    (selection: { note: string; pitchClass: number; midi: number; naturalIndex: number; isBlack: boolean }) => {
      const pos: LabPosition = {
        string: 'piano',
        fret: selection.midi,
        note: selection.note,
        stringIndex: -1,
        pitch: selection.pitchClass,
      }
      dispatch({ type: 'TOGGLE_POSITION', position: pos })
    },
    [],
  )

  const handleFretboardSelect = useCallback(
    (selection: {
      string: string
      stringIndex: number
      fret: number
      note: string
      pitch: number
      isScaleNote: boolean
      isRoot: boolean
    }) => {
      const pos: LabPosition = {
        string: selection.string,
        fret: selection.fret,
        note: selection.note,
        stringIndex: selection.stringIndex,
        pitch: selection.pitch,
      }
      dispatch({ type: 'TOGGLE_POSITION', position: pos })
    },
    [],
  )

  return (
    <main className={`scale-lab ${state.reducedMotion ? 'reduced-motion' : ''}`}>
      <header className="sl-header">
        <div className="sl-header__brand">
          <FlaskConical size={22} />
          <div>
            <p>Scale Lab</p>
            <h1>Build a Scale</h1>
          </div>
        </div>

        <div className="sl-header__controls">
          <KeySelector
            selectedKey={state.root}
            onKeyChange={(key) => dispatch({ type: 'SET_ROOT', root: key })}
            loading={loading}
          />

          <select
            className="sl-select"
            value={state.mode}
            onChange={(e) => dispatch({ type: 'SET_MODE', mode: e.target.value })}
            aria-label="Target scale family"
          >
            <option value="">No target (explore)</option>
            {MODE_OPTIONS.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </select>

          <div className="sl-range-btns" role="group" aria-label="Range">
            {RANGE_LEVELS.map((level) => (
              <button
                key={level.id}
                type="button"
                className={`sl-range-btn ${state.rangeLevel === level.id ? 'active' : ''}`}
                onClick={() => dispatch({ type: 'SET_RANGE', level: level.id })}
                aria-pressed={state.rangeLevel === level.id}
                title={`${level.label} (${level.octaves} octave${level.octaves > 1 ? 's' : ''} · ${level.frets} frets)`}
              >
                {level.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="sl-btn sl-btn--ghost"
            onClick={handleClearAll}
            title="Clear all notes"
            aria-label="Clear all placed notes"
          >
            <Trash2 size={15} />
            Clear
          </button>
        </div>
      </header>

      <div className="sl-layout">
        <section className="sl-builder" aria-label="Scale build board">
          <div className="sl-builder__label">
            <div>
              <span>Build board</span>
              <small>Place the notes you hear or expect in the scale.</small>
            </div>
            <div className="sl-instrument-switch" role="group" aria-label="Build board instrument">
              <button
                type="button"
                className={builderInstrument === 'guitar' ? 'active' : ''}
                onClick={() => setBuilderInstrument('guitar')}
                aria-pressed={builderInstrument === 'guitar'}
              >
                <Guitar size={15} /> Guitar
              </button>
              <button
                type="button"
                className={builderInstrument === 'piano' ? 'active' : ''}
                onClick={() => setBuilderInstrument('piano')}
                aria-pressed={builderInstrument === 'piano'}
              >
                <Piano size={15} /> Piano
              </button>
            </div>
          </div>

          {analysisError && (
            <div className="sl-panel-empty" role="alert">
              {analysisError}
            </div>
          )}

          {scaleData && !analysisError && (
            <>
              {builderInstrument === 'guitar' ? (
                <InteractiveGuitarFretboard
                  fretboardData={scaleData.fretboard_data}
                  fretCount={rangeLevel.frets}
                  selectedKeys={state.selectedPositions
                    .filter((p) => p.string !== 'piano')
                    .map((p) => ({ string: p.string, fret: p.fret }))}
                  hintKeys={
                    state.showAllMissing && state.mode
                      ? targetMissingPitchClasses.flatMap((pc) => {
                          const note = NOTE_NAMES[pc]
                          return scaleData.fretboard_data.flatMap((string) =>
                            string.frets
                              .filter((f) => f.note === note && f.fret <= rangeLevel.frets)
                              .map((f) => ({ string: string.string, fret: f.fret })),
                          )
                        })
                      : []
                  }
                  showLabels
                  onSelect={handleFretboardSelect}
                  ariaLabel={`${state.root} ${state.mode || 'free'} scale shape on guitar`}
                />
              ) : (
                <div className="sl-piano-builder">
                  <InteractivePianoKeyboard
                    keyboardData={scaleData.keyboard_data}
                    selectedNotes={placedNoteNames}
                    hintNotes={targetMissingNotes}
                    rootPitchClass={rootPitch}
                    showLabels
                    onSelect={handlePianoSelect}
                    ariaLabel={`${state.root} ${state.mode || 'free'} scale shape on piano`}
                  />
                </div>
              )}

              {placedPitches.length > 0 && (
                <div className="sl-note-strip" aria-label="Selected notes">
                  <div className="sl-note-strip__chips">
                    {placedPitches.map((p) => (
                      <span key={p.pitch} className="sl-note-chip">
                        {NOTE_NAMES[p.pitch % 12]}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="sl-builder__actions">
                <button type="button" className="sl-btn" onClick={handleShowRest}>
                  <Eye size={15} /> Show the rest
                </button>
                <button
                  type="button"
                  className="sl-btn sl-btn--primary"
                  onClick={handleVerify}
                  disabled={state.selectedPositions.length < 3}
                >
                  <CheckCircle size={15} /> Analyze Sound Formula
                </button>
              </div>

              <section className="sl-reference" aria-label={`${state.root} ${state.mode || 'explore'} reference shape`}>
                <button
                  type="button"
                  className="sl-reference__toggle"
                  onClick={() => setShowReference((visible) => !visible)}
                  aria-expanded={showReference}
                >
                  <Eye size={15} /> {showReference ? 'Hide' : 'Show'} {builderInstrument} reference
                </button>
                {showReference && (
                  <div className="sl-reference__content">
                    <div className="sl-reference__title">
                      <span>Reference shape</span>
                      <strong>
                        {state.root} {MODE_OPTIONS.find((mode) => mode.key === state.mode)?.label ?? 'Free play'}
                      </strong>
                    </div>
                    {builderInstrument === 'piano' ? (
                      <InteractivePianoKeyboard
                        keyboardData={scaleData.keyboard_data}
                        rootPitchClass={rootPitch}
                        showLabels
                        disabled
                        ariaLabel={`${state.root} ${state.mode || 'explore'} reference piano`}
                      />
                    ) : (
                      <InteractiveGuitarFretboard
                        fretboardData={scaleData.fretboard_data}
                        fretCount={rangeLevel.frets}
                        showLabels
                        disabled
                        ariaLabel={`${state.root} ${state.mode || 'explore'} reference fretboard`}
                      />
                    )}
                  </div>
                )}
              </section>
            </>
          )}
        </section>

        <aside className="sl-analysis">
          <div className="sl-analysis__tabs" role="tablist">
            {(['build', 'candidates', 'explain'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                className={`sl-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="sl-analysis__panels">
            <div className={`sl-panel-wrap ${activeTab !== 'candidates' ? 'hidden-mobile' : ''}`}>
              <ScaleCandidatePanel candidates={candidates} rootPitch={rootPitch} targetMode={state.mode} />
            </div>

            <div className={`sl-panel-wrap ${activeTab !== 'explain' ? 'hidden-mobile' : ''}`}>
              {state.verifiedResult ? (
                <ScaleExplanationPanel
                  explanation={state.explanation}
                  result={state.verifiedResult}
                  rootPitch={rootPitch}
                />
              ) : (
                <div className="sl-panel-empty">
                  <p>Analyze your build to reveal its music21 Sound Formula.</p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}

export default ScaleLab
