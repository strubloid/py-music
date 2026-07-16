import { describe, expect, it } from 'vitest';
import { createActor } from 'xstate';
import { activityMachine } from './activityMachine';

describe('activityMachine', () => {
  it('locks input until audio has been unlocked and playback has finished', () => {
    const actor = createActor(activityMachine).start();
    actor.send({ type: 'SUBMIT' });
    expect(actor.getSnapshot().value).toBe('loading');
    actor.send({ type: 'LOADED' });
    actor.send({ type: 'CONTINUE' });
    actor.send({ type: 'UNLOCK_AUDIO' });
    actor.send({ type: 'PLAY' });
    expect(actor.getSnapshot().value).toBe('playingPrompt');
    actor.send({ type: 'SUBMIT' });
    expect(actor.getSnapshot().value).toBe('playingPrompt');
    actor.send({ type: 'PLAYBACK_DONE' });
    actor.send({ type: 'SUBMIT' });
    expect(actor.getSnapshot().value).toBe('checking');
  });

  it('stops permanently after completion', () => {
    const actor = createActor(activityMachine).start();
    actor.send({ type: 'LOADED' }); actor.send({ type: 'SKIP' }); actor.send({ type: 'UNLOCK_AUDIO' }); actor.send({ type: 'QUIT' });
    expect(actor.getSnapshot().status).toBe('done');
    expect(actor.getSnapshot().value).toBe('complete');
  });
});
