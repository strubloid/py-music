import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import {
  ChevronRight,
  Compass,
  Footprints,
  Guitar,
  MapPin,
  Pause,
  Piano,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react'
import { useAuth } from '../../../contexts/AuthContext'
import { useGameProgress } from '../../../contexts/GameProgressContext'
import { useMotion } from '../../../contexts/MotionContext'

import InteractiveGuitarFretboard from '../../learning-scales/components/InteractiveGuitarFretboard'
import InteractivePianoKeyboard from '../../learning-scales/components/InteractivePianoKeyboard'
import { midiToNoteName, STANDARD_GUITAR_MIDI } from '../../../game/instruments/musicMath'
import { useActivitySession } from '../../../game/progression/useActivitySession'
import { createMusicTransport } from '../../../game/audio/toneTransport'
import { completeScalePathFragment, getScalePathRun } from '../../../services/scalePlayApi'
import { createInitialScalePathState, scalePathReducer, type ScalePathPosition } from '../state/scalePathReducer'
import { normalizeRun } from '../services/scalePathNormalizer'
import '../styles/scale-path.scss'
import '../styles/living-scale-trail.scss'

type Instrument = 'guitar' | 'piano'
type JourneyStage = 'arrival' | 'rolling' | 'playing'
type JourneyMark = { position: ScalePathPosition; correct: boolean }

const ScalePathGame: React.FC = () => {
  const { isLoggedIn, promptLogin } = useAuth()
  const { progressState } = useGameProgress()
  const { motion } = useMotion()
  const reducedMotion = motion === 'minimal'
  const initialInstrument = (localStorage.getItem('strubloid:scale-trail-instrument') as Instrument) || 'piano'
  const [instrument, setInstrument] = useState<Instrument>(initialInstrument)
  const [journeyStage, setJourneyStage] = useState<JourneyStage>('arrival')
  const [game, dispatch] = useReducer(scalePathReducer, null, () => createInitialScalePathState({ reducedMotion }))
  const gameRef = useRef(game)
  const transitionTimerRef = useRef<number | null>(null)
  const transportRef = useRef<ReturnType<typeof createMusicTransport> | null>(null)
  const pendingInstrumentRef = useRef<Instrument | null>(null)
  const submissionInFlightRef = useRef(false)

  const [announcement, setAnnouncement] = useState('Choose Piano Garden or Guitar Bridge to begin.')
  const [trail, setTrail] = useState<JourneyMark[]>([])
  const [wrongBranch, setWrongBranch] = useState<ScalePathPosition | null>(null)
  const [showCompass, setShowCompass] = useState(false)
  const [safeLanding, setSafeLanding] = useState(false)
  const [pipState, setPipState] = useState<'curious' | 'walking' | 'thinking' | 'success' | 'mistake'>('curious')
  const activity = useActivitySession(
    'scale-trail',
    journeyStage === 'playing' && !['run-complete', 'error'].includes(game.phase),
  )

  gameRef.current = game

  const clearTimer = useCallback(() => {
    if (transitionTimerRef.current) window.clearTimeout(transitionTimerRef.current)
    transitionTimerRef.current = null
  }, [])

  const loadRun = useCallback(async () => {
    submissionInFlightRef.current = false
    dispatch({ type: 'RUN_LOADING' })
    setTrail([])
    setWrongBranch(null)
    try {
      const response = await getScalePathRun({})
      const normalized = normalizeRun(response.data)
      dispatch({ type: 'RUN_LOADED', run: normalized })
      setShowCompass(false)
      if (normalized.routeModifier === 'listen-first') {
        const anchorNote = normalized.fragments[0]?.anchor.note || normalized.root
        transportRef.current?.playArrival([`${anchorNote.replace(/\d/g, '')}4`])
      }
      setAnnouncement(
        `The musical die chose ${normalized.dieResult} movements. ${normalized.root} ${normalized.mode}, ${normalized.routeModifier}.`,
      )
    } catch {
      dispatch({ type: 'ERROR', error: 'Tempo could not find this trail. Check the connection and try again.' })
    }
  }, [])

  const beginJourney = useCallback(
    (nextInstrument: Instrument) => {
      if (!isLoggedIn) {
        pendingInstrumentRef.current = nextInstrument
        promptLogin('save')
        return
      }
      setInstrument(nextInstrument)
      localStorage.setItem('strubloid:scale-trail-instrument', nextInstrument)
      setJourneyStage('rolling')
      setPipState('walking')
      const transport = transportRef.current || createMusicTransport()
      transportRef.current = transport
      transport.unlock().catch(() => undefined)
      loadRun()
    },
    [isLoggedIn, loadRun, promptLogin],
  )

  useEffect(() => {
    if (!isLoggedIn || !pendingInstrumentRef.current) return
    const pendingInstrument = pendingInstrumentRef.current
    pendingInstrumentRef.current = null
    beginJourney(pendingInstrument)
  }, [beginJourney, isLoggedIn])

  useEffect(() => {
    if (journeyStage !== 'rolling' || game.phase !== 'ready') return undefined
    const timer = window.setTimeout(
      () => {
        setJourneyStage('playing')
        setPipState('thinking')
        dispatch({ type: 'INPUT_ACCEPTED' })
      },
      reducedMotion ? 250 : 1400,
    )
    return () => window.clearTimeout(timer)
  }, [game.phase, journeyStage, reducedMotion])

  useEffect(() => {
    if (journeyStage === 'playing' && game.phase === 'ready') {
      const timer = window.setTimeout(() => dispatch({ type: 'INPUT_ACCEPTED' }), reducedMotion ? 80 : 420)
      return () => window.clearTimeout(timer)
    }
    return undefined
  }, [game.phase, journeyStage, reducedMotion])

  useEffect(() => {
    if (journeyStage !== 'playing' || game.phase !== 'accepting-input' || !game.fragment) return undefined
    setAnnouncement(
      `Movement ${game.fragmentIndex + 1} of ${game.fragmentCount}. Stay in ${game.run?.root} ${game.run?.mode}. From ${game.fragment.anchor.note}, find scale degree ${game.fragment.degreeClue}.`,
    )
    return undefined
  }, [game.fragment, game.fragmentCount, game.fragmentIndex, game.phase, game.run?.mode, game.run?.root, journeyStage])

  useEffect(
    () => () => {
      clearTimer()
      transportRef.current?.dispose()
    },
    [clearTimer],
  )

  useEffect(() => {
    if (game.phase !== 'run-complete') return
    setPipState('success')
    activity.finish().catch(() => {})
  }, [activity.finish, game.phase])

  const switchInstrument = (next: Instrument) => {
    setInstrument(next)
    localStorage.setItem('strubloid:scale-trail-instrument', next)
    setAnnouncement(`${next === 'piano' ? 'Piano Garden' : 'Guitar Bridge'} ready. Your trail progress is preserved.`)
  }

  const submitCandidate = useCallback(
    async (candidate: ScalePathPosition, candidateIndex: number, submittedMidi?: number) => {
      const state = gameRef.current
      if (submissionInFlightRef.current || state.phase !== 'accepting-input' || !state.fragment) return
      submissionInFlightRef.current = true
      dispatch({ type: 'SELECT_CANDIDATE', index: candidateIndex })
      dispatch({ type: 'COMMIT_ANSWER' })
      setPipState('thinking')
      try {
        const response = await completeScalePathFragment({
          runId: state.runId ?? '',
          fragmentIndex: state.fragmentIndex,
          submittedPosition: { string: candidate.string, fret: candidate.fret },
          submittedMidi,
          difficulty: state.fragment.difficulty ?? 1,
        })
        const correct = Boolean(response.data.correct)
        const correctPosition = response.data.correctAnswer as ScalePathPosition
        if (correct) {
          setTrail((current) => [...current, { position: candidate, correct: true }])
          setWrongBranch(null)
          setPipState('success')
        } else if (safeLanding) {
          setSafeLanding(false)
          setTrail((current) => [
            ...current,
            { position: candidate, correct: false },
            ...(correctPosition ? [{ position: correctPosition, correct: true }] : []),
          ])
          setWrongBranch(candidate)
          setAnnouncement('Safe Landing protected this mistake. Try another glowing destination.')
          setPipState('mistake')
          dispatch({
            type: 'ANSWER_RESOLVED',
            correct: false,
            selectedNote: candidate.note,
            correctNote: correctPosition?.note || '',
            awardedXp: 0,
            explanation: 'Safe Landing returned Pip to the last note.',
          })
        } else {
          setTrail((current) => [
            ...current,
            { position: candidate, correct: false },
            ...(correctPosition ? [{ position: correctPosition, correct: true }] : []),
          ])
          setWrongBranch(candidate)
          setPipState('mistake')
        }
        const explanation = correct
          ? `${candidate.note} extends the ${state.run?.root} ${state.run?.mode} route.`
          : `${candidate.note} made a safe dead-end. Return to the last glowing note.`
        if (!safeLanding || correct) {
          dispatch({
            type: 'ANSWER_RESOLVED',
            correct,
            selectedNote: candidate.note,
            correctNote: correctPosition?.note || '',
            awardedXp: response.data.xp_awarded || 0,
            explanation,
          })
        }
        setAnnouncement(
          correct ? `Correct movement ${state.fragmentIndex + 1} of ${state.fragmentCount}.` : explanation,
        )
        transitionTimerRef.current = window.setTimeout(
          () => {
            submissionInFlightRef.current = false
            setWrongBranch(null)
            dispatch({ type: 'NEXT_FRAGMENT' })
          },
          reducedMotion ? 350 : correct ? 1100 : 1700,
        )
      } catch {
        submissionInFlightRef.current = false
        dispatch({ type: 'ERROR', error: 'Echo lost the route signal. Start a fresh trail to reconnect.' })
      }
    },
    [reducedMotion, safeLanding],
  )

  const spendPower = async (power: 'trace' | 'safe' | 'compass', cost: number) => {
    if (game.phase !== 'accepting-input' || progressState.focusPoints < cost) return
    const spent = await activity.spendFocus(
      cost,
      power === 'trace' ? 'trace-path' : power === 'safe' ? 'remove-trap' : 'root-lantern',
    )
    if (spent) {
      if (power === 'trace') {
        setShowCompass(true)
        setAnnouncement('Trace One Step reveals the next movement without completing it.')
      }
      if (power === 'safe') setSafeLanding(true)
      if (power === 'compass') setShowCompass(true)
    } else {
      setAnnouncement('That Focus power is unavailable right now. No Focus was spent.')
    }
  }

  const restart = () => {
    clearTimer()
    activity.reset()
    setJourneyStage('rolling')
    setPipState('walking')
    loadRun()
  }

  const fragment = game.fragment
  const candidates = fragment?.candidates || []
  const fretboardData = useMemo(() => {
    const scalePositions = new Set(
      game.run?.positions.map((position) => `${position.stringIndex}:${position.fret}`) || [],
    )
    return STANDARD_GUITAR_MIDI.map((openMidi, stringIndex) => ({
      string: midiToNoteName(openMidi, 'sharp', false),
      frets: Array.from({ length: (game.run?.fretCount || 12) + 1 }, (_, fret) => ({
        fret,
        note: midiToNoteName(openMidi + fret, 'sharp', false),
        is_scale_note: scalePositions.has(`${stringIndex}:${fret}`),
        is_root: (openMidi + fret) % 12 === fragment?.anchor.pitch,
      })),
    }))
  }, [fragment?.anchor.pitch, game.run?.fretCount, game.run?.positions])
  const keyboardData = useMemo(
    () => ({
      natural_keys: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
      black_keys: [
        { note: 'C#', after_natural: 0 },
        { note: 'D#', after_natural: 1 },
        { note: 'F#', after_natural: 3 },
        { note: 'G#', after_natural: 4 },
        { note: 'A#', after_natural: 5 },
      ],
      scale_notes: game.run?.positions.map((position) => position.note) || [],
      root_note: game.run?.root || '',
    }),
    [game.run?.positions, game.run?.root],
  )
  const legalNotes = useMemo(() => [...new Set(candidates.map((candidate) => candidate.note))], [candidates])
  const correctNotes = useMemo(
    () => [...new Set(trail.filter((mark) => mark.correct).map((mark) => mark.position.note))],
    [trail],
  )
  const wrongNotes = useMemo(
    () => [...new Set(trail.filter((mark) => !mark.correct).map((mark) => mark.position.note))],
    [trail],
  )

  if (journeyStage === 'arrival') {
    return (
      <main className="scale-trail-arrival">
        <div className="scale-trail-arrival__sky" aria-hidden="true" />
        <header className="scale-trail-arrival__banner">
          <span>Scale Trail</span>
          <h1>Choose your path through the instrument gardens</h1>
          <p>Every journey contains six or seven connected musical movements.</p>
        </header>
        <div className="scale-trail-arrival__scene">
          <button type="button" className="instrument-landmark piano-garden" onClick={() => beginJourney('piano')}>
            <Piano size={34} />
            <strong>Piano Garden</strong>
            <span>Travel across two full octaves</span>
          </button>
          <div className="trail-guide-mark" aria-hidden="true">
            <Compass />
          </div>
          <button type="button" className="instrument-landmark guitar-bridge" onClick={() => beginJourney('guitar')}>
            <Guitar size={34} />
            <strong>Guitar Bridge</strong>
            <span>Cross a complete wooden fretboard</span>
          </button>
        </div>
      </main>
    )
  }

  if (journeyStage === 'rolling' && game.phase !== 'error') {
    return (
      <main className={`scale-trail-roll ${reducedMotion ? 'is-minimal' : ''}`}>
        <div
          className="musical-die"
          role="status"
          aria-label={`Musical die result ${game.run?.dieResult || 'loading'}`}
        >
          <span>{game.run?.dieResult || '♪'}</span>
          <i>movements</i>
        </div>
        <div className="trail-guide-mark" aria-hidden="true">
          <Compass />
        </div>
        <p>
          {game.run ? `The trail will have ${game.run.dieResult} movements.` : 'Tempo is preparing the musical die…'}
        </p>
      </main>
    )
  }

  return (
    <main
      className={`scale-path-game living-scale-trail ${reducedMotion ? 'reduced-motion' : ''}`}
      data-phase={game.phase}
    >
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
      <header className="sp-header">
        <div className="sp-header__brand">
          <Footprints aria-hidden="true" />
          <div>
            <p>Scale Trail · {game.run?.routeModifier?.replace('-', ' ')}</p>
            <h1>
              {game.run?.root} {game.run?.mode} journey
            </h1>
          </div>
        </div>
        <div
          className="trail-progress"
          aria-label={`${game.fragmentIndex} of ${game.fragmentCount} movements complete`}
        >
          {Array.from({ length: game.fragmentCount }, (_, index) => (
            <i
              key={index}
              className={index < game.fragmentIndex ? 'is-complete' : index === game.fragmentIndex ? 'is-current' : ''}
            />
          ))}
        </div>
        <div className="sp-header__actions">
          <button type="button" onClick={restart} aria-label="Roll a new trail">
            <RotateCcw size={17} />
          </button>
          <button type="button" onClick={() => dispatch({ type: 'PAUSE' })} aria-label="Pause">
            <Pause size={17} />
          </button>
        </div>
      </header>

      {game.phase !== 'run-complete' && game.phase !== 'error' && fragment && (
        <>
          <section className="trail-objective">
            <div className="mission-heading">
              <div className="trail-guide-mark" data-state={pipState} aria-hidden="true">
                <Compass />
              </div>
              <div>
                <span>
                  Move {game.fragmentIndex + 1} of {game.fragmentCount}
                </span>
                <h2>Follow the note trail</h2>
              </div>
            </div>
            <div
              className="mission-flow"
              aria-label={`In ${game.run?.root} ${game.run?.mode}, start on ${fragment.anchor.note} and find degree ${fragment.degreeClue}. Choose one of the highlighted notes.`}
            >
              <div className="mission-step mission-step--key">
                <span>Key</span>
                <strong>
                  {game.run?.root} {game.run?.mode}
                </strong>
              </div>
              <ChevronRight className="mission-arrow" aria-hidden="true" />
              <div className="mission-step mission-step--start">
                <MapPin aria-hidden="true" />
                <span>Start</span>
                <strong>{fragment.anchor.note}</strong>
              </div>
              <ChevronRight className="mission-arrow" aria-hidden="true" />
              <div className="mission-step mission-step--degree">
                <span>Find</span>
                <strong>Degree {fragment.degreeClue}</strong>
              </div>
              <ChevronRight className="mission-arrow" aria-hidden="true" />
              <div className="mission-step mission-step--answer">
                <Target aria-hidden="true" />
                <span>Your move</span>
                <strong>Pick a note</strong>
              </div>
            </div>
            <div className="focus-backpack">
              <Sparkles size={18} />
              <strong>{progressState.focusPoints}</strong>
              <span>Focus</span>
            </div>
          </section>
          <nav className="instrument-case" aria-label="Instrument choice">
            <button type="button" aria-pressed={instrument === 'piano'} onClick={() => switchInstrument('piano')}>
              <Piano size={18} /> Piano
            </button>
            <button type="button" aria-pressed={instrument === 'guitar'} onClick={() => switchInstrument('guitar')}>
              <Guitar size={18} /> Guitar
            </button>
          </nav>
          <section
            className={`trail-instrument ${wrongBranch ? 'has-dead-end' : ''} ${showCompass ? 'show-compass' : ''}`}
          >
            {instrument === 'guitar' ? (
              <InteractiveGuitarFretboard
                fretboardData={fretboardData}
                legalKeys={candidates}
                startKeys={game.phase === 'accepting-input' ? [fragment.anchor] : []}
                correctKeys={trail.filter((mark) => mark.correct).map((mark) => mark.position)}
                wrongKeys={trail.filter((mark) => !mark.correct).map((mark) => mark.position)}
                fretCount={game.run?.fretCount || 12}
                showLabels
                disabled={game.phase !== 'accepting-input'}
                onSelect={(selection) => {
                  const index = candidates.findIndex(
                    (candidate) => candidate.stringIndex === selection.stringIndex && candidate.fret === selection.fret,
                  )
                  if (index >= 0) submitCandidate(candidates[index], index)
                }}
              />
            ) : (
              <InteractivePianoKeyboard
                keyboardData={keyboardData}
                legalNotes={legalNotes}
                startNotes={game.phase === 'accepting-input' ? [fragment.anchor.note] : []}
                correctNotes={correctNotes}
                wrongNotes={wrongNotes}
                rootPitchClass={fragment.anchor.pitch}
                showLabels
                disabled={game.phase !== 'accepting-input'}
                onSelect={(selection) => {
                  const index = candidates.findIndex((candidate) => candidate.pitch === selection.pitchClass)
                  if (index >= 0) submitCandidate(candidates[index], index, selection.midi)
                }}
              />
            )}
          </section>
          {game.result && (
            <div className={`trail-feedback ${game.result.correct ? 'is-correct' : 'is-wrong'}`} role="status">
              <strong>{game.result.correct ? 'Correct path' : 'Not this route'}</strong>
              <span>
                {game.result.correct
                  ? `${game.result.selectedNote} is now fixed in green on your journey.`
                  : `${game.result.selectedNote} stays red; ${game.result.correctNote} is marked green before the journey continues.`}
              </span>
            </div>
          )}
          <div className="trail-powers" aria-label="Focus powers">
            <button type="button" disabled={game.phase !== 'accepting-input'} onClick={() => spendPower('trace', 1)}>
              <Footprints size={16} /> Trace One Step <b>1</b>
            </button>
            <button
              type="button"
              disabled={game.phase !== 'accepting-input' || safeLanding}
              onClick={() => spendPower('safe', 2)}
            >
              <ShieldCheck size={16} /> Safe Landing <b>2</b>
            </button>
            <button type="button" disabled={game.phase !== 'accepting-input'} onClick={() => spendPower('compass', 3)}>
              <Compass size={16} /> Route Compass <b>3</b>
            </button>
          </div>
        </>
      )}

      {game.phase === 'run-complete' && (
        <section className="trail-landmark">
          <div className="trail-guide-mark" data-state="success" aria-hidden="true">
            <Compass />
          </div>
          <span>Landmark awakened</span>
          <h2>{game.fragmentCount}-movement trail complete</h2>
          <p>
            {game.correctCount} direct paths · {game.xpTotal} XP · +1 Focus
          </p>
          <button type="button" onClick={restart}>
            Roll another route
          </button>
        </section>
      )}
      {game.phase === 'error' && (
        <section className="sp-error" role="alert">
          <div className="trail-guide-mark" data-state="mistake" aria-hidden="true">
            <Compass />
          </div>
          <p>{game.error}</p>
          <button type="button" onClick={restart}>
            Reconnect the trail
          </button>
        </section>
      )}
      {game.phase === 'paused' && (
        <div className="sp-paused-overlay" role="dialog" aria-label="Trail paused">
          <div className="sp-paused-card">
            <h2>Tempo paused the trail</h2>
            <button type="button" onClick={() => dispatch({ type: 'RESUME' })}>
              Resume
            </button>
            <button type="button" onClick={restart}>
              Roll a new trail
            </button>
          </div>
        </div>
      )}
    </main>
  )
}

export default ScalePathGame
