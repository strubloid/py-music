import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import LevelUpModal from '../components/game/LevelUpModal.jsx';
import {
  BADGES,
  DEFAULT_FOCUS_POINTS,
  LEVELS,
  POWERS,
  getLevelMeta,
  getNewBadgesForResult,
  getUnlockedPowers,
} from '../game/gameSystem.tsx';

const GameProgressContext = createContext(null);

const getStorageKey = (userId) => `strubloid:game-progress:${userId || 'guest'}`;

const getDefaultProgress = (xp = 0, level = 1) => ({
  focusPoints: DEFAULT_FOCUS_POINTS,
  badges: [],
  challengeResults: [],
  totalCorrect: 0,
  totalCompleted: 0,
  powersUsedCount: {},
  lastLevelSeen: level,
  lastKnownXp: xp,
});

export const useGameProgress = () => {
  const context = useContext(GameProgressContext);
  if (!context) {
    throw new Error('useGameProgress must be used within GameProgressProvider');
  }
  return context;
};

export const GameProgressProvider = ({ children }) => {
  const { user, updateUserProgress, isLoggedIn } = useAuth();
  const [progressState, setProgressState] = useState(() => getDefaultProgress());
  const [levelUpState, setLevelUpState] = useState(null);

  useEffect(() => {
    const level = user?.level || 1;
    const xp = user?.xp || 0;
    const storageKey = getStorageKey(user?.id);

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setProgressState({
          ...getDefaultProgress(xp, level),
          ...parsed,
          lastKnownXp: xp,
          lastLevelSeen: parsed.lastLevelSeen || level,
        });
        return;
      }
    } catch {
      // Ignore corrupt local progress.
    }

    setProgressState(getDefaultProgress(xp, level));
  }, [user?.id, user?.level, user?.xp]);

  useEffect(() => {
    const storageKey = getStorageKey(user?.id);
    localStorage.setItem(storageKey, JSON.stringify(progressState));
  }, [progressState, user?.id]);

  useEffect(() => {
    const currentLevel = user?.level || 1;
    const currentXp = user?.xp || 0;
    if (!user) return;

    setProgressState((current) => {
      if (currentLevel <= (current.lastLevelSeen || 1)) {
        if (current.lastKnownXp === currentXp) return current;
        return { ...current, lastKnownXp: currentXp };
      }

      const unlockedPowers = getUnlockedPowers(currentLevel).filter((power) => power.unlockLevel === currentLevel);
      setLevelUpState({
        level: currentLevel,
        title: getLevelMeta(currentXp).title,
        unlockedPowers,
      });

      return {
        ...current,
        focusPoints: DEFAULT_FOCUS_POINTS,
        lastLevelSeen: currentLevel,
        lastKnownXp: currentXp,
      };
    });
  }, [user, user?.level, user?.xp]);

  const addBonusXp = useCallback(async (amount) => {
    if (!amount) return 0;

    if (isLoggedIn) {
      const nextXp = (user?.xp || 0) + amount;
      const nextLevel = getLevelMeta(nextXp).level;
      updateUserProgress({ xp: nextXp, level: nextLevel });
    } else {
      updateUserProgress({ xp: (user?.xp || 0) + amount, level: getLevelMeta((user?.xp || 0) + amount).level });
    }

    return amount;
  }, [isLoggedIn, updateUserProgress, user?.level, user?.xp]);

  const consumeFocus = useCallback((amount = 1) => {
    let allowed = false;
    setProgressState((current) => {
      if (current.focusPoints < amount) return current;
      allowed = true;
      return { ...current, focusPoints: current.focusPoints - amount };
    });
    return allowed;
  }, []);

  const recordChallengeResult = useCallback((result) => {
    setProgressState((current) => {
      const nextResults = [result, ...current.challengeResults].slice(0, 25);
      const nextTotalCompleted = current.totalCompleted + 1;
      const nextTotalCorrect = current.totalCorrect + (result.score || 0);
      const nextBadges = new Set(current.badges);
      const earned = getNewBadgesForResult({
        totalCompleted: nextTotalCompleted,
        totalCorrect: nextTotalCorrect,
        powersUsed: result.powersUsed || [],
        accuracy: result.accuracy || 0,
        streakDays: result.streakDays || 0,
        maxCombo: result.maxCombo || 0,
        hadMistake: result.hadMistake || false,
        mode: result.mode || 'practice',
      });
      earned.forEach((badgeId) => nextBadges.add(badgeId));

      const nextPowersUsedCount = { ...current.powersUsedCount };
      (result.powersUsed || []).forEach((powerId) => {
        nextPowersUsedCount[powerId] = (nextPowersUsedCount[powerId] || 0) + 1;
      });

      return {
        ...current,
        badges: Array.from(nextBadges),
        challengeResults: nextResults,
        totalCompleted: nextTotalCompleted,
        totalCorrect: nextTotalCorrect,
        powersUsedCount: nextPowersUsedCount,
      };
    });
  }, []);

  const clearLevelUp = useCallback(() => setLevelUpState(null), []);

  const derived = useMemo(() => {
    const xp = user?.xp || 0;
    const levelMeta = getLevelMeta(xp);
    return {
      levelMeta,
      unlockedPowers: getUnlockedPowers(levelMeta.level),
      availableBadges: BADGES,
      allPowers: POWERS,
      allLevels: LEVELS,
    };
  }, [user?.xp]);

  return (
    <GameProgressContext.Provider
      value={{
        progressState,
        levelUpState,
        clearLevelUp,
        addBonusXp,
        consumeFocus,
        recordChallengeResult,
        ...derived,
      }}
    >
      {children}
      <LevelUpModal levelUpState={levelUpState} onClose={clearLevelUp} />
    </GameProgressContext.Provider>
  );
};
