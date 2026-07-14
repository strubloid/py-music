const DAY_MS = 24 * 60 * 60 * 1000;

const makeQuest = ({ id, cadence, title, description, metric, target, xp, focus = 0 }) => ({
  id,
  cadence,
  title,
  description,
  metric,
  target,
  xp,
  focus,
});

const thresholdQuests = ({ cadence, metric, thresholds, title, description, xp, focus }) => thresholds.map((target, index) => makeQuest({
  id: `${cadence}-${metric}-${target}`,
  cadence,
  title: title(target),
  description: description(target),
  metric,
  target,
  xp: typeof xp === 'function' ? xp(target, index) : xp,
  focus: typeof focus === 'function' ? focus(target, index) : focus,
}));

export const QUEST_CATALOG = [
  ...thresholdQuests({ cadence: 'daily', metric: 'play', thresholds: [1, 3, 5, 8], title: (n) => `${n}-Move Warm-up`, description: (n) => `Complete ${n} practice ${n === 1 ? 'move' : 'moves'} today.`, xp: 3, focus: 1 }),
  ...thresholdQuests({ cadence: 'daily', metric: 'correct', thresholds: [1, 3, 5, 8], title: (n) => `Land ${n} Clean ${n === 1 ? 'Hit' : 'Hits'}`, description: (n) => `Answer ${n} prompts correctly today.`, xp: 4, focus: 1 }),
  ...thresholdQuests({ cadence: 'daily', metric: 'combo', thresholds: [2, 3, 5], title: (n) => `${n}x Groove`, description: (n) => `Reach a ${n}x combo today.`, xp: 5, focus: 1 }),
  ...thresholdQuests({ cadence: 'daily', metric: 'no-power', thresholds: [1, 3], title: (n) => `Bare Ear ${n}`, description: (n) => `Clear ${n} prompts without a power today.`, xp: 5, focus: 1 }),

  ...thresholdQuests({ cadence: 'weekly', metric: 'ear-runs', thresholds: [1, 3, 5, 10], title: (n) => `${n} Sound Gate ${n === 1 ? 'Run' : 'Runs'}`, description: (n) => `Finish ${n} Note Runner ${n === 1 ? 'run' : 'runs'} this week.`, xp: 8, focus: 1 }),
  ...thresholdQuests({ cadence: 'weekly', metric: 'perfect', thresholds: [1, 3, 5], title: (n) => `${n} Perfect ${n === 1 ? 'Passage' : 'Passages'}`, description: (n) => `Finish ${n} Note Runner ${n === 1 ? 'run' : 'runs'} at 100% this week.`, xp: 10, focus: 1 }),
  ...thresholdQuests({ cadence: 'weekly', metric: 'daily-wins', thresholds: [1, 3, 5], title: (n) => `${n} Challenge ${n === 1 ? 'Clear' : 'Clears'}`, description: (n) => `Win ${n} Challenges this week.`, xp: 10, focus: 1 }),
  ...thresholdQuests({ cadence: 'weekly', metric: 'combo', thresholds: [5, 8, 10], title: (n) => `Hold a ${n}x Line`, description: (n) => `Reach a ${n}x combo this week.`, xp: 8, focus: 1 }),
  ...thresholdQuests({ cadence: 'weekly', metric: 'power-uses', thresholds: [1, 3], title: (n) => `Toolbox ${n}`, description: (n) => `Use learning powers ${n} ${n === 1 ? 'time' : 'times'} this week.`, xp: 6, focus: 1 }),

  ...thresholdQuests({ cadence: 'milestone', metric: 'play', thresholds: [1, 5, 10, 25, 50], title: (n) => `${n} Moves Played`, description: (n) => `Complete ${n} total practice moves.`, xp: (_n, i) => Math.min(15, 5 + i * 2), focus: (_n, i) => (i % 2 === 0 ? 1 : 0) }),
  ...thresholdQuests({ cadence: 'milestone', metric: 'correct', thresholds: [1, 5, 10, 25, 50], title: (n) => `${n} Clean Hits`, description: (n) => `Land ${n} correct answers in total.`, xp: (_n, i) => Math.min(15, 5 + i * 2), focus: (_n, i) => (i % 2 === 1 ? 1 : 0) }),
  ...thresholdQuests({ cadence: 'milestone', metric: 'ear-runs', thresholds: [1, 5, 10], title: (n) => `Runner ${n}`, description: (n) => `Finish ${n} Note Runner ${n === 1 ? 'run' : 'runs'} in total.`, xp: 12, focus: 1 }),
  ...thresholdQuests({ cadence: 'milestone', metric: 'perfect', thresholds: [1, 5, 10], title: (n) => `Perfect Ear ${n}`, description: (n) => `Finish ${n} perfect Note Runner ${n === 1 ? 'run' : 'runs'}.`, xp: 15, focus: 1 }),
  ...thresholdQuests({ cadence: 'milestone', metric: 'combo', thresholds: [5, 10], title: (n) => `${n}x Nomi Aura`, description: (n) => `Reach a best combo of ${n}x.`, xp: 12, focus: 1 }),
];

const localDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isoWeekKey = (date) => {
  const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((utc - yearStart) / DAY_MS) + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
};

export const getQuestPeriodKey = (quest, now = new Date()) => {
  if (quest.cadence === 'daily') return localDateKey(now);
  if (quest.cadence === 'weekly') return isoWeekKey(now);
  return 'lifetime';
};

const inQuestPeriod = (result, cadence, now) => {
  if (cadence === 'milestone') return true;
  if (!result.completedAt) return false;
  const completed = new Date(result.completedAt);
  if (Number.isNaN(completed.getTime())) return false;
  return cadence === 'daily'
    ? localDateKey(completed) === localDateKey(now)
    : isoWeekKey(completed) === isoWeekKey(now);
};

export const getQuestProgress = (quest, progressState, now = new Date()) => {
  const allResults = progressState.challengeResults || [];
  if (quest.cadence === 'milestone' && quest.metric === 'play') return progressState.totalCompleted || 0;
  if (quest.cadence === 'milestone' && quest.metric === 'correct') return progressState.totalCorrect || 0;

  const results = allResults.filter((result) => inQuestPeriod(result, quest.cadence, now));
  switch (quest.metric) {
    case 'play': return results.length;
    case 'correct': return results.reduce((total, result) => total + (result.score || 0), 0);
    case 'ear-runs': return results.filter((result) => result.mode === 'note-runner-run').length;
    case 'perfect': return results.filter((result) => result.mode === 'note-runner-run' && result.accuracy === 1).length;
    case 'daily-wins': return results.filter((result) => result.mode === 'daily' && result.accuracy > 0).length;
    case 'combo': return results.reduce((best, result) => Math.max(best, result.maxCombo || 0), 0);
    case 'no-power': return results.filter((result) => result.accuracy > 0 && (result.powersUsed || []).length === 0).length;
    case 'power-uses': return results.reduce((total, result) => total + (result.powersUsed || []).length, 0);
    default: return 0;
  }
};

export const getQuestClaimKey = (quest, now = new Date()) => `${quest.id}:${getQuestPeriodKey(quest, now)}`;

export const selectQuestBoard = () => QUEST_CATALOG;
