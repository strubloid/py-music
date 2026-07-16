import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { Headphones, Pause, Settings2, XCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useGameProgress } from '../../contexts/GameProgressContext'
import { createEarTrainingAudioEngine, EAR_TRAINING_INSTRUMENTS } from '../../audio/earTrainingAudio'
import { completeDailyChallenge, getDailyChallenges, getUserStreak } from '../../services/api'
import { getModeBaseXp, getPowerById } from '../../game/gameSystem'
import { useActivitySession } from '../../game/progression/useActivitySession'
import SoundGatesGame from '../../features/ear-game/components/SoundGatesGame'
import RewardOverlay from '../../features/ear-game/components/RewardOverlay'
import { createGameInputHandler } from '../../features/ear-game/hooks/gameInput'
import { normalizeEarChallenge, variantForExercise } from '../../features/ear-game/services/challengeNormalizer'
import { calculateRoundScore, updateMasteryWindow } from '../../features/ear-game/services/scoreMastery'
import {
  createInitialEarGameState,
  earGameReducer,
  isGameInputLocked,
} from '../../features/ear-game/state/earGameReducer'
import './EarTrainingShell.scss'

const FETCH_LIMIT = 24
const RUN_LENGTH = 5
const COMPLETED_IDS_KEY = 'strubloid:completed-ear-training-ids'
const GAME_SETTINGS_KEY = 'strubloid:note-runner-settings'
const MASTERY_KEY = 'strubloid:ear-mastery'
const RUNS_KEY = 'strubloid:note-runner-runs'

const readJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback))
  } catch {
    return fallback
  }
}

const rememberCompletedChallengeId = (challengeId) => {
  const ids = new Set(readJson(COMPLETED_IDS_KEY, []))
  ids.add(challengeId)
  sessionStorage.setItem(COMPLETED_IDS_KEY, JSON.stringify([...ids]))
  localStorage.setItem(COMPLETED_IDS_KEY, JSON.stringify([...ids]))
}

const completedChallengeIds = () => {
  try {
    const sessionIds = JSON.parse(sessionStorage.getItem(COMPLETED_IDS_KEY) || '[]')
    return [...new Set([...readJson(COMPLETED_IDS_KEY, []), ...sessionIds])]
  } catch {
    return readJson(COMPLETED_IDS_KEY, [])
  }
}

const initialSettings = () => {
  const saved = readJson(GAME_SETTINGS_KEY, {})
  const systemReducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false
  return {
    reducedMotion: saved.reducedMotion ?? systemReducedMotion,
    autoAdvance: saved.autoAdvance ?? true,
    unlimitedTime: saved.unlimitedTime ?? false,
    highContrast: saved.highContrast ?? false,
    mappings: saved.mappings || {},
  }
}

