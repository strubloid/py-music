// Scale Lab page — /play/learn-scales
import React, { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import { FlaskConical, Trash2, Eye, CheckCircle, ChevronDown } from 'lucide-react'
import {
  createInitialScaleLabState,
  scaleLabReducer,
  type ScaleLabState,
  type LabPosition,
} from '../state/scaleLabReducer'
import { analyzeCandidates } from '../services/scaleCandidateAnalysis'
import { getScalePositions, NOTE_NAMES } from '../services/scalePathGenerator'
import { verifyScaleLabBuild } from '../../../services/scalePlayApi'
import ScaleBuilderFretboard from './ScaleBuilderFretboard'
import ScaleCandidatePanel from './ScaleCandidatePanel'
import ScaleExplanationPanel from './ScaleExplanationPanel'
import KeySelector from '../../../components/KeySelector/KeySelector'
import GamePianoKeyboard from '../../../game/instruments/GamePianoKeyboard'
import GameGuitarFretboard from '../../../game/instruments/GameGuitarFretboard'
import { STANDARD_GUITAR_MIDI } from '../../../game/instruments/musicMath'
import { useMotionProfile } from '../../../contexts/MotionContext'
import { useActivitySession } from '../../../game/progression/useActivitySession'
import '../styles/scale-lab.scss'

// RANGE_LEVELS mirrors ScalesPage
const RANGE_LEVELS = [
  { id: 1, fretCount: 12, label: 'Single' },
  { id: 2, fretCount: 17, label: 'Double' },
  { id: 3, fretCount: 22, label: 'Triple' },
]

const MODE_OPTIONS = [
  { key: 'ionian', label: 'Ionian (Major)' },
  { key: 'aeolian', label: 'Aeolian (Minor)' },
  { key: 'dorian', label: 'Dorian' },
  { key: 'mixolydian', label: 'Mixolydian' },
  { key: 'phrygian', label: 'Phrygian' },
  { key: 'lydian', label: 'Lydian' },
  { key: 'locrian', label: 'Locrian' },
]
const ScaleLab: React.FC = () => {
  const { motion } = useMotionProfile()
  const reducedMotion = motion === 'minimal'
  const [state, dispatch] = useReducer(scaleLabReducer, null, () => createInitialScaleLabState({ reducedMotion }))
  const activity = useActivitySession('scale-lab', state.selectedPositions.length > 0 && !state.verifiedResult)

  const [activeTab, setActiveTab] = useState<'build' | 'candidates' | 'explain'>('build')
  const [showAllMissing, setShowAllMissing] = useState(false)

  const rootPitch = NOTE_NAMES.indexOf(state.root)
  const rangeLevel = RANGE_LEVELS.find((r) => r.id === state.rangeLevel) ?? RANGE_LEVELS[0]

  // Build positions from root + mode
  const positions = useMemo(
    () => getScalePositions(rootPitch, state.mode, rangeLevel.fretCount),
    [rootPitch, state.mode, rangeLevel.fretCount],
  )
  const referenceInstrumentData = useMemo(() => {
    const scalePitches = new Set(positions.map((position) => position.pitch))
    return {
      pianoMidi: Array.from({ length: 13 }, (_, index) => 48 + index).filter((midi) => scalePitches.has(midi % 12)),
      guitarMidi: positions.map((position) => STANDARD_GUITAR_MIDI[position.stringIndex] + position.fret),
    }
  }, [positions])

  // Analyze candidates when placed notes change
  const candidates = useMemo(
    () => analyzeCandidates(state.selectedPositions, state.mode),
    [state.selectedPositions, state.mode],
  )

  // Target scale missing notes for display
  const targetMissingPositions = useMemo(() => {
    if (!state.showAllMissing || !state.mode) return []
    const targetPitches = getScalePositions(rootPitch, state.mode, rangeLevel.fretCount)
    const placedKeys = new Set(state.selectedPositions.map((p) => `${p.string}-${p.fret}`))
    return targetPitches.filter((p) => !placedKeys.has(`${p.string}-${p.fret}`))
  }, [state.showAllMissing, state.mode, state.selectedPositions, rootPitch, rangeLevel.fretCount])

  const handleTogglePosition = useCallback((pos: LabPosition) => {
    dispatch({ type: 'TOGGLE_POSITION', position: pos })
  }, [])

  const handleClearAll = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' })
  }, [])

  const handleShowRest = useCallback(async () => {
    setShowAllMissing(true)
    dispatch({ type: 'SHOW_REST' })
  }, [])

  const handleVerify = useCallback(async () => {
    const selectedNotes = [...new Set(state.selectedPositions.map((p) => p.pitch))]
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

  const uniqueNotes = useMemo(() => {
    const seen = new Set<number>()
    return state.selectedPositions.filter((p) => {
      if (seen.has(p.pitch)) return false
      seen.add(p.pitch)
      return true
    })
  }, [state.selectedPositions])

  const nonTargetPositions = useMemo(() => {
    if (!state.mode) return []
    const targetPitches = new Set(getScalePositions(rootPitch, state.mode, rangeLevel.fretCount).map((p) => p.pitch))
    return state.selectedPositions.filter((p) => !targetPitches.has(p.pitch))
  }, [state.selectedPositions, state.mode, rootPitch, rangeLevel.fretCount])

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
          <KeySelector selectedKey={state.root} onKeyChange={(key) => dispatch({ type: 'SET_ROOT', root: key })} />

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
        {/* Left: Fretboard builder */}
        <section className="sl-builder" aria-label="Fretboard builder">
          <section className="sl-reference-instruments" aria-label={`${state.root} ${state.mode} reference shape`}>
            <header>
              <span>Reference shape</span>
              <strong>
                {state.root} {MODE_OPTIONS.find((mode) => mode.key === state.mode)?.label}
              </strong>
            </header>
            <div className="sl-reference-instruments__piano">
              <GamePianoKeyboard
                startMidi={48}
                endMidi={60}
                legalMidi={referenceInstrumentData.pianoMidi}
                rootPitchClass={rootPitch}
                showLabels
                disabled
              />
            </div>
            <div className="sl-reference-instruments__guitar">
              <GameGuitarFretboard
                fretCount={rangeLevel.fretCount}
                legalMidi={referenceInstrumentData.guitarMidi}
                rootPitchClass={rootPitch}
                showLabels
                disabled
              />
            </div>
          </section>
          <div className="sl-builder__label">
            <span>Build board</span>
            <small>Tap notes to construct your own version of the shape.</small>
          </div>
          <ScaleBuilderFretboard
            fretCount={rangeLevel.fretCount}
            positions={positions}
            placedNotes={state.selectedPositions}
            missingNotes={state.showAllMissing ? targetMissingPositions : []}
            nonTargetNotes={nonTargetPositions}
            targetMode={state.mode}
            targetRoot={state.root}
            selectedPositions={state.selectedPositions}
            reducedMotion={state.reducedMotion}
            onPositionToggle={handleTogglePosition}
            onClearAll={handleClearAll}
          />

          {/* Selected-note strip */}
          {uniqueNotes.length > 0 && (
            <div className="sl-note-strip" aria-label="Selected notes">
              <div className="sl-note-strip__chips">
                {uniqueNotes.map((p) => (
                  <span key={p.pitch} className="sl-note-chip">
                    {p.note}
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
        </section>

        {/* Right: Analysis */}
        <aside className="sl-analysis">
          {/* Mobile tabs */}
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
