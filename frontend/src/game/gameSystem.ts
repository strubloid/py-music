const FOUNDATION_LEVELS = [
  { level: 1, title: 'Bedroom Listener', xpRequired: 0 },
  { level: 2, title: 'Tuning Rookie', xpRequired: 100 },
  { level: 3, title: 'Interval Scout', xpRequired: 250 },
  { level: 4, title: 'Chord Hunter', xpRequired: 500 },
  { level: 5, title: 'Scale Explorer', xpRequired: 900 },
  { level: 6, title: 'Ear Apprentice', xpRequired: 1400 },
  { level: 7, title: 'Melody Tracker', xpRequired: 2100 },
  { level: 8, title: 'Harmony Adept', xpRequired: 3000 },
  { level: 9, title: 'Sound Wizard', xpRequired: 4200 },
  { level: 10, title: 'Master of Ears', xpRequired: 6000 },
]

export const MAX_ACCOUNT_LEVEL = 999

export const xpRequiredForLevel = (level = 1) => {
  const safeLevel = Math.max(1, Math.floor(Number(level) || 1))
  const foundation = FOUNDATION_LEVELS.find((entry) => entry.level === safeLevel)
  if (foundation) return foundation.xpRequired
  const levelsAfterTen = safeLevel - 10
  return 6000 + levelsAfterTen * 2000 + 50 * levelsAfterTen * (levelsAfterTen - 1)
}

const advancedTitle = (level: number) => {
  if (level >= 180) return 'City Legend'
  if (level >= 130) return 'Maestro of the City'
  if (level >= 110) return 'City Virtuoso'
  if (level >= 90) return 'Grand Harmony Master'
  if (level >= 70) return 'Music City Master'
  if (level >= 50) return 'Diamond Musician'
  if (level >= 40) return 'Platinum Performer'
  if (level >= 30) return 'Golden Harmonist'
  if (level >= 20) return 'Silver Songsmith'
  return 'Bronze Pathfinder'
}

export const LEVELS = [
  ...FOUNDATION_LEVELS,
  ...Array.from({ length: 170 }, (_, index) => {
    const level = index + 11
    return { level, title: advancedTitle(level), xpRequired: xpRequiredForLevel(level) }
  }),
]

export const POWERS = [
  {
    id: 'replay',
    name: 'Echo Replay',
    unlockLevel: 1,
    xpPenalty: 0,
    focusCost: 1,
    effect: 'Ask Echo to replay the full musical signal.',
  },
  {
    id: 'slow_down',
    name: 'Slow Time',
    unlockLevel: 2,
    xpPenalty: 0,
    focusCost: 2,
    effect: 'Slow the musical signal without changing its answer.',
  },
  {
    id: 'remove_one_option',
    name: 'Remove One Gate',
    unlockLevel: 3,
    xpPenalty: 0,
    focusCost: 2,
    effect: 'Close one server-confirmed wrong gate.',
  },
  {
    id: 'root_note_anchor',
    name: 'Root Lantern',
    unlockLevel: 4,
    xpPenalty: 0,
    focusCost: 3,
    effect: 'Illuminate and replay the tonal centre.',
  },
  {
    id: 'compare_mode',
    name: 'Compare Mode',
    unlockLevel: 5,
    xpPenalty: 0,
    focusCost: 1,
    effect: 'Compare the original with your selected answer.',
  },
  {
    id: 'second_chance',
    name: 'Second Chance',
    unlockLevel: 6,
    xpPenalty: 0,
    focusCost: 1,
    effect: 'Protect one mistake in a run.',
  },
  {
    id: 'freeze_combo',
    name: 'Freeze Combo',
    unlockLevel: 7,
    xpPenalty: 0,
    focusCost: 1,
    effect: 'Prevent one combo break.',
  },
  {
    id: 'reveal_direction',
    name: 'Reveal Direction',
    unlockLevel: 8,
    xpPenalty: 0,
    focusCost: 1,
    effect: 'Reveal whether the pitch goes up, down, or repeats.',
  },
] as const

export const BADGES = [
  { id: 'first-sound', name: 'First Sound' },
  { id: 'sharp-listener', name: 'Sharp Listener' },
  { id: 'no-help-needed', name: 'No Help Needed' },
  { id: 'perfect-run', name: 'Perfect Run' },
  { id: 'daily-player', name: 'Daily Player' },
  { id: 'weekly-musician', name: 'Weekly Musician' },
  { id: 'combo-mind', name: 'Combo Mind' },
  { id: 'brave-ear', name: 'Brave Ear' },
  { id: 'comeback-player', name: 'Comeback Player' },
  { id: 'minimal-help', name: 'Minimal Help' },
] as const

