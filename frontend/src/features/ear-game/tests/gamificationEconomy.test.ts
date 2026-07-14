import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CHALLENGE_XP_MULTIPLIER,
  getModeBaseXp,
} from '../../../game/rewardSystem';
import {
  QUEST_CATALOG,
  getQuestPeriodKey,
  getQuestProgress,
  selectQuestBoard,
} from '../../../game/questSystem';

test('challenge base XP is exactly ten times equal-difficulty ear training XP', () => {
  assert.equal(CHALLENGE_XP_MULTIPLIER, 10);
  for (let difficulty = 1; difficulty <= 5; difficulty += 1) {
    const earXp = getModeBaseXp({ mode: 'ear-training', difficulty });
    assert.equal(getModeBaseXp({ mode: 'challenge', difficulty }), earXp * 10);
  }
});

test('quest catalog has intentional daily, weekly, and lifetime reward pools', () => {
  assert.ok(QUEST_CATALOG.length >= 40);
  assert.equal(QUEST_CATALOG.filter((quest) => quest.cadence === 'daily').reduce((sum, quest) => sum + quest.xp, 0), 100);
  assert.equal(QUEST_CATALOG.filter((quest) => quest.cadence === 'weekly').reduce((sum, quest) => sum + quest.xp, 0), 700);
  assert.equal(QUEST_CATALOG.filter((quest) => quest.cadence === 'milestone').reduce((sum, quest) => sum + quest.xp, 0), 10000);
  assert.ok(QUEST_CATALOG.filter((quest) => quest.focus > 0).length >= 20);
  assert.equal(new Set(QUEST_CATALOG.map((quest) => quest.id)).size, QUEST_CATALOG.length);
});

test('quest progress is derived from real game results, not decorative state', () => {
  const now = new Date('2026-07-14T12:00:00Z');
  const progressState = {
    totalCompleted: 4,
    totalCorrect: 3,
    challengeResults: [
      { mode: 'note-runner-run', accuracy: 1, maxCombo: 5, powersUsed: [], completedAt: '2026-07-14T10:00:00Z' },
      { mode: 'daily', accuracy: 1, maxCombo: 2, powersUsed: ['remove_one_option'], completedAt: '2026-07-14T09:00:00Z' },
      { mode: 'direction', accuracy: 0, maxCombo: 0, powersUsed: [], hadMistake: true, completedAt: '2026-07-13T09:00:00Z' },
      { mode: 'chord-quality', accuracy: 1, maxCombo: 3, powersUsed: [], completedAt: '2026-07-14T08:00:00Z' },
    ],
  };

  const dailyPlays = QUEST_CATALOG.find((quest) => quest.id === 'daily-play-3');
  const perfectRuns = QUEST_CATALOG.find((quest) => quest.id === 'weekly-perfect-1');
  assert.equal(getQuestProgress(dailyPlays, progressState, now), 3);
  assert.equal(getQuestProgress(perfectRuns, progressState, now), 1);
});

test('quest board is stable for a date and mixes daily, weekly, and milestone goals', () => {
  const now = new Date('2026-07-14T12:00:00Z');
  const first = selectQuestBoard(now);
  const second = selectQuestBoard(now);
  assert.deepEqual(first.map((quest) => quest.id), second.map((quest) => quest.id));
  assert.ok(first.length >= 20);
  assert.deepEqual(new Set(first.map((quest) => quest.cadence)), new Set(['daily', 'weekly', 'milestone']));
  assert.equal(getQuestPeriodKey({ cadence: 'daily' }, now), '2026-07-14');
  assert.match(getQuestPeriodKey({ cadence: 'weekly' }, now), /^2026-W\d{2}$/);
  assert.equal(getQuestPeriodKey({ cadence: 'milestone' }, now), 'lifetime');
});
