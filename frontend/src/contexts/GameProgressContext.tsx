import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { claimQuestReward, getGameProgress } from '../services/api';
import LevelUpModal from '../components/game/LevelUpModal';
import CityRewardCeremony from '../components/game/CityRewardCeremony';
import {
  BADGES,
  DEFAULT_FOCUS_POINTS,
  MAX_FOCUS_POINTS,
  LEVELS,
  POWERS,
  getLevelMeta,
  getNewBadgesForResult,
  getUnlockedPowers,
} from '../game/gameSystem';
import { getRankMeta } from '../game/rankSystem';

const GameProgressContext = createContext(null);

const getStorageKey = (userId) => `strubloid:game-progress:${userId || 'guest'}`;

const getDefaultProgress = (xp = 0, level = 1, focusPoints = DEFAULT_FOCUS_POINTS) => ({
  economyVersion: 2,
  focusPoints,
  badges: [],
  challengeResults: [],
  questClaims: {},
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
  const [cityReward, setCityReward] = useState(null);

  useEffect(() => {
    const level = user?.level || 1;
    const xp = user?.xp || 0;
    const serverFocus = isLoggedIn && Number.isFinite(user?.focus_points)
      ? Math.min(MAX_FOCUS_POINTS, Math.max(0, user.focus_points))
      : null;
    const storageKey = getStorageKey(user?.id);

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        const migratedFocus = parsed.economyVersion === 2
          ? Math.min(MAX_FOCUS_POINTS, Math.max(0, Number(parsed.focusPoints) || 0))
          : Math.min(MAX_FOCUS_POINTS, Math.max(0, Number(parsed.focusPoints) || 0) + 2);
        setProgressState({
          ...getDefaultProgress(xp, level),
          ...parsed,
          economyVersion: 2,
          focusPoints: serverFocus ?? migratedFocus,
          lastKnownXp: xp,
          lastLevelSeen: parsed.lastLevelSeen || level,
        });
        return;
      }
    } catch {
      // Ignore corrupt local progress.
    }

    setProgressState(getDefaultProgress(xp, level, serverFocus ?? DEFAULT_FOCUS_POINTS));
  }, [isLoggedIn, user?.id]);

  useEffect(() => {
    if (!isLoggedIn || !Number.isFinite(user?.focus_points)) return;
    setProgressState((current) => ({
      ...current,
      focusPoints: Math.min(MAX_FOCUS_POINTS, Math.max(0, user.focus_points)),
    }));
  }, [isLoggedIn, user?.focus_points]);

  useEffect(() => {
    if (!isLoggedIn || !user?.id) return undefined;
    let cancelled = false;
    getGameProgress().then((response) => {
      if (cancelled) return;
      setProgressState((current) => ({
        ...current,
        focusPoints: Number.isFinite(response.data.focus_points)
          ? Math.min(MAX_FOCUS_POINTS, Math.max(0, response.data.focus_points))
          : current.focusPoints,
        questClaims: {
          ...(current.questClaims || {}),
          ...(response.data.quest_claims || {}),
        },
      }));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [isLoggedIn, user?.id]);

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

  const restoreFocus = useCallback((amount = 1) => {
    if (amount <= 0) return;
    setProgressState((current) => ({
      ...current,
      focusPoints: Math.min(MAX_FOCUS_POINTS, current.focusPoints + amount),
    }));
  }, []);

  const setFocusBalance = useCallback((balance) => {
    if (!Number.isFinite(balance)) return;
    setProgressState((current) => ({
      ...current,
      focusPoints: Math.min(MAX_FOCUS_POINTS, Math.max(0, balance)),
    }));
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

  const claimQuest = useCallback(async (quest, periodKey) => {
    const claimKey = `${quest.id}:${periodKey}`;
    if (progressState.questClaims?.[claimKey]) return { alreadyClaimed: true };

    let xpAwarded = quest.xp;
    let focusRestored = quest.focus;
    if (isLoggedIn) {
      const response = await claimQuestReward(quest.id);
      xpAwarded = response.data.xp_awarded || 0;
      focusRestored = response.data.focus_restored || 0;
      updateUserProgress({ xp: response.data.xp, level: response.data.level });
    } else {
      const nextXp = (user?.xp || 0) + xpAwarded;
      updateUserProgress({ xp: nextXp, level: getLevelMeta(nextXp).level });
    }

    setProgressState((current) => {
      return {
        ...current,
        focusPoints: Math.min(MAX_FOCUS_POINTS, current.focusPoints + focusRestored),
        questClaims: {
          ...(current.questClaims || {}),
          [claimKey]: { claimedAt: new Date().toISOString(), xpAwarded, focusRestored },
        },
      };
    });
    return { alreadyClaimed: false, xpAwarded, focusRestored };
  }, [isLoggedIn, progressState.questClaims, updateUserProgress, user?.xp]);

  const clearLevelUp = useCallback(() => setLevelUpState(null), []);
  const showCityReward = useCallback((reward) => setCityReward(reward), []);
  const clearCityReward = useCallback(() => setCityReward(null), []);

  const derived = useMemo(() => {
    const xp = user?.xp || 0;
    const levelMeta = getLevelMeta(xp);
    const rankMeta = getRankMeta(levelMeta.level, user?.rank?.id);
    return {
      levelMeta,
      rankMeta,
      unlockedPowers: getUnlockedPowers(levelMeta.level),
      availableBadges: BADGES,
      allPowers: POWERS,
      allLevels: LEVELS,
    };
  }, [user?.rank?.id, user?.xp]);

  return (
    <GameProgressContext.Provider
      value={{
        progressState,
        levelUpState,
        clearLevelUp,
        addBonusXp,
        claimQuest,
        consumeFocus,
        restoreFocus,
        setFocusBalance,
        showCityReward,
        recordChallengeResult,
        ...derived,
      }}
    >
      {children}
      <LevelUpModal levelUpState={levelUpState} onClose={clearLevelUp} />
      <CityRewardCeremony reward={levelUpState ? null : cityReward} onClose={clearCityReward} />
    </GameProgressContext.Provider>
  );
};
