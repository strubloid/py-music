const KEY_ACTIONS = {
  KeyA: 'move-left',
  ArrowLeft: 'move-left',
  KeyD: 'move-right',
  ArrowRight: 'move-right',
  KeyW: 'jump',
  ArrowUp: 'jump',
  Space: 'jump',
  Enter: 'confirm',
  KeyS: 'cancel',
  ArrowDown: 'cancel',
  KeyR: 'replay',
  KeyH: 'hint',
  KeyC: 'compare',
  KeyP: 'pause',
  Escape: 'pause',
  KeyM: 'mute',
  Digit1: 'lane-1',
  Digit2: 'lane-2',
  Digit3: 'lane-3',
  Digit4: 'lane-4',
  Digit5: 'lane-5',
  Digit6: 'lane-6',
};

export const actionForKeyboardEvent = (event, mappings = {}) => {
  if (event.code === 'KeyR' && event.shiftKey) return 'slow-replay';
  return mappings[event.code] || KEY_ACTIONS[event.code] || null;
};

export const shouldIgnoreGameShortcut = (event) => {
  const target = event.target;
  if (!target) return false;
  return target.isContentEditable || ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName) || Boolean(target.closest?.('[role="dialog"]'));
};

export const createGameInputHandler = ({ getState, dispatchAction, mappings = {} }) => (event) => {
  if (shouldIgnoreGameShortcut(event)) return;
  const action = actionForKeyboardEvent(event, mappings);
  if (!action) return;
  const state = getState();
  if (state?.phase === 'paused' && !['pause'].includes(action)) return;
  event.preventDefault();
  dispatchAction(action, 'keyboard');
};
