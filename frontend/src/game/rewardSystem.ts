export const MAX_FOCUS_POINTS = 10;
export const EAR_TRAINING_XP_PER_DIFFICULTY = 10;
export const CHALLENGE_XP_MULTIPLIER = 10;

export const getModeBaseXp = ({ mode = 'ear-training', difficulty = 1 }) => {
  const normalizedDifficulty = Math.max(1, Math.min(5, Math.round(difficulty || 1)));
  const earTrainingXp = EAR_TRAINING_XP_PER_DIFFICULTY * normalizedDifficulty;
  return mode === 'challenge' ? earTrainingXp * CHALLENGE_XP_MULTIPLIER : earTrainingXp;
};
