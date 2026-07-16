import { assign, createMachine } from 'xstate'

export type ActivityContext = { focusSpent: number; error: string | null }

export const activityMachine = createMachine(
  {
    id: 'activity',
    initial: 'loading',
    context: { focusSpent: 0, error: null } as ActivityContext,
    states: {
      loading: { on: { LOADED: 'intro', FAIL: { target: 'error', actions: 'captureError' } } },
      intro: { on: { CONTINUE: 'awaitingUserGesture', SKIP: 'awaitingUserGesture' } },
      awaitingUserGesture: { on: { UNLOCK_AUDIO: 'ready', FAIL: { target: 'error', actions: 'captureError' } } },
      ready: { on: { PLAY: 'playingPrompt', QUIT: 'complete' } },
      playingPrompt: { on: { PLAYBACK_DONE: 'acceptingInput', FAIL: { target: 'error', actions: 'captureError' } } },
      acceptingInput: { on: { SUBMIT: 'checking', SPEND_FOCUS: { actions: 'recordFocus' }, QUIT: 'complete' } },
      checking: { on: { CORRECT: 'success', INCORRECT: 'retry', FAIL: { target: 'error', actions: 'captureError' } } },
      success: { on: { CONTINUE: 'reward' } },
      retry: { on: { CONTINUE: 'ready' } },
      reward: { on: { REWARD_DONE: 'complete' } },
      error: { on: { RETRY: { target: 'loading', actions: 'clearError' }, QUIT: 'complete' } },
      complete: { type: 'final' },
    },
  },
  {
    actions: {
      recordFocus: assign({
        focusSpent: ({ context, event }) => context.focusSpent + Number('amount' in event ? event.amount : 0),
      }),
      captureError: assign({ error: ({ event }) => String('error' in event ? event.error : 'Unknown activity error') }),
      clearError: assign({ error: null }),
    },
  },
)
