import test from 'node:test'
import assert from 'node:assert/strict'

import { createInitialEarGameState, earGameReducer, isGameInputLocked } from '../state/earGameReducer'
import { actionForKeyboardEvent, shouldIgnoreGameShortcut } from '../hooks/gameInput'
import { normalizeEarChallenge, variantForExercise } from '../services/challengeNormalizer'

const challenge = {
  id: 'challenge-1',
  answers: [
    { id: 'a', lane: 0, label: 'Major' },
    { id: 'b', lane: 1, label: 'Minor' },
  ],
  correctAnswerId: 'a',
}

test('locked phases ignore movement and answer commits cannot submit twice', () => {
  let state = createInitialEarGameState({ challengeCount: 5 })
  state = earGameReducer(state, { type: 'CHALLENGE_LOADED', challenge })
  assert.equal(state.phase, 'ready')
  assert.equal(isGameInputLocked(state), true)
  assert.equal(earGameReducer(state, { type: 'MOVE', direction: 1 }), state)

  state = earGameReducer(state, { type: 'PROMPT_STARTED' })
  state = earGameReducer(state, { type: 'PROMPT_ENDED' })
  state = earGameReducer(state, { type: 'MOVE', direction: 1 })
  assert.equal(state.selectedAnswerId, 'b')
  state = earGameReducer(state, { type: 'COMMIT_ANSWER' })
  assert.equal(state.phase, 'committing-answer')
  assert.equal(earGameReducer(state, { type: 'COMMIT_ANSWER' }), state)
})

test('five resolved rounds reach run complete with score and combo', () => {
  let state = createInitialEarGameState({ challengeCount: 5 })
  for (let index = 0; index < 5; index += 1) {
    state = earGameReducer(state, { type: 'CHALLENGE_LOADED', challenge: { ...challenge, id: `c-${index}` } })
    state = earGameReducer(state, { type: 'PROMPT_STARTED' })
    state = earGameReducer(state, { type: 'PROMPT_ENDED' })
    state = earGameReducer(state, { type: 'SELECT_ANSWER', answerId: 'a' })
    state = earGameReducer(state, { type: 'COMMIT_ANSWER' })
    state = earGameReducer(state, { type: 'ANSWER_RESOLVED', correct: true, scoreDelta: 100 })
    state = earGameReducer(state, { type: 'NEXT_ROUND' })
  }
  assert.equal(state.phase, 'run-complete')
  assert.equal(state.correctCount, 5)
  assert.equal(state.score, 500)
  assert.equal(state.maxCombo, 5)
})

test('pause restores the previous phase and freezes input', () => {
  let state = createInitialEarGameState()
  state = earGameReducer(state, { type: 'CHALLENGE_LOADED', challenge })
  state = earGameReducer(state, { type: 'PROMPT_STARTED' })
  state = earGameReducer(state, { type: 'PROMPT_ENDED' })
  state = earGameReducer(state, { type: 'PAUSE' })
  assert.equal(state.phase, 'paused')
  assert.equal(isGameInputLocked(state), true)
  state = earGameReducer(state, { type: 'RESUME' })
  assert.equal(state.phase, 'accepting-input')
})

test('resuming an interrupted prompt returns to a replayable locked state', () => {
  let state = createInitialEarGameState()
  state = earGameReducer(state, { type: 'CHALLENGE_LOADED', challenge })
  state = earGameReducer(state, { type: 'PROMPT_STARTED' })
  state = earGameReducer(state, { type: 'PAUSE' })
  state = earGameReducer(state, { type: 'RESUME' })
  assert.equal(state.phase, 'ready')
  assert.equal(isGameInputLocked(state), true)
})

test('keyboard mappings use physical codes and preserve typing and tab behavior', () => {
  assert.equal(actionForKeyboardEvent({ code: 'KeyA', shiftKey: false }), 'move-left')
  assert.equal(actionForKeyboardEvent({ code: 'ArrowRight', shiftKey: false }), 'move-right')
  assert.equal(actionForKeyboardEvent({ code: 'KeyR', shiftKey: true }), 'slow-replay')
  assert.equal(actionForKeyboardEvent({ code: 'Digit4', shiftKey: false }), 'lane-4')
  assert.equal(actionForKeyboardEvent({ code: 'Tab', shiftKey: false }), null)
  assert.equal(shouldIgnoreGameShortcut({ target: { tagName: 'INPUT', isContentEditable: false } }), true)
  assert.equal(shouldIgnoreGameShortcut({ target: { tagName: 'DIV', isContentEditable: false } }), false)
})

test('exercise families rotate through three physical Sound Gates verbs', () => {
  assert.equal(variantForExercise('direction'), 'catch-root')
  assert.equal(variantForExercise('interval'), 'bridge-builder')
  assert.equal(variantForExercise('shape'), 'echo-chase')

  const normalized = normalizeEarChallenge({
    id: 42,
    exercise: {
      type: 'chord_movement',
      title: 'Root motion',
      question: 'Where did the root travel?',
      options: ['Up a fourth', 'Down a third'],
      chords: [
        ['C3', 'E3', 'G3'],
        ['F3', 'A3', 'C4'],
      ],
    },
  })
  assert.equal(normalized.variant, 'catch-root')
  assert.equal(normalized.answers.length, 2)
  assert.equal(normalized.correctAnswerId, null)
})
