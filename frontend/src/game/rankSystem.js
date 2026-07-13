export const RANKS = Object.freeze([
  { id: 'unranked', name: 'Unranked', levels: 10 },
  { id: 'bronze', name: 'Bronze', levels: 20 },
  { id: 'silver', name: 'Silver', levels: 35 },
  { id: 'gold', name: 'Gold', levels: 50 },
  { id: 'platinum', name: 'Platinum', levels: 70 },
  { id: 'diamond', name: 'Diamond', levels: 90 },
  { id: 'master', name: 'Master', levels: 115 },
  { id: 'grandmaster', name: 'Grandmaster', levels: 140 },
  { id: 'virtuoso', name: 'Virtuoso', levels: 170 },
  { id: 'maestro', name: 'Maestro', levels: 200 },
  { id: 'legendary', name: 'Legendary', levels: 250 },
]);

export const RANK_CHALLENGE_ACCURACY = 0.8;

export const createInitialRankProgress = () => ({
  rankIndex: 0,
  level: 1,
  challengePending: false,
  completed: false,
});

export const normalizeRankProgress = (value = {}) => {
  const rankIndex = Math.min(RANKS.length - 1, Math.max(0, Number(value.rankIndex) || 0));
  const rank = RANKS[rankIndex];
  return {
    rankIndex,
    level: Math.min(rank.levels, Math.max(1, Number(value.level) || 1)),
    challengePending: Boolean(value.challengePending) && rankIndex < RANKS.length - 1,
    completed: Boolean(value.completed) && rankIndex === RANKS.length - 1,
  };
};

export const getRankMeta = (progress = createInitialRankProgress()) => {
  const normalized = normalizeRankProgress(progress);
  const rank = RANKS[normalized.rankIndex];
  const isFinalRank = normalized.rankIndex === RANKS.length - 1;
  const nextRank = RANKS[normalized.rankIndex + 1] || null;
  const completedLevels = normalized.completed ? rank.levels : normalized.level;
  const remainingLevels = normalized.completed || normalized.challengePending
    ? 0
    : Math.max(0, rank.levels - normalized.level);
  return {
    ...rank,
    ...normalized,
    nextRank,
    remainingLevels,
    progressPercent: normalized.completed ? 100 : Math.round((completedLevels / rank.levels) * 100),
    progressLabel: normalized.challengePending
      ? `Rank challenge · ${Math.round(RANK_CHALLENGE_ACCURACY * 100)}% required`
      : normalized.completed
        ? 'All rank levels complete'
        : `Level ${normalized.level} of ${rank.levels} · ${remainingLevels} ${remainingLevels === 1 ? 'level' : 'levels'} until ${nextRank ? `${nextRank.name} Rank Challenge` : 'completion'}`,
    isFinalRank,
  };
};

export const advanceRankProgress = (value, result = {}) => {
  const current = normalizeRankProgress(value);
  const rank = RANKS[current.rankIndex];
  const runId = result.runId || result.challengeId || null;

  if (current.completed) {
    return { progress: current, event: { runId, type: 'complete', rank: rank.name, level: rank.levels } };
  }

  if (current.challengePending) {
    const accuracy = Number(result.accuracy) || 0;
    if (accuracy < RANK_CHALLENGE_ACCURACY) {
      return {
        progress: current,
        event: { runId, type: 'challenge-failed', rank: rank.name, level: current.level },
      };
    }

    const nextRankIndex = current.rankIndex + 1;
    const nextRank = RANKS[nextRankIndex];
    if (!nextRank) {
      const completed = { ...current, challengePending: false, completed: true };
      return { progress: completed, event: { runId, type: 'complete', rank: rank.name, level: rank.levels } };
    }

    const promoted = { rankIndex: nextRankIndex, level: 1, challengePending: false, completed: false };
    return {
      progress: promoted,
      event: { runId, type: 'rank-up', rank: nextRank.name, previousRank: rank.name, level: 1 },
    };
  }

  if (current.level >= rank.levels) {
    if (current.rankIndex === RANKS.length - 1) {
      const completed = { ...current, completed: true };
      return { progress: completed, event: { runId, type: 'complete', rank: rank.name, level: rank.levels } };
    }
    const pending = { ...current, challengePending: true };
    return {
      progress: pending,
      event: { runId, type: 'challenge-unlocked', rank: rank.name, level: current.level },
    };
  }

  if (current.level + 1 >= rank.levels) {
    const pending = { ...current, level: rank.levels, challengePending: true };
    return {
      progress: pending,
      event: { runId, type: 'challenge-unlocked', rank: rank.name, level: rank.levels },
    };
  }

  const advanced = { ...current, level: current.level + 1 };
  return {
    progress: advanced,
    event: { runId, type: 'level-up', rank: rank.name, level: advanced.level },
  };
};
