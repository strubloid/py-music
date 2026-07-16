export const RANKS = Object.freeze([
  { id: 'unranked', name: 'Unranked', minLevel: 1 },
  { id: 'bronze', name: 'Bronze', minLevel: 10 },
  { id: 'silver', name: 'Silver', minLevel: 20 },
  { id: 'gold', name: 'Gold', minLevel: 30 },
  { id: 'platinum', name: 'Platinum', minLevel: 40 },
  { id: 'diamond', name: 'Diamond', minLevel: 50 },
  { id: 'master', name: 'Master', minLevel: 70 },
  { id: 'grandmaster', name: 'Grandmaster', minLevel: 90 },
  { id: 'virtuoso', name: 'Virtuoso', minLevel: 110 },
  { id: 'maestro', name: 'Maestro', minLevel: 130 },
  { id: 'legendary', name: 'Legendary', minLevel: 180 },
])

export type RankId = (typeof RANKS)[number]['id']

const rankIndex = (id?: string | null) => RANKS.findIndex((rank) => rank.id === id)

export const getRankForLevel = (accountLevel = 1, earnedRankId?: string | null) => {
  const safeLevel = Math.max(1, Math.floor(Number(accountLevel) || 1))
  const levelIndex = RANKS.reduce((highest, rank, index) => (safeLevel >= rank.minLevel ? index : highest), 0)
  const earnedIndex = Math.max(0, rankIndex(earnedRankId))
  return RANKS[Math.max(levelIndex, earnedIndex)]
}

export const getRankMeta = (accountLevel = 1, earnedRankId?: string | null) => {
  const safeLevel = Math.max(1, Math.floor(Number(accountLevel) || 1))
  const current = getRankForLevel(safeLevel, earnedRankId)
  const currentIndex = rankIndex(current.id)
  const nextRank = RANKS[currentIndex + 1] || null
  const previousThreshold = current.minLevel
  const nextThreshold = nextRank?.minLevel ?? current.minLevel
  const span = Math.max(1, nextThreshold - previousThreshold)
  const progress = nextRank ? Math.max(0, safeLevel - previousThreshold) : span
  const remainingLevels = nextRank ? Math.max(0, nextThreshold - safeLevel) : 0

  return {
    ...current,
    accountLevel: safeLevel,
    nextRank,
    remainingLevels,
    progressPercent: nextRank ? Math.min(100, Math.round((progress / span) * 100)) : 100,
    progressLabel: nextRank
      ? `Level ${safeLevel} · ${remainingLevels} ${remainingLevels === 1 ? 'level' : 'levels'} until ${nextRank.name}`
      : `Level ${safeLevel} · Highest city rank`,
    completed: !nextRank,
  }
}
