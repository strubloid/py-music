import test from 'node:test';
import assert from 'node:assert/strict';

import { RANKS, getRankForLevel, getRankMeta } from '../../../game/rankSystem';
import { getLevelMeta, xpRequiredForLevel } from '../../../game/gameSystem';

test('rank thresholds use early ten-level gaps, higher twenty-level gaps, and a final fifty-level gap', () => {
  assert.deepEqual(
    RANKS.map(({ name, minLevel }) => [name, minLevel]),
    [
      ['Unranked', 1], ['Bronze', 10], ['Silver', 20], ['Gold', 30],
      ['Platinum', 40], ['Diamond', 50], ['Master', 70], ['Grandmaster', 90],
      ['Virtuoso', 110], ['Maestro', 130], ['Legendary', 180],
    ],
  );
});

test('account level ten visibly earns Bronze instead of restarting at one of ten', () => {
  const meta = getRankMeta(10);
  assert.equal(meta.name, 'Bronze');
  assert.equal(meta.remainingLevels, 10);
  assert.equal(meta.progressLabel, 'Level 10 · 10 levels until Silver');
  assert.doesNotMatch(meta.progressLabel, /1 of 10|1\/10/);
});

test('higher and final thresholds promote at the exact account level boundary', () => {
  assert.equal(getRankForLevel(49).name, 'Platinum');
  assert.equal(getRankForLevel(50).name, 'Diamond');
  assert.equal(getRankForLevel(69).name, 'Diamond');
  assert.equal(getRankForLevel(70).name, 'Master');
  assert.equal(getRankForLevel(179).name, 'Maestro');
  assert.equal(getRankForLevel(180).name, 'Legendary');
});

test('an already-earned rank never decreases when current level data is stale', () => {
  assert.equal(getRankForLevel(10, 'gold').name, 'Gold');
  assert.equal(getRankForLevel(80, 'grandmaster').name, 'Grandmaster');
});

test('account levels continue beyond ten with monotonic deterministic XP thresholds', () => {
  assert.equal(xpRequiredForLevel(10), 6000);
  assert.equal(xpRequiredForLevel(11), 8000);
  assert.equal(xpRequiredForLevel(20), 30500);
  assert.ok(xpRequiredForLevel(180) > xpRequiredForLevel(179));
  assert.equal(getLevelMeta(xpRequiredForLevel(20)).level, 20);
  assert.equal(getLevelMeta(xpRequiredForLevel(20) - 1).level, 19);
});
