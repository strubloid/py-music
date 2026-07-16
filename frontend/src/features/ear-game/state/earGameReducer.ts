const LOCKED_PHASES = new Set([
  'loading',
  'ready',
  'intro',
  'playing-prompt',
  'committing-answer',
  'showing-correct',
  'showing-incorrect',
  'comparison',
  'round-transition',
  'paused',
  'run-complete',
  'error',
])

export const createInitialEarGameState = ({ challengeCount = 5, reducedMotion = false } = {}) => ({
  phase: 'loading',
  resumePhase: null,
  runId: globalThis.crypto?.randomUUID?.() || `run-${Date.now()}`,
  challengeIndex: 0,
  challengeCount,
  challenge: null,
  selectedAnswerId: null,
  avatarLane: 0,
  score: 0,
  combo: 0,
  maxCombo: 0,
  correctCount: 0,
  replayCount: 0,
  usedPowers: [],
  inputLocked: true,
  reducedMotion,
  error: null,
  persisted: false,
  muted: false,
  inputMode: 'keyboard',
})

export const isGameInputLocked = (state) => state.inputLocked || LOCKED_PHASES.has(state.phase)

const answerAtLane = (challenge, lane) => challenge?.answers?.find((answer) => answer.lane === lane) || null

export const earGameReducer = (state, event) => {
  switch (event.type) {
    case 'RUN_RESET':
      return createInitialEarGameState({ challengeCount: state.challengeCount, reducedMotion: state.reducedMotion })
    case 'CHALLENGE_LOADING':
      return { ...state, phase: 'loading', challenge: null, selectedAnswerId: null, inputLocked: true, error: null }
    case 'CHALLENGE_LOADED': {
      const firstAnswer = event.challenge.answers?.[0] || null
      return {
        ...state,
        phase: 'ready',
        challenge: event.challenge,
        selectedAnswerId: firstAnswer?.id || null,
        avatarLane: firstAnswer?.lane || 0,
        replayCount: 0,
        usedPowers: [],
        inputLocked: true,
        error: null,
      }
    }
    case 'PROMPT_STARTED':
      if (!['ready', 'accepting-input'].includes(state.phase)) return state
      return { ...state, phase: 'playing-prompt', inputLocked: true }
    case 'PROMPT_ENDED':
      if (state.phase !== 'playing-prompt') return state
      return { ...state, phase: 'accepting-input', inputLocked: false }
    case 'MOVE': {
      if (isGameInputLocked(state) || !state.challenge?.answers?.length) return state
      const laneCount = state.challenge.answers.length
      const nextLane = (state.avatarLane + event.direction + laneCount) % laneCount
      const answer = answerAtLane(state.challenge, nextLane)
      return answer
        ? { ...state, avatarLane: nextLane, selectedAnswerId: answer.id, inputMode: event.inputMode || 'keyboard' }
        : state
    }
    case 'SELECT_ANSWER': {
      if (isGameInputLocked(state)) return state
      const answer = state.challenge?.answers?.find((item) => item.id === event.answerId)
      return answer
        ? {
            ...state,
            avatarLane: answer.lane,
            selectedAnswerId: answer.id,
            inputMode: event.inputMode || state.inputMode,
          }
        : state
    }
    case 'COMMIT_ANSWER':
      if (isGameInputLocked(state) || !state.selectedAnswerId) return state
      return { ...state, phase: 'committing-answer', inputLocked: true }
    case 'ANSWER_RESOLVED': {
      if (state.phase !== 'committing-answer') return state
      const combo = event.correct ? state.combo + 1 : 0
      return {
        ...state,
        phase: event.correct ? 'showing-correct' : 'showing-incorrect',
        score: state.score + (event.scoreDelta || 0),
        combo,
        maxCombo: Math.max(state.maxCombo, combo),
        correctCount: state.correctCount + (event.correct ? 1 : 0),
        inputLocked: true,
      }
    }
    case 'SHOW_COMPARISON':
      if (!['showing-correct', 'showing-incorrect'].includes(state.phase)) return state
      return { ...state, resumePhase: state.phase, phase: 'comparison', inputLocked: true }
    case 'COMPARISON_ENDED':
      if (state.phase !== 'comparison') return state
      return { ...state, phase: state.resumePhase || 'showing-incorrect', resumePhase: null, inputLocked: true }
    case 'NEXT_ROUND': {
      if (!['showing-correct', 'showing-incorrect', 'round-transition'].includes(state.phase)) return state
      const nextIndex = state.challengeIndex + 1
      if (nextIndex >= state.challengeCount) {
        return { ...state, phase: 'run-complete', challengeIndex: nextIndex, inputLocked: true }
      }
      return {
        ...state,
        phase: 'round-transition',
        challengeIndex: nextIndex,
        challenge: null,
        selectedAnswerId: null,
        inputLocked: true,
      }
    }
    case 'REPLAY':
      return { ...state, replayCount: state.replayCount + 1 }
    case 'POWER_USED':
      return state.usedPowers.includes(event.powerId)
        ? state
        : { ...state, usedPowers: [...state.usedPowers, event.powerId] }
    case 'PAUSE':
      if (['paused', 'run-complete', 'loading', 'error'].includes(state.phase)) return state
      return { ...state, resumePhase: state.phase, phase: 'paused', inputLocked: true }
    case 'RESUME':
      if (state.phase !== 'paused') return state
      if (state.resumePhase === 'playing-prompt') {
        return { ...state, phase: 'ready', resumePhase: null, inputLocked: true }
      }
      return { ...state, phase: state.resumePhase || 'accepting-input', resumePhase: null, inputLocked: false }
    case 'SET_INPUT_MODE':
      return { ...state, inputMode: event.inputMode }
    case 'SET_REDUCED_MOTION':
      return { ...state, reducedMotion: event.value }
    case 'TOGGLE_MUTE':
      return { ...state, muted: !state.muted }
    case 'RUN_PERSISTED':
      return state.persisted ? state : { ...state, persisted: true }
    case 'ERROR':
      return { ...state, phase: 'error', inputLocked: true, error: event.error || 'The game could not continue.' }
    default:
      return state
  }
}