export const DEFAULT_FOCUS_POINTS = 5
export {
  CHALLENGE_XP_MULTIPLIER,
  EAR_TRAINING_XP_PER_DIFFICULTY,
  MAX_FOCUS_POINTS,
  getModeBaseXp,
} from './rewardSystem'

export const getLevelMeta = (xp = 0) => {
  const safeXp = Math.max(0, Number(xp) || 0)
  let low = 1
  let high = MAX_ACCOUNT_LEVEL
  while (low < high) {
    const middle = Math.ceil((low + high) / 2)
    if (xpRequiredForLevel(middle) <= safeXp) low = middle
    else high = middle - 1
  }
  const foundation = FOUNDATION_LEVELS.find((entry) => entry.level === low)
  const current = foundation || { level: low, title: advancedTitle(low), xpRequired: xpRequiredForLevel(low) }
  const next =
    low < MAX_ACCOUNT_LEVEL
      ? { level: low + 1, title: advancedTitle(low + 1), xpRequired: xpRequiredForLevel(low + 1) }
      : null
  return {
    ...current,
    nextLevelXp: next?.xpRequired ?? current.xpRequired,
    progressInLevel: next
      ? Math.min(100, ((safeXp - current.xpRequired) / (next.xpRequired - current.xpRequired)) * 100)
      : 100,
  }
}

export const getUnlockedPowers = (level = 1) => POWERS.filter((power) => level >= power.unlockLevel)

export const getComboBonus = (combo = 0) => {
  if (combo >= 10) return 5
  if (combo >= 5) return 3
  if (combo >= 2) return 1
  return 0
}

export const calculateQuestionXp = ({
  baseXp = 10,
  isCorrect = false,
  isFirstTry = false,
  isFastAnswer = false,
  combo = 0,
  penalties = 0,
}) => {
  if (!isCorrect) {
    return 0
  }

  const bonusXp = (isFirstTry ? 5 : 0) + (isFastAnswer ? 3 : 0) + getComboBonus(combo)
  return Math.max(1, baseXp + bonusXp - penalties)
}

export const calculatePowerPenalty = (powerIds: string[] = []) =>
  powerIds.reduce((total, powerId) => {
    const power = getPowerById(powerId)
    return total + (power?.xpPenalty || 0)
  }, 0)

export const calculateReplayPenalty = (replayCount = 0) => Math.max(0, replayCount - 1) * 2

export const calculateXpPreview = ({ baseXp = 10, replayCount = 0, powerIds = [] }) => {
  const replayPenalty = calculateReplayPenalty(replayCount)
  const powerPenalty = calculatePowerPenalty(powerIds)
  const penalties = replayPenalty + powerPenalty
  return {
    baseXp,
    penalties,
    replayPenalty,
    powerPenalty,
    previewXp: Math.max(1, baseXp - penalties),
  }
}

export const calculateChallengeBonuses = ({
  answeredCorrectly = 0,
  totalQuestions = 0,
  maxCombo = 0,
  isDaily = false,
}) => {
  const perfect = totalQuestions > 0 && answeredCorrectly === totalQuestions
  return {
    completionXp: answeredCorrectly > 0 ? 25 : 0,
    perfectXp: perfect ? 50 : 0,
    dailyXp: isDaily && answeredCorrectly > 0 ? 40 : 0,
    comboXp: maxCombo >= 10 ? 10 : maxCombo >= 5 ? 5 : 0,
  }
}

export const getPowerById = (powerId: string) => POWERS.find((power) => power.id === powerId) || null

export const getQuestionDirection = (stimulus?: { rootMidi?: number; targetMidi?: number }) => {
  if (!stimulus || stimulus.rootMidi === undefined || stimulus.targetMidi === undefined) return null
  if (stimulus.targetMidi > stimulus.rootMidi) return 'Higher'
  if (stimulus.targetMidi < stimulus.rootMidi) return 'Lower'
  return 'Same'
}

export const getNewBadgesForResult = ({
  totalCompleted = 0,
  totalCorrect = 0,
  powersUsed = [],
  accuracy = 0,
  streakDays = 0,
  maxCombo = 0,
  hadMistake = false,
  mode = 'practice',
}) => {
  const badges: string[] = []

  if (totalCompleted >= 1) badges.push('first-sound')
  if (totalCorrect >= 10) badges.push('sharp-listener')
  if (powersUsed.length === 0 && accuracy === 1) badges.push('no-help-needed')
  if (accuracy === 1) badges.push('perfect-run')
  if (mode === 'daily' && streakDays >= 3) badges.push('daily-player')
  if (mode === 'daily' && streakDays >= 7) badges.push('weekly-musician')
  if (maxCombo >= 10) badges.push('combo-mind')
  if (mode === 'boss') badges.push('brave-ear')
  if (hadMistake && accuracy > 0.5) badges.push('comeback-player')
  if (powersUsed.length === 1 && accuracy > 0) badges.push('minimal-help')

  return badges
}
