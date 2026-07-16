import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { Compass, Footprints, Guitar, Pause, Piano, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react'
import { useAuth } from '../../../contexts/AuthContext'
import { useGameProgress } from '../../../contexts/GameProgressContext'
import { useMotion } from '../../../contexts/MotionContext'
import PipCharacter from '../../../game/characters/PipCharacter'
import GameGuitarFretboard from '../../../game/instruments/GameGuitarFretboard'
import GamePianoKeyboard from '../../../game/instruments/GamePianoKeyboard'
import { STANDARD_GUITAR_MIDI } from '../../../game/instruments/musicMath'
import { useActivitySession } from '../../../game/progression/useActivitySession'
import { createMusicTransport } from '../../../game/audio/toneTransport'
import { completeScalePathFragment, getScalePathRun } from '../../../services/scalePlayApi'
import { createInitialScalePathState, scalePathReducer, type ScalePathPosition } from '../state/scalePathReducer'
import { normalizeRun } from '../services/scalePathNormalizer'
import '../styles/scale-path.scss'
import '../styles/living-scale-trail.scss'

type Instrument = 'guitar' | 'piano'
type JourneyStage = 'arrival' | 'rolling' | 'playing'

const nearestPianoMidi = (pitch: number, centre = 60) => {
  const below = centre - ((centre - pitch + 120) % 12)
  return below < 48 ? below + 12 : below > 72 ? below - 12 : below
}

const guitarMidi = (position: ScalePathPosition) => STANDARD_GUITAR_MIDI[position.stringIndex] + position.fret

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

  const [announcement, setAnnouncement] = useState('Choose Piano Garden or Guitar Bridge to begin.')
  const [trail, setTrail] = useState<ScalePathPosition[]>([])
  const [wrongBranch, setWrongBranch] = useState<ScalePathPosition | null>(null)
  const [showLabels, setShowLabels] = useState(true)
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
    dispatch({ type: 'RUN_LOADING' })
    setTrail([])
    setWrongBranch(null)
    try {
      const response = await getScalePathRun({})
      const normalized = normalizeRun(response.data)
      dispatch({ type: 'RUN_LOADED', run: normalized })
      setShowLabels(normalized.routeModifier !== 'hidden-labels')
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
      if (state.phase !== 'accepting-input' || !state.fragment) return
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
          setTrail((current) => [...current, candidate])
          setWrongBranch(null)
          setPipState('success')
        } else if (safeLanding) {
          setSafeLanding(false)
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
          () => dispatch({ type: 'NEXT_FRAGMENT' }),
          reducedMotion ? 350 : correct ? 1100 : 1700,
        )
      } catch {
        dispatch({ type: 'ERROR', error: 'Echo lost the route signal. Start a fresh trail to reconnect.' })
      }
    },
    [reducedMotion, safeLanding],
  )

  const spendPower = async (power: 'trace' | 'degrees' | 'safe' | 'compass', cost: number) => {
    if (game.phase !== 'accepting-input' || progressState.focusPoints < cost) return
    const spent = await activity.spendFocus(
      cost,
      power === 'trace'
        ? 'trace-path'
        : power === 'degrees'
          ? 'reveal-anchor'
          : power === 'safe'
            ? 'remove-trap'
            : 'root-lantern',
    )
    if (spent) {
      if (power === 'trace') {
        setShowCompass(true)
        setAnnouncement('Trace One Step reveals the next movement without completing it.')
      }
      if (power === 'degrees') {
        setShowLabels(true)
        window.setTimeout(() => setShowLabels(false), 5000)
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
  const candidateGuitarMidi = useMemo(() => candidates.map(guitarMidi), [candidates])
  const candidatePianoMidi = useMemo(
    () => candidates.map((candidate) => nearestPianoMidi(candidate.pitch)),
    [candidates],
  )
  const routeGuitarMidi = useMemo(() => trail.map(guitarMidi), [trail])
  const routePianoMidi = useMemo(() => trail.map((position) => nearestPianoMidi(position.pitch)), [trail])

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
          <PipCharacter state="curious" label="Pip waits at the trail crossing" />
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
        <PipCharacter state="curious" label="Pip watches the musical die" />
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
            <PipCharacter state={pipState} label={`Pip is ${pipState}`} />
            <div>
              <span>
                Movement {game.fragmentIndex + 1} of {game.fragmentCount}
              </span>
              <h2>{fragment.direction === 'left' ? 'Travel along the string' : 'Cross to the next sound'}</h2>
              <p>
                Start from {fragment.anchor.note}. Find scale degree {fragment.degreeClue}.
              </p>
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
              <GameGuitarFretboard
                activeMidi={routeGuitarMidi}
                legalMidi={candidateGuitarMidi}
                rootPitchClass={fragment.anchor.pitch}
                fretCount={game.run?.fretCount || 12}
                showLabels={showLabels}
                disabled={game.phase !== 'accepting-input'}
                onSelect={(selection) => {
                  const index = candidates.findIndex(
                    (candidate) => candidate.stringIndex === selection.stringIndex && candidate.fret === selection.fret,
                  )
                  if (index >= 0) submitCandidate(candidates[index], index)
                }}
              />
            ) : (
              <GamePianoKeyboard
                activeMidi={routePianoMidi}
                legalMidi={candidatePianoMidi}
                rootPitchClass={fragment.anchor.pitch}
                showLabels={showLabels}
                disabled={game.phase !== 'accepting-input'}
                onSelect={(selection) => {
                  const index = candidates.findIndex((candidate) => candidate.pitch === selection.pitchClass)
                  if (index >= 0) submitCandidate(candidates[index], index, selection.midi)
                }}
              />
            )}
            {wrongBranch && (
              <div className="dead-end-branch" role="status">
                That path fades safely. Pip returns to the last bright note.
              </div>
            )}
          </section>
          <div className="trail-powers" aria-label="Focus powers">
            <button type="button" disabled={game.phase !== 'accepting-input'} onClick={() => spendPower('trace', 1)}>
              <Footprints size={16} /> Trace One Step <b>1</b>
            </button>
            <button type="button" disabled={game.phase !== 'accepting-input'} onClick={() => spendPower('degrees', 2)}>
              Ⅲ Reveal Degrees <b>2</b>
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
          <PipCharacter state="success" label="Pip celebrates at the illuminated landmark" />
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
          <PipCharacter state="mistake" label="Pip waits while the trail reconnects" />
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
