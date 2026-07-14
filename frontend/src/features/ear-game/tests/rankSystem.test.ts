import test from 'node:test';
import assert from 'node:assert/strict';

import {
  RANKS,
  advanceRankProgress,
  applyRankXp,
  createInitialRankProgress,
  getRankMeta,
} from '../../../game/rankSystem';

test('rank inventory matches the specified internal level counts', () => {
  assert.deepEqual(
    RANKS.map(({ name, levels }) => [name, levels]),
    [
      ['Unranked', 10],
      ['Bronze', 20],
      ['Silver', 35],
      ['Gold', 50],
      ['Platinum', 70],
      ['Diamond', 90],
      ['Master', 115],
      ['Grandmaster', 140],
      ['Virtuoso', 170],
      ['Maestro', 200],
      ['Legendary', 250],
    ],
  );
});

test('completed runs advance one internal level and expose progress', () => {
  const update = advanceRankProgress(createInitialRankProgress(), {
    runId: 'run-1',
    accuracy: 0.4,
  });
  assert.equal(update.progress.level, 2);
  assert.equal(update.event.type, 'level-up');
  assert.equal(getRankMeta(update.progress).progressLabel, 'Level 2 of 10 · 8 levels until Bronze Rank Challenge');
});

test('awarded XP builds rank progress and grants one internal level at 500 XP', () => {
  const partial = applyRankXp(createInitialRankProgress(), { challengeId: 'daily-1', xpEarned: 200 });
  assert.equal(partial.progress.level, 1);
  assert.equal(partial.progress.xpProgress, 200);
  assert.equal(partial.event.type, 'rank-xp');

  const levelUp = applyRankXp(partial.progress, { challengeId: 'daily-2', xpEarned: 300 });
  assert.equal(levelUp.progress.level, 2);
  assert.equal(levelUp.progress.xpProgress, 0);
  assert.equal(levelUp.event.type, 'level-up');
  assert.equal(levelUp.event.source, 'xp');
});

test('rank XP cannot skip a pending rank challenge', () => {
  const pending = { rankIndex: 0, level: 10, xpProgress: 120, challengePending: true, completed: false };
  const update = applyRankXp(pending, { challengeId: 'daily-3', xpEarned: 500 });
  assert.deepEqual(update.progress, pending);
  assert.equal(update.event, null);
});

test('finishing a rank unlocks a separate rank challenge', () => {
  const update = advanceRankProgress({
    rankIndex: 0,
    level: 9,
    challengePending: false,
    completed: false,
  }, { runId: 'run-final', accuracy: 1 });

  assert.equal(update.progress.challengePending, true);
  assert.equal(update.event.type, 'challenge-unlocked');
  assert.equal(getRankMeta(update.progress).progressLabel, 'Rank challenge · 80% required');
});

test('rank challenge requires 80 percent and promotes to level one', () => {
  const pending = { rankIndex: 0, level: 10, xpProgress: 0, challengePending: true, completed: false };
  const failed = advanceRankProgress(pending, { runId: 'failed', accuracy: 0.6 });
  assert.equal(failed.event.type, 'challenge-failed');
  assert.deepEqual(failed.progress, pending);

  const passed = advanceRankProgress(pending, { runId: 'passed', accuracy: 0.8 });
  assert.equal(passed.event.type, 'rank-up');
  assert.equal(passed.event.rank, 'Bronze');
  assert.deepEqual(passed.progress, {
    rankIndex: 1,
    level: 1,
    challengePending: false,
    completed: false,
  });
});
