import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateRoundScore, updateMasteryWindow } from '../services/scoreMastery';
import { normalizeEarChallenge } from '../services/challengeNormalizer';

const raw = {
  id: 42,
  difficulty: 3,
  xp_reward: 50,
  explanation: 'Major uses 0–4–7.',
  exercise: {
    type: 'chord_quality',
    title: 'Chord Colour',
    question: 'Which quality?',
    options: ['Minor', 'Major'],
    correct_index: 1,
    chords: [['C3', 'E3', 'G3']],
    answer_mode: 'single_chord_quality',
  },
};

test('challenge normalization determines correctness from ids, not labels or ordering', () => {
  const challenge = normalizeEarChallenge(raw, { instrumentId: 'piano' });
  assert.equal(challenge.category, 'chord-quality');
  assert.equal(challenge.correctAnswerId, '42-answer-1');
  assert.equal(challenge.answers[0].lane, 0);
  assert.equal(challenge.prompt.events.length, 3);
  assert.equal(new Set(challenge.prompt.events.map((event) => event.time)).size, 1);
});

test('score rewards confidence and difficulty without ever becoming negative', () => {
  assert.equal(calculateRoundScore({ base: 50, correct: true, firstAttempt: true, replays: 0, combo: 2, difficulty: 3, assists: 0 }), 105);
  assert.equal(calculateRoundScore({ base: 25, correct: false, firstAttempt: false, replays: 8, combo: 0, difficulty: 1, assists: 4 }), 0);
});

test('mastery adapts only after a comparable rolling window', () => {
  let mastery = { level: 4, attempts: [] };
  for (let index = 0; index < 7; index += 1) mastery = updateMasteryWindow(mastery, { correct: true, responseMs: 1000, replays: 0 });
  assert.equal(mastery.level, 4);
  mastery = updateMasteryWindow(mastery, { correct: true, responseMs: 900, replays: 0 });
  assert.equal(mastery.level, 5);
  assert.equal(mastery.attempts.length, 8);
});