const EarTraining = () => {
  const { user, isLoggedIn, updateUserProgress } = useAuth()
  const { unlockedPowers, consumeFocus, recordChallengeResult, progressState, rankMeta } = useGameProgress()
  const settingsRef = useRef(initialSettings())
  const [game, dispatch] = useReducer(earGameReducer, null, () =>
    createInitialEarGameState({ challengeCount: RUN_LENGTH, reducedMotion: settingsRef.current.reducedMotion }),
  )
  const activity = useActivitySession('sound-gates', !['loading', 'ready', 'run-complete'].includes(game.phase))
  const gameRef = useRef(game)
  const actionRef = useRef<(action: any, inputMode?: string) => void>(() => {})
  const answerCommitRef = useRef(false)
  const audioRef = useRef(null)
  const playbackTimerRef = useRef(null)
  const transitionTimerRef = useRef(null)
  const inputSignalTimerRef = useRef(null)
  const questionStartedRef = useRef(Date.now())
  const worldRef = useRef(null)
  const modalRef = useRef<HTMLDivElement | null>(null)
  const [streak, setStreak] = useState(0)
  const [result, setResult] = useState(null)
  const [announcement, setAnnouncement] = useState('Note Runner is loading.')
  const [inputSignal, setInputSignal] = useState({ action: null, label: 'Keyboard ready', locked: false })
  const [selectedInstrument, setSelectedInstrument] = useState(() => {
    const preference = user?.instrument_preference
    return EAR_TRAINING_INSTRUMENTS.some((item) => item.id === preference) ? preference : 'piano'
  })
  const selectedInstrumentRef = useRef(selectedInstrument)
  const [audioState, setAudioState] = useState({
    audioReady: false,
    loadedInstrumentIds: [],
    loadingInstrumentId: null,
  })
  const [hiddenAnswerIds, setHiddenAnswerIds] = useState([])
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settings, setSettings] = useState(settingsRef.current)

  gameRef.current = game
  settingsRef.current = settings
  selectedInstrumentRef.current = selectedInstrument

  if (!audioRef.current) {
    audioRef.current = createEarTrainingAudioEngine({ onStateChange: setAudioState })
  }

  const clearTimersAndAudio = useCallback(() => {
    if (playbackTimerRef.current) window.clearTimeout(playbackTimerRef.current)
    if (transitionTimerRef.current) window.clearTimeout(transitionTimerRef.current)
    playbackTimerRef.current = null
    transitionTimerRef.current = null
    audioRef.current?.stop()
  }, [])

  const updateSettings = useCallback((changes) => {
    setSettings((current) => {
      const next = { ...current, ...changes }
      localStorage.setItem(GAME_SETTINGS_KEY, JSON.stringify(next))
      return next
    })
    if (Object.hasOwn(changes, 'reducedMotion')) dispatch({ type: 'SET_REDUCED_MOTION', value: changes.reducedMotion })
  }, [])

  const updateControlMapping = useCallback(
    (action, code) => {
      const mappings = Object.fromEntries(
        Object.entries(settingsRef.current.mappings).filter(([, mappedAction]) => mappedAction !== action),
      )
      mappings[code] = action
      updateSettings({ mappings })
    },
    [updateSettings],
  )

  const loadChallenge = useCallback(async (excludeIds = []) => {
    dispatch({ type: 'CHALLENGE_LOADING' })
    setResult(null)
    setHiddenAnswerIds([])
    try {
      const exclusions = [...new Set([...completedChallengeIds(), ...excludeIds])]
      let raw = null
      for (let attempt = 0; attempt < 3 && !raw; attempt += 1) {
        const response = await getDailyChallenges(FETCH_LIMIT, attempt * FETCH_LIMIT, {
          random: true,
          excludeIds: exclusions,
        })
        const available = response.data.challenges.filter(
          (item) => item.category === 'ear_training' && !exclusions.includes(item.id),
        )
        const previousVariant = gameRef.current.challenge?.variant
        raw =
          available.find((item) => variantForExercise(item.exercise?.type || item.question_type) !== previousVariant) ||
          available[0]
      }
      if (!raw) throw new Error('No ear-training challenge is available.')
      const normalized = normalizeEarChallenge(raw, { instrumentId: selectedInstrumentRef.current })
      dispatch({ type: 'CHALLENGE_LOADED', challenge: normalized })
      setAnnouncement(`${normalized.title} ready. Activate the listening beacon to hear the musical question.`)
    } catch (error) {
      dispatch({ type: 'ERROR', error: error.message || 'Failed to load an ear-training prompt.' })
    }
  }, [])

  const playPrompt = useCallback(
    async ({ slow = false, replay = false, preservePhase = false } = {}) => {
      const state = gameRef.current
      const challenge = state.challenge
      if (!challenge || state.phase === 'playing-prompt') return
      if (replay) dispatch({ type: 'REPLAY' })
      if (!preservePhase) dispatch({ type: 'PROMPT_STARTED' })
      audioRef.current.stop()
      setAnnouncement('Playing musical question.')
      try {
        await audioRef.current.ensureContext()
        const exercise = challenge.raw.exercise
        const timingScale = slow ? 1.5 : 1
        let playback
        if (exercise.chords?.length > 1) {
          playback = await audioRef.current.playChordSequence({
            instrumentId: selectedInstrument,
            chords: exercise.chords,
            timingScale,
          })
        } else if (exercise.chords?.length === 1) {
          playback = await audioRef.current.playChord({
            instrumentId: selectedInstrument,
            notes: exercise.chords[0],
            timingScale,
          })
        } else if (exercise.notes?.length > 2 || ['shape', 'direction'].includes(exercise.type)) {
          playback = await audioRef.current.playNoteSequence({
            instrumentId: selectedInstrument,
            notes: exercise.notes,
            timingScale,
          })
        } else {
          playback = await audioRef.current.playInterval({
            instrumentId: selectedInstrument,
            mode: 'melodic',
            rootToneNote: exercise.notes[0],
            targetToneNote: exercise.notes[1],
            timingScale,
          })
        }
        if (playbackTimerRef.current) window.clearTimeout(playbackTimerRef.current)
        playbackTimerRef.current = window.setTimeout(() => {
          if (!preservePhase) dispatch({ type: 'PROMPT_ENDED' })
          questionStartedRef.current = Date.now()
          setAnnouncement(
            `Prompt finished. ${challenge.answers[gameRef.current.avatarLane]?.label || 'First gate'} selected.`,
          )
        }, playback.durationMs)
      } catch {
        dispatch({
          type: 'ERROR',
          error: 'The musical prompt could not play. Check browser sound permissions and try again.',
        })
        setAnnouncement('Audio error. The prompt could not play.')
      }
    },
    [selectedInstrument],
  )

  const persistMastery = useCallback((challenge, attempt) => {
    const allMastery = readJson(MASTERY_KEY, {})
    const current = allMastery[challenge.category] || { level: challenge.difficulty, attempts: [] }
    allMastery[challenge.category] = updateMasteryWindow(current, attempt)
    localStorage.setItem(MASTERY_KEY, JSON.stringify(allMastery))
  }, [])

  const scheduleNext = useCallback(
    (delay = 2600) => {
      if (!settingsRef.current.autoAdvance) return
      if (transitionTimerRef.current) window.clearTimeout(transitionTimerRef.current)
      transitionTimerRef.current = window.setTimeout(() => {
        const current = gameRef.current
        dispatch({ type: 'NEXT_ROUND' })
        if (current.challengeIndex + 1 < current.challengeCount) loadChallenge([current.challenge.sourceChallengeId])
      }, delay)
    },
    [loadChallenge],
  )

  const commitAnswer = useCallback(
    async (answerId = gameRef.current.selectedAnswerId) => {
      const state = gameRef.current
      if (state.phase !== 'accepting-input' || !state.challenge || !answerId || answerCommitRef.current) return
      answerCommitRef.current = true
      if (answerId !== state.selectedAnswerId) dispatch({ type: 'SELECT_ANSWER', answerId, inputMode: 'pointer' })
      const challenge = state.challenge
      const responseMs = Date.now() - questionStartedRef.current
      const assists = state.usedPowers.length
      const earTrainingBaseXp = getModeBaseXp({ mode: 'ear-training', difficulty: challenge.difficulty })

      dispatch({ type: 'COMMIT_ANSWER' })
      clearTimersAndAudio()
      let awardedXp = 0
      // The server is the source of truth: look up the lane of the answer we
      // picked and submit that index. The browser never decides correctness.
      const selectedAnswer = (challenge.answers || []).find((answer) => answer.id === answerId)
      const submittedAnswerIndex = selectedAnswer ? selectedAnswer.lane : -1
      let serverCorrect = false
      let serverXp = 0
      try {
        if (submittedAnswerIndex >= 0) {
          const response = await completeDailyChallenge(challenge.sourceChallengeId, {
            mode: 'ear-training',
            submitted_answer: submittedAnswerIndex,
          })
          serverCorrect = Boolean(response.data.correct)
          serverXp = response.data.xp_awarded || 0
          challenge.explanation.correctLabel = response.data.correct_answer || ''
          if (serverCorrect) {
            awardedXp = serverXp
            updateUserProgress({ xp: response.data.xp, level: response.data.level })
            const streakResponse = await getUserStreak()
            setStreak(streakResponse.data.streak || 0)
          }
        }
      } catch (error) {
        if (error.response?.status !== 400)
          setAnnouncement('Answer saved locally. Account progress could not be updated.')
      }
      // Use the server's verdict; only treat as correct when validated above.
      const finalCorrect = serverCorrect
      const scoreDelta = calculateRoundScore({
        base: earTrainingBaseXp,
        correct: finalCorrect,
        firstAttempt: true,
        replays: state.replayCount,
        combo: state.combo,
        difficulty: challenge.difficulty,
        assists,
      })
      const resolved = {
        correct: finalCorrect,
        selectedAnswerId: answerId,
        selectedLabel: challenge.answers.find((answer) => answer.id === answerId)?.label,
        correctLabel: challenge.explanation.correctLabel,
        awardedXp,
        responseMs,
      }
      setResult(resolved)
      dispatch({ type: 'ANSWER_RESOLVED', correct: finalCorrect, scoreDelta })
      rememberCompletedChallengeId(challenge.sourceChallengeId)
      persistMastery(challenge, { correct: finalCorrect, responseMs, replays: state.replayCount })
      recordChallengeResult({
        challengeId: `${challenge.sourceChallengeId}`,
        mode: challenge.type,
        score: finalCorrect ? 1 : 0,
        accuracy: finalCorrect ? 1 : 0,
        xpEarned: awardedXp,
        maxCombo: finalCorrect ? state.combo + 1 : state.maxCombo,
        powersUsed: state.usedPowers,
        hadMistake: !finalCorrect,
        completedAt: new Date().toISOString(),
      })
      setAnnouncement(
        finalCorrect
          ? `Correct. ${challenge.explanation.summary} ${awardedXp ? `Awarded ${awardedXp} XP.` : ''}`
          : `Not this gate. The correct answer is ${challenge.explanation.correctLabel}. ${challenge.explanation.summary}`,
      )
      scheduleNext(finalCorrect ? 1900 : 3400)
      answerCommitRef.current = false
    },
    [clearTimersAndAudio, persistMastery, scheduleNext, updateUserProgress],
  )

  const playComparison = useCallback(async () => {
    const state = gameRef.current
    if (!state.challenge || !result || !['showing-incorrect', 'showing-correct'].includes(state.phase)) return
    if (transitionTimerRef.current) window.clearTimeout(transitionTimerRef.current)
    dispatch({ type: 'SHOW_COMPARISON' })
    setAnnouncement(`Comparison: your answer was ${result.selectedLabel}. Correct answer: ${result.correctLabel}.`)
    try {
      await playPrompt({ preservePhase: true })
      window.setTimeout(() => {
        dispatch({ type: 'COMPARISON_ENDED' })
        scheduleNext(1500)
      }, 2800)
    } catch {
      dispatch({ type: 'COMPARISON_ENDED' })
    }
  }, [playPrompt, result, scheduleNext])

  const usePower = useCallback(
    async (powerId) => {
      const state = gameRef.current
      if (!state.challenge || state.phase !== 'accepting-input' || state.usedPowers.includes(powerId)) return
      const power = getPowerById(powerId)
      let powerResult = null
      if (power?.focusCost) {
        if (isLoggedIn) {
          powerResult = await activity.activateSoundPower(powerId, state.challenge.sourceChallengeId)
          if (!powerResult) {
            setAnnouncement('That power could not activate. Check your Focus and try again.')
            return
          }
        } else {
          if (powerId === 'remove_one_option') {
            setAnnouncement('Sign in to use Remove One Gate without exposing the hidden answer key.')
            return
          }
          if (!consumeFocus(power.focusCost)) {
            setAnnouncement('Not enough focus for that power.')
            return
          }
        }
      }
      dispatch({ type: 'POWER_USED', powerId })
      if (powerId === 'remove_one_option') {
        const removable = Number.isInteger(powerResult?.eliminated_index)
          ? state.challenge.answers[powerResult.eliminated_index]
          : null
        if (removable) setHiddenAnswerIds((current) => [...current, removable.id])
      }
      if (powerId === 'slow_down') playPrompt({ slow: true, replay: true })
      if (powerId === 'replay') playPrompt({ replay: true })
      if (powerId === 'root_note_anchor') {
        const rootNote = powerResult?.root_note || state.challenge.prompt.events[0]?.note
        if (rootNote) {
          audioRef.current?.playNoteSequence({ instrumentId: selectedInstrument, notes: [rootNote] })
          setAnnouncement(`Root Lantern illuminated ${rootNote}.`)
        }
      }
    },
    [activity, consumeFocus, isLoggedIn, playPrompt, selectedInstrument],
  )

  const nextRound = useCallback(() => {
    const state = gameRef.current
    if (!['showing-correct', 'showing-incorrect'].includes(state.phase)) return
    if (transitionTimerRef.current) window.clearTimeout(transitionTimerRef.current)
    dispatch({ type: 'NEXT_ROUND' })
    if (state.challengeIndex + 1 < state.challengeCount) loadChallenge([state.challenge.sourceChallengeId])
  }, [loadChallenge])

  const dispatchGameAction = useCallback(
    (action, inputMode = 'keyboard') => {
      const state = gameRef.current
      const lockedAction =
        ['move-left', 'move-right', 'jump', 'confirm'].includes(action) &&
        isGameInputLocked(state) &&
        !(state.phase === 'ready' && ['jump', 'confirm'].includes(action))
      const labels = {
        'move-left': 'Pip moved left',
        'move-right': 'Pip moved right',
        jump: state.phase === 'ready' ? 'Starting the sound' : 'Gate committed',
        confirm: state.phase === 'ready' ? 'Starting the sound' : 'Gate committed',
        replay: 'Prompt replayed',
        'slow-replay': 'Slow replay',
        hint: 'Hint power',
        compare: 'A/B comparison',
        pause: state.phase === 'paused' ? 'Run resumed' : 'Run paused',
        mute: state.muted ? 'Effects on' : 'Effects muted',
      }
      setInputSignal({
        action,
        label: lockedAction ? 'Controls unlock when the sound ends' : labels[action] || 'Shortcut accepted',
        locked: lockedAction,
      })
      if (inputSignalTimerRef.current) window.clearTimeout(inputSignalTimerRef.current)
      inputSignalTimerRef.current = window.setTimeout(() => {
        setInputSignal({ action: null, label: 'Keyboard ready', locked: false })
      }, 900)
      if (action === 'pause') {
        if (state.phase === 'paused') {
          dispatch({ type: 'RESUME' })
          if (['showing-correct', 'showing-incorrect'].includes(state.resumePhase)) scheduleNext(1800)
        } else {
          clearTimersAndAudio()
          dispatch({ type: 'PAUSE' })
        }
        return
      }
      if (action === 'mute') {
        dispatch({ type: 'TOGGLE_MUTE' })
        return
      }
      if (state.phase === 'paused') return
      if (action === 'move-left' || action === 'move-right') {
        dispatch({ type: 'MOVE', direction: action === 'move-left' ? -1 : 1, inputMode })
        return
      }
      if (action.startsWith('lane-')) {
        const lane = Number(action.slice(5)) - 1
        const answer = state.challenge?.answers[lane]
        if (answer) {
          dispatch({ type: 'SELECT_ANSWER', answerId: answer.id, inputMode })
          window.setTimeout(() => commitAnswer(answer.id), 0)
        }
        return
      }
      if (['jump', 'confirm'].includes(action)) {
        if (state.phase === 'ready') playPrompt()
        else if (state.phase === 'accepting-input') commitAnswer()
        else if (['showing-correct', 'showing-incorrect'].includes(state.phase)) nextRound()
        return
      }
      if (action === 'replay') {
        if (state.phase === 'accepting-input') usePower('replay')
        else playPrompt({ replay: state.phase !== 'ready', preservePhase: state.phase.startsWith('showing-') })
      }
      if (action === 'slow-replay' && state.phase === 'accepting-input') usePower('slow_down')
      if (action === 'hint') usePower('remove_one_option')
      if (action === 'compare') playComparison()
    },
    [clearTimersAndAudio, commitAnswer, nextRound, playComparison, playPrompt, scheduleNext, usePower],
  )

  actionRef.current = dispatchGameAction

  useEffect(() => {
    loadChallenge()
    if (isLoggedIn)
      getUserStreak()
        .then((response) => setStreak(response.data.streak || 0))
        .catch(() => {})
    return () => {
      clearTimersAndAudio()
      if (inputSignalTimerRef.current) window.clearTimeout(inputSignalTimerRef.current)
      audioRef.current?.dispose()
    }
  }, [clearTimersAndAudio, isLoggedIn, loadChallenge])

  useEffect(() => {
    const handler = createGameInputHandler({
      getState: () => gameRef.current,
      dispatchAction: (action, inputMode) => actionRef.current(action, inputMode),
      mappings: settings.mappings,
    })
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [settings.mappings])

  useEffect(() => {
    if (window.innerWidth > 620) return
    const selectedGate = worldRef.current?.querySelector('[role="radio"][aria-checked="true"]')
    selectedGate?.scrollIntoView({
      behavior: game.reducedMotion ? 'auto' : 'smooth',
      block: 'nearest',
      inline: 'center',
    })
  }, [game.avatarLane, game.reducedMotion])

  useEffect(() => {
    const pauseWhenHidden = () => {
      if (document.hidden && !['paused', 'loading', 'run-complete'].includes(gameRef.current.phase)) {
        clearTimersAndAudio()
        dispatch({ type: 'PAUSE' })
      }
    }
    document.addEventListener('visibilitychange', pauseWhenHidden)
    return () => document.removeEventListener('visibilitychange', pauseWhenHidden)
  }, [clearTimersAndAudio])

  useEffect(() => {
    if (game.phase !== 'run-complete' || game.persisted) return
    const runs = readJson(RUNS_KEY, [])
    runs.push({
      runId: game.runId,
      completedAt: new Date().toISOString(),
      score: game.score,
      accuracy: game.correctCount / game.challengeCount,
      correctCount: game.correctCount,
      challengeCount: game.challengeCount,
      maxCombo: game.maxCombo,
    })
    localStorage.setItem(RUNS_KEY, JSON.stringify(runs.slice(-50)))
    recordChallengeResult({
      challengeId: game.runId,
      mode: 'note-runner-run',
      score: game.score,
      accuracy: game.correctCount / game.challengeCount,
      xpEarned: 0,
      maxCombo: game.maxCombo,
      completedAt: new Date().toISOString(),
    })
    activity
      .finish()
      .catch(() => setAnnouncement('Run saved locally; city Focus will sync when the connection returns.'))
    dispatch({ type: 'RUN_PERSISTED' })
  }, [activity, game, recordChallengeResult])

  const selectAnswer = useCallback((answerId, inputMode = 'pointer') => {
    dispatch({ type: 'SELECT_ANSWER', answerId, inputMode })
    const answer = gameRef.current.challenge?.answers.find((item) => item.id === answerId)
    if (answer) setAnnouncement(`${answer.label} selected. Activate the gate again or press Enter to commit.`)
  }, [])

  const restartRun = useCallback(() => {
    clearTimersAndAudio()
    answerCommitRef.current = false
    activity.reset()
    dispatch({ type: 'RUN_RESET' })
    loadChallenge()
  }, [activity, clearTimersAndAudio, loadChallenge])

  const openSettings = useCallback(() => {
    if (!['ready', 'accepting-input'].includes(gameRef.current.phase)) return
    clearTimersAndAudio()
    dispatch({ type: 'PAUSE' })
    setSettingsOpen(true)
  }, [clearTimersAndAudio])

  const closeSettings = useCallback(() => {
    setSettingsOpen(false)
    dispatch({ type: 'RESUME' })
  }, [])

  useEffect(() => {
    if (!settingsOpen && game.phase !== 'paused') return undefined
    const previousFocus = document.activeElement as HTMLElement | null
    const dialog = modalRef.current
    const focusable = () => [
      ...(dialog?.querySelectorAll<HTMLElement>('button:not(:disabled), select:not(:disabled), input:not(:disabled)') ||
        []),
    ]
    focusable()[0]?.focus()
    const handleModalKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        if (settingsOpen) closeSettings()
        else dispatchGameAction('pause')
        return
      }
      if (event.key !== 'Tab') return
      const controls = focusable()
      if (!controls.length) return
      const first = controls[0]
      const last = controls[controls.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleModalKey)
    return () => {
      document.removeEventListener('keydown', handleModalKey)
      previousFocus?.focus?.()
    }
  }, [closeSettings, dispatchGameAction, game.phase, settingsOpen])

  const powers = useMemo(() => {
    const supported = ['replay', 'slow_down', 'remove_one_option', 'root_note_anchor']
    return unlockedPowers.filter((power) => supported.includes(power.id))
  }, [unlockedPowers])
  const selectedInstrumentMeta = EAR_TRAINING_INSTRUMENTS.find((item) => item.id === selectedInstrument)
  const challenge = game.challenge
  const playing = game.phase === 'playing-prompt' || game.phase === 'comparison'
  const inputDisabled = isGameInputLocked(game)
  const avatarState =
    game.phase === 'playing-prompt'
      ? 'listening'
      : game.phase === 'showing-correct'
        ? 'celebrating'
        : game.phase === 'showing-incorrect'
          ? 'wobble'
          : game.phase === 'paused'
            ? 'paused'
            : 'idle'

  if (game.phase === 'loading' && !challenge) {
    return (
      <main className="note-runner note-runner--loading">
        <Headphones />
        <h1>Note Runner</h1>
        <p>Building the listening stage…</p>
      </main>
    )
  }

  if (game.phase === 'error') {
    return (
      <main className="note-runner note-runner--error">
        <XCircle />
        <h1>The stage went quiet</h1>
        <p>{game.error}</p>
        <button type="button" onClick={() => loadChallenge()}>
          Try again
        </button>
      </main>
    )
  }

  if (game.phase === 'run-complete') {
    const accuracy = Math.round((game.correctCount / game.challengeCount) * 100)
    const rankEvent = progressState.lastRankEvent?.runId === game.runId ? progressState.lastRankEvent : null
    const rankMessage =
      rankEvent?.type === 'rank-up'
        ? `${rankEvent.previousRank} cleared — welcome to ${rankEvent.rank}.`
        : rankEvent?.type === 'challenge-unlocked'
          ? `${rankEvent.rank} complete. Your next run is the rank challenge.`
          : rankEvent?.type === 'challenge-failed'
            ? `Rank challenge needs 80% accuracy. Stay at ${rankEvent.rank} and try again.`
            : rankEvent?.type === 'complete'
              ? 'Legendary complete. Every rank level is yours.'
              : `${rankMeta.name} progress follows account Level ${rankMeta.accountLevel}.`
    return (
      <RewardOverlay
        accuracy={accuracy}
        game={game}
        rankEvent={rankEvent}
        rankMeta={{ ...rankMeta, progressLabel: rankMessage }}
        onContinue={restartRun}
      />
    )
  }

  return (
    <>
      <SoundGatesGame
        game={game}
        challenge={challenge}
        result={result}
        hiddenAnswerIds={hiddenAnswerIds}
        avatarState={avatarState}
        playing={playing}
        inputSignal={{ ...inputSignal, announcement }}
        powers={powers}
        powersReady={!isLoggedIn || activity.status === 'active'}
        focus={progressState.focusPoints}
        rankMeta={rankMeta}
        streak={streak}
        instrument={selectedInstrument}
        instruments={EAR_TRAINING_INSTRUMENTS}
        audioState={audioState}
        highContrast={settings.highContrast}
        bossMode={rankMeta.challengePending}
        onPlay={() => {
          if (game.phase === 'accepting-input') usePower('replay')
          else playPrompt({ replay: game.phase !== 'ready', preservePhase: game.phase.startsWith('showing-') })
        }}
        onSelect={selectAnswer}
        onCommit={commitAnswer}
        onCompare={playComparison}
        onNext={nextRound}
        onUsePower={usePower}
        onInstrumentChange={setSelectedInstrument}
        onAction={dispatchGameAction}
        onOpenSettings={openSettings}
      />

      {game.phase === 'paused' && !settingsOpen && (
        <div className="game-modal" role="dialog" aria-modal="true" aria-labelledby="pause-title" ref={modalRef}>
          <div className="game-modal__panel">
            <Pause />
            <h2 id="pause-title">Run paused</h2>
            <p>The timer and musical prompt are stopped. Your current gate is safe.</p>
            <button
              type="button"
              className="note-runner__primary"
              autoFocus
              onClick={() => dispatchGameAction('pause')}
            >
              Resume run
            </button>
            <button type="button" onClick={restartRun}>
              Restart run
            </button>
          </div>
        </div>
      )}

      {settingsOpen && (
        <div className="game-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title" ref={modalRef}>
          <div className="game-modal__panel game-modal__panel--settings">
            <Settings2 />
            <h2 id="settings-title">Game accessibility</h2>
            <label>
              <span>
                Reduced motion<small>Replace movement with state fades.</small>
              </span>
              <input
                type="checkbox"
                checked={settings.reducedMotion}
                onChange={(event) => updateSettings({ reducedMotion: event.target.checked })}
              />
            </label>
            <label>
              <span>
                High contrast<small>Increase gate and focus contrast.</small>
              </span>
              <input
                type="checkbox"
                checked={settings.highContrast}
                onChange={(event) => updateSettings({ highContrast: event.target.checked })}
              />
            </label>
            <label>
              <span>
                Auto-advance<small>Move on after feedback automatically.</small>
              </span>
              <input
                type="checkbox"
                checked={settings.autoAdvance}
                onChange={(event) => updateSettings({ autoAdvance: event.target.checked })}
              />
            </label>
            <label>
              <span>
                Unlimited response time<small>Never use speed for the confidence bonus.</small>
              </span>
              <input
                type="checkbox"
                checked={settings.unlimitedTime}
                onChange={(event) => updateSettings({ unlimitedTime: event.target.checked })}
              />
            </label>
            <div className="control-mapping">
              <strong>Control mapping</strong>
              {[
                ['move-left', 'Move left', 'KeyA'],
                ['move-right', 'Move right', 'KeyD'],
                ['confirm', 'Commit', 'Enter'],
                ['replay', 'Replay', 'KeyR'],
              ].map(([action, label, fallback]) => (
                <label key={action}>
                  <span>{label}</span>
                  <select
                    aria-label={`${label} key`}
                    value={Object.entries(settings.mappings).find(([, mapped]) => mapped === action)?.[0] || fallback}
                    onChange={(event) => updateControlMapping(action, event.target.value)}
                  >
                    <option value="KeyA">A</option>
                    <option value="KeyD">D</option>
                    <option value="KeyJ">J</option>
                    <option value="KeyL">L</option>
                    <option value="ArrowLeft">Left arrow</option>
                    <option value="ArrowRight">Right arrow</option>
                    <option value="Enter">Enter</option>
                    <option value="Space">Space</option>
                    <option value="KeyR">R</option>
                    <option value="KeyF">F</option>
                  </select>
                </label>
              ))}
            </div>
            <button type="button" className="note-runner__primary" autoFocus onClick={closeSettings}>
              Done
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default EarTraining
