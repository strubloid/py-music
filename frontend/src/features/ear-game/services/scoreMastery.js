export const calculateRoundScore = ({
  base = 25,
  correct,
  firstAttempt = true,
  replays = 0,
  combo = 0,
  difficulty = 1,
  assists = 0,
}) => {
  if (!correct) return 0;
  const firstAttemptBonus = firstAttempt ? 15 : 0;
  const confidenceBonus = replays === 0 ? 10 : Math.max(0, 5 - (replays - 1) * 2);
  const comboBonus = Math.min(25, combo * 5);
  const difficultyBonus = Math.max(0, difficulty - 1) * 10;
  const assistReduction = Math.max(0, assists) * 10;
  return Math.max(0, base + firstAttemptBonus + confidenceBonus + comboBonus + difficultyBonus - assistReduction);
};

export const updateMasteryWindow = (mastery = {}, attempt) => {
  const attempts = [...(mastery.attempts || []), attempt].slice(-10);
  let level = mastery.level || 1;
  if (attempts.length >= 8) {
    const accuracy = attempts.filter((item) => item.correct).length / attempts.length;
    const averageResponse = attempts.reduce((total, item) => total + (item.responseMs || 0), 0) / attempts.length;
    const averageReplays = attempts.reduce((total, item) => total + (item.replays || 0), 0) / attempts.length;
    if (accuracy >= 0.8 && averageResponse <= 5000 && averageReplays <= 1) level = Math.min(10, level + 1);
    else if (accuracy <= 0.4) level = Math.max(1, level - 1);
  }
  return { ...mastery, level, attempts };
};
