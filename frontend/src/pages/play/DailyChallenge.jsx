import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Zap, RefreshCw, CheckCircle, Loader, Flame, Target, Trophy } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useGameProgress } from '../../contexts/GameProgressContext.jsx';
import StreakBadge from '../../components/game/StreakBadge.jsx';
import {
  getDailyChallenges,
  completeDailyChallenge,
  seedChallenges,
  getUserStreak,
} from '../../services/api';
import { calculateChallengeBonuses, calculateQuestionXp, calculateXpPreview, getPowerById } from '../../game/gameSystem.tsx';
import './DailyChallenge.css';

const INITIAL_LIMIT = 1;
const RANDOM_FETCH_LIMIT = 10;
const NEXT_CHALLENGE_DELAY_MS = 900;

const getCompletedChallengeIds = () => {
  try {
    return JSON.parse(sessionStorage.getItem('strubloid:completed-challenge-ids') || '[]');
  } catch {
    return [];
  }
};

const rememberCompletedChallengeId = (challengeId) => {
  const ids = new Set(getCompletedChallengeIds());
  ids.add(challengeId);
  sessionStorage.setItem('strubloid:completed-challenge-ids', JSON.stringify(Array.from(ids)));
};

const DailyChallenge = () => {
  const { user, isLoggedIn, updateUserProgress } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [streak, setStreak] = useState(0);
  const [completedToday, setCompletedToday] = useState(false);
  const [completing, setCompleting] = useState({}); // { [challengeId]: bool }
  const [results, setResults] = useState({}); // { [challengeId]: { correct: bool, xpAwarded: int } }
  const [totalRemaining, setTotalRemaining] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [dailySummary, setDailySummary] = useState(null);
  const [hiddenOptionIndexes, setHiddenOptionIndexes] = useState([]);
  const [questionPowersUsed, setQuestionPowersUsed] = useState([]);
  const [dailyBonusClaimed, setDailyBonusClaimed] = useState(false);
  const [xpBreakdown, setXpBreakdown] = useState(null);
  const [feedbackBurst, setFeedbackBurst] = useState(null);
  const seenChallengeIdsRef = useRef([]);
  const advanceTimerRef = useRef(null);
  const questionStartedAtRef = useRef(Date.now());
  const sessionStatsRef = useRef({ answered: 0, correct: 0, totalXp: 0, powersUsed: [] });
  const burstTimerRef = useRef(null);
  const { unlockedPowers, consumeFocus, recordChallengeResult, levelMeta, progressState } = useGameProgress();

  const showFeedbackBurst = useCallback((label, tone = 'positive') => {
    if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
    setFeedbackBurst({ label, tone });
    burstTimerRef.current = setTimeout(() => setFeedbackBurst(null), 1600);
  }, []);

  const rememberSeenChallenges = useCallback((nextChallenges) => {
    const ids = new Set(seenChallengeIdsRef.current);
    nextChallenges.forEach((challenge) => ids.add(challenge.id));
    seenChallengeIdsRef.current = Array.from(ids);
  }, []);

  const loadRandomChallenge = useCallback(async ({
    replace = false,
    excludeIds = [],
    fallbackExcludeIds = [],
    avoidIds = [],
  } = {}) => {
    const pickChallenge = (items) => items.find((challenge) => !avoidIds.includes(challenge.id));
    let res = await getDailyChallenges(RANDOM_FETCH_LIMIT, 0, {
      random: true,
      excludeIds,
    });
    let nextChallenge = pickChallenge(res.data.challenges);

    if (!nextChallenge && excludeIds.length > fallbackExcludeIds.length) {
      seenChallengeIdsRef.current = fallbackExcludeIds;
      res = await getDailyChallenges(RANDOM_FETCH_LIMIT, 0, {
        random: true,
        excludeIds: fallbackExcludeIds,
      });
      nextChallenge = pickChallenge(res.data.challenges);
    }

    if (!nextChallenge) {
      setTotalRemaining(0);
      if (replace) {
        setChallenges([]);
        setActiveIndex(0);
        setResults({});
        setCompleting({});
      }
      return null;
    }

    rememberSeenChallenges([nextChallenge]);

    if (replace) {
      setChallenges([nextChallenge]);
      setActiveIndex(0);
      setResults({});
      setCompleting({});
    } else {
      setChallenges((prev) => [...prev, nextChallenge]);
      setActiveIndex((current) => current + 1);
    }

    setTotalRemaining(res.data.remaining);
    return nextChallenge;
  }, [rememberSeenChallenges]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [chalRes, streakRes] = await Promise.all([
        getDailyChallenges(INITIAL_LIMIT, 0, {
          random: true,
          excludeIds: getCompletedChallengeIds(),
        }),
        isLoggedIn ? getUserStreak() : Promise.resolve({ data: { streak: 0, completed_today: false } }),
      ]);
      setChallenges(chalRes.data.challenges);
      setActiveIndex(0);
      setTotalRemaining(chalRes.data.remaining);
      const initialSeenIds = chalRes.data.challenges.map((challenge) => challenge.id);
      seenChallengeIdsRef.current = initialSeenIds;
      setStreak(streakRes.data.streak);
      setCompletedToday(streakRes.data.completed_today);
      setCompleting({});
      setResults({});
      setCombo(0);
      setMaxCombo(0);
      setDailySummary(null);
      setHiddenOptionIndexes([]);
      setQuestionPowersUsed([]);
      setXpBreakdown(null);
      sessionStatsRef.current = { answered: 0, correct: 0, totalXp: 0, powersUsed: [] };
      window.dispatchEvent(new Event('streak:updated'));
    } catch (err) {
      setError('Failed to load challenges. Try reloading.');
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    questionStartedAtRef.current = Date.now();
    setHiddenOptionIndexes([]);
    setQuestionPowersUsed([]);
  }, [activeIndex]);

  useEffect(() => () => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
  }, []);

  const activeChallenge = challenges[activeIndex] || null;
  const activeResult = activeChallenge ? results[activeChallenge.id] : null;
  const xpPreview = calculateXpPreview({ baseXp: activeChallenge?.xp_reward || 0, replayCount: 0, powerIds: questionPowersUsed });

  const handleAnswer = async (challengeId, selectedIdx, correctIdx) => {
    if (completing[challengeId] || results[challengeId]) return;

    const isCorrect = selectedIdx === correctIdx;
    const isFastAnswer = Date.now() - questionStartedAtRef.current <= 7000;
    const penalties = (questionPowersUsed.includes('remove_one_option') ? 10 : 0);
    const comboBonus = combo >= 10 ? 5 : combo >= 5 ? 3 : combo >= 2 ? 1 : 0;
    const bonusXp = (isCorrect ? 5 : 0) + (isCorrect && isFastAnswer ? 3 : 0) + (isCorrect ? comboBonus : 0);
    const awardedXp = calculateQuestionXp({
      baseXp: activeChallenge?.xp_reward || 10,
      isCorrect,
      isFirstTry: true,
      isFastAnswer,
      combo,
      penalties,
    });
    setXpBreakdown({
      baseXp: activeChallenge?.xp_reward || 10,
      penalties,
      bonusXp,
      finalXp: isCorrect ? awardedXp : 0,
    });
    setCompleting((prev) => ({ ...prev, [challengeId]: true }));

    const queueNextChallenge = () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      const excludeIds = Array.from(new Set([...seenChallengeIdsRef.current, challengeId]));
      const fallbackExcludeIds = [challengeId];
      const avoidIds = [challengeId];
      advanceTimerRef.current = setTimeout(() => {
        loadRandomChallenge({ replace: true, excludeIds, fallbackExcludeIds, avoidIds }).catch(() => {
          setError('Failed to load next challenge.');
        });
      }, NEXT_CHALLENGE_DELAY_MS);
    };

    try {
      if (isCorrect) {
        const nextCombo = combo + 1;
        setCombo(nextCombo);
        setMaxCombo((current) => Math.max(current, nextCombo));
        if (isLoggedIn) {
          const streakRes = await getUserStreak();
          setStreak(streakRes.data.streak);
          setCompletedToday(streakRes.data.completed_today);

          const bonuses = !dailyBonusClaimed
            ? calculateChallengeBonuses({ answeredCorrectly: 1, totalQuestions: 1, maxCombo: nextCombo, isDaily: true })
            : { completionXp: 0, perfectXp: 0, dailyXp: 0, comboXp: 0 };
          const streakBonus = !dailyBonusClaimed && streakRes.data.streak >= 3 ? 20 : 0;
          const bonusTotal = bonuses.completionXp + bonuses.perfectXp + bonuses.dailyXp + streakBonus;
          const totalAwardXp = awardedXp + bonusTotal;

          const res = await completeDailyChallenge(challengeId, { xp_award: totalAwardXp });
          rememberCompletedChallengeId(challengeId);
          const isAuthenticatedReward = res.data.authenticated !== false;

          if (isAuthenticatedReward) {
            updateUserProgress({ xp: res.data.xp, level: res.data.level });
          }

          setResults((prev) => ({
            ...prev,
            [challengeId]: {
              correct: true,
              xpAwarded: res.data.xp_awarded,
            },
          }));

          if (isAuthenticatedReward && !dailyBonusClaimed) {
            setDailyBonusClaimed(true);
            setDailySummary({
              score: 1,
              accuracy: 1,
              xpEarned: totalAwardXp,
              combo: nextCombo,
              powersUsed: questionPowersUsed,
              streak: streakRes.data.streak,
            });
          } else if (isAuthenticatedReward) {
            setDailySummary({
              score: 1,
              accuracy: 1,
              xpEarned: totalAwardXp,
              combo: nextCombo,
              powersUsed: questionPowersUsed,
              streak: streakRes.data.streak,
            });
          } else {
            setDailySummary({
              score: 1,
              accuracy: 1,
              xpEarned: 0,
              combo: nextCombo,
              powersUsed: questionPowersUsed,
              streak: streakRes.data.streak,
            });
          }

          sessionStatsRef.current = {
            answered: sessionStatsRef.current.answered + 1,
            correct: sessionStatsRef.current.correct + 1,
            totalXp: sessionStatsRef.current.totalXp + (isAuthenticatedReward ? totalAwardXp : 0),
            powersUsed: [...sessionStatsRef.current.powersUsed, ...questionPowersUsed],
          };
          recordChallengeResult({
            challengeId: `${challengeId}`,
            mode: 'daily',
            score: 1,
            accuracy: 1,
            xpEarned: isAuthenticatedReward ? totalAwardXp : 0,
            maxCombo: Math.max(maxCombo, nextCombo),
            powersUsed: questionPowersUsed,
            streakDays: streakRes.data.streak,
            completedAt: new Date().toISOString(),
          });
          showFeedbackBurst(isAuthenticatedReward ? `+${totalAwardXp} XP` : 'Sign in to save XP', isAuthenticatedReward ? 'positive' : 'neutral');
          window.dispatchEvent(new Event('streak:updated'));
          queueNextChallenge();
        } else {
          setResults((prev) => ({
            ...prev,
            [challengeId]: {
              correct: true,
              xpAwarded: awardedXp,
            },
          }));
          sessionStatsRef.current = {
            answered: sessionStatsRef.current.answered + 1,
            correct: sessionStatsRef.current.correct + 1,
            totalXp: sessionStatsRef.current.totalXp + awardedXp,
            powersUsed: [...sessionStatsRef.current.powersUsed, ...questionPowersUsed],
          };
          setDailySummary({ score: 1, accuracy: 1, xpEarned: awardedXp, combo: nextCombo, powersUsed: questionPowersUsed, streak });
          recordChallengeResult({
            challengeId: `${challengeId}`,
            mode: 'daily',
            score: 1,
            accuracy: 1,
            xpEarned: awardedXp,
            maxCombo: Math.max(maxCombo, nextCombo),
            powersUsed: questionPowersUsed,
            streakDays: streak,
            completedAt: new Date().toISOString(),
          });
          showFeedbackBurst(`+${awardedXp} XP`, 'positive');
          queueNextChallenge();
        }
      } else {
        const preservesCombo = questionPowersUsed.includes('second_chance') || questionPowersUsed.includes('freeze_combo');
        if (!preservesCombo) setCombo(0);
        setResults((prev) => ({
          ...prev,
          [challengeId]: {
            correct: false,
            xpAwarded: 0,
          },
        }));
        sessionStatsRef.current = {
          ...sessionStatsRef.current,
          answered: sessionStatsRef.current.answered + 1,
        };
        setDailySummary({ score: 0, accuracy: 0, xpEarned: 0, combo, powersUsed: questionPowersUsed, streak });
        if (penalties > 0) showFeedbackBurst(`-${penalties} XP lost`, 'negative');
        rememberCompletedChallengeId(challengeId);
        queueNextChallenge();
      }
    } catch (err) {
      if (err.response?.status === 400) {
        setResults((prev) => ({
          ...prev,
          [challengeId]: {
            correct: true,
            xpAwarded: 0,
          },
        }));
        queueNextChallenge();
      } else {
        setError('Failed to submit answer.');
      }
    } finally {
      setCompleting((prev) => ({ ...prev, [challengeId]: false }));
    }
  };

  const usePower = (powerId) => {
    const power = getPowerById(powerId);
    if (!power || !activeChallenge || results[activeChallenge.id] || questionPowersUsed.includes(powerId)) return;
    if (power.focusCost && !consumeFocus(power.focusCost)) return;
    if (powerId === 'remove_one_option') {
      const wrongIndexes = activeChallenge.options.map((_, index) => index).filter((index) => index !== activeChallenge.correct_index && !hiddenOptionIndexes.includes(index));
      if (wrongIndexes.length > 0) {
        setHiddenOptionIndexes((current) => [...current, wrongIndexes[0]]);
      }
    }
    setQuestionPowersUsed((current) => [...current, powerId]);
    if (power.xpPenalty) {
      showFeedbackBurst(`-${power.xpPenalty} XP`, 'negative');
    } else if (power.focusCost) {
      showFeedbackBurst(`-${power.focusCost} focus`, 'neutral');
    }
  };

  const handleLoadMore = async () => {
    if (loadingMore) return;

    setLoadingMore(true);
    setError('');
    try {
      const excludeIds = Array.from(new Set([...seenChallengeIdsRef.current, ...challenges.map((challenge) => challenge.id)]));
      const res = await getDailyChallenges(INITIAL_LIMIT, 0, {
        random: true,
        excludeIds,
      });
      if (res.data.challenges.length === 0) {
        setTotalRemaining(0);
        return;
      }

      setChallenges((prev) => [...prev, ...res.data.challenges]);
      setActiveIndex(challenges.length);
      rememberSeenChallenges(res.data.challenges);
      setTotalRemaining(res.data.remaining);
    } catch (err) {
      setError('Failed to load more challenges.');
    } finally {
      setLoadingMore(false);
    }
  };

  const handleReload = async () => {
    setSeeding(true);
    setError('');
    try {
      await seedChallenges();
      await fetchData();
    } catch (err) {
      setError('Failed to reload challenges.');
    } finally {
      setSeeding(false);
    }
  };

  const categoryEmoji = (cat) => {
    switch (cat) {
      case 'scales': return '🎼';
      case 'chords': return '🎸';
      case 'intervals': return '📏';
      case 'theory': return '📖';
      case 'ear_training': return '👂';
      default: return '🎵';
    }
  };

  const diffStars = (d) => '★'.repeat(d) + '☆'.repeat(5 - d);

  const getCategoryStage = (challenge) => {
    const category = challenge?.category || 'theory';
    const option = challenge?.options?.[challenge.correct_index] || 'Listen';
    const question = challenge?.question || '';
    const semitoneMatch = question.match(/(\d+)\s*semitones?/i);
    const semitones = semitoneMatch?.[1] || `${challenge?.difficulty || 1}`;

    if (category === 'intervals' || category === 'ear_training') {
      return {
        className: 'stage-interval',
        label: 'Catch the interval',
        primary: `Distance: ${semitones} steps`,
        secondary: 'Name the jump',
        nodes: ['Root', 'Target'],
      };
    }

    if (category === 'chords') {
      return {
        className: 'stage-chord',
        label: 'Stack the chord',
        primary: `Color: ${option}`,
        secondary: 'Build the color',
        nodes: ['1', '3', '5'],
      };
    }

    if (category === 'scales') {
      return {
        className: 'stage-scale',
        label: 'Complete the route',
        primary: `Route: ${option}`,
        secondary: 'Find the path',
        nodes: ['I', 'II', 'III', 'IV', 'V'],
      };
    }

    return {
      className: 'stage-theory',
      label: 'Resolve the clue',
      primary: `Move: ${option}`,
      secondary: 'Theory move',
      nodes: ['Cue', 'Choice'],
    };
  };

  const getNextRecommendation = () => {
    if (!activeChallenge) return 'Next: keep the run warm.';
    if (activeChallenge.category === 'intervals') return 'Next: try another interval without powers.';
    if (activeChallenge.category === 'chords') return 'Next: stack one more chord color.';
    if (activeChallenge.category === 'scales') return 'Next: complete another scale route.';
    return 'Next: keep the combo moving.';
  };

  const stage = getCategoryStage(activeChallenge);
  const answeredCount = sessionStatsRef.current.answered + (activeResult ? 1 : 0);
  const runProgress = Math.min(100, ((answeredCount || 0) / 5) * 100);

  if (loading) {
    return (
      <div className="daily-page">
        <div className="daily-loading">
          <Loader size={32} className="spin" />
          <p>Loading challenges…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="daily-page">
      <div className="daily-header">
        <Zap className="daily-icon" size={28} />
        <div>
          <h1>Challenges</h1>
          <p className="daily-subtitle">
            {isLoggedIn ? `Keep practicing, ${user?.username}` : 'Practice now. Sign up to save XP!'}
          </p>
        </div>
        {isLoggedIn && (
          <StreakBadge streak={streak} />
        )}
      </div>

        {error && <div className="daily-error">{error}</div>}

        <div className="daily-run-header">
          <div className="daily-run-stat"><Trophy size={16} /><span>Title</span><strong>{levelMeta.title}</strong></div>
          <div className="daily-run-stat combo"><Flame size={16} /><span>Combo</span><strong>{combo}x</strong></div>
          <div className="daily-run-stat"><Target size={16} /><span>Focus</span><strong>{progressState.focusPoints}</strong></div>
          <div className="daily-score-rail" aria-label="Current reward score rail">
            <div className="daily-score-rail-top"><span>Current reward</span><strong>{xpPreview.previewXp} XP</strong></div>
            <div className="daily-score-track"><span style={{ width: `${Math.max(6, Math.min(100, (xpPreview.previewXp / Math.max(1, xpPreview.baseXp)) * 100))}%` }} /></div>
            <small>{xpPreview.penalties > 0 ? `${xpPreview.penalties} XP spent on powers` : 'Full reward available'}</small>
          </div>
          <div className="daily-run-progress" aria-label="Run progress">
            <span>Run progress</span>
            <strong>{Math.min(5, answeredCount)}/5</strong>
            <div className="daily-score-track"><span style={{ width: `${Math.max(8, runProgress)}%` }} /></div>
          </div>
        </div>

        {!activeChallenge ? (
        <div className="daily-empty">
          <CheckCircle size={48} className="empty-icon" />
          <h2>All challenges completed!</h2>
          <p>Reload the challenge bank to get fresh questions.</p>
          <button className="reload-btn" onClick={handleReload} disabled={seeding}>
            <RefreshCw size={16} className={seeding ? 'spin' : ''} />
            {seeding ? 'Generating…' : 'Reload challenges'}
          </button>
        </div>
      ) : (
        <>
          <div className="challenges-grid">
            <div
              key={activeChallenge.id}
              className={`challenge-card ${activeResult ? (activeResult.correct ? 'card-correct' : 'card-incorrect') : ''}`}
            >
              <div className="challenge-meta">
                <span className="challenge-category">
                  {categoryEmoji(activeChallenge.category)} {activeChallenge.category.replace('_', ' ')}
                </span>
                <span className="challenge-xp">+{xpPreview.previewXp} XP</span>
                <span className="challenge-diff">{diffStars(activeChallenge.difficulty)}</span>
              </div>

              <div className={`challenge-stage ${stage.className}`}>
                <div className="challenge-stage-copy">
                  <span>{stage.label}</span>
                  <strong>{stage.primary}</strong>
                  <small>{stage.secondary}</small>
                </div>
                <div className="challenge-stage-visual" aria-hidden="true">
                  {stage.nodes.map((node, index) => <i key={`${node}-${index}`}>{node}</i>)}
                </div>
              </div>

              <div className="daily-xp-preview">
                <span className="daily-xp-base">Base +{xpPreview.baseXp} XP</span>
                {xpPreview.penalties > 0 && <span className="daily-xp-penalty">-{xpPreview.penalties} XP</span>}
                <strong className="daily-xp-total">Current reward {xpPreview.previewXp} XP</strong>
              </div>
              {feedbackBurst && <div className={`daily-feedback-burst ${feedbackBurst.tone}`}>{feedbackBurst.label}</div>}

              <h3 className="challenge-title">{activeChallenge.title}</h3>
              <p className="challenge-question">{activeChallenge.question}</p>
              {activeChallenge.explanation && (
                <div className="challenge-explanation">
                  <strong>Helpful hint:</strong> {activeChallenge.explanation}
                </div>
              )}

              <div className="daily-powers">
                {unlockedPowers.filter((power) => ['remove_one_option', 'second_chance', 'freeze_combo'].includes(power.id)).map((power) => (
                  <button key={power.id} type="button" className={`daily-power ${questionPowersUsed.includes(power.id) ? 'used' : ''}`} onClick={() => usePower(power.id)} disabled={questionPowersUsed.includes(power.id) || !!activeResult}>
                    <span>{power.name}</span>
                    <small>{power.focusCost ? `${power.focusCost} focus` : `-${power.xpPenalty} XP`}</small>
                  </button>
                ))}
              </div>

              <div className="challenge-options">
                {activeChallenge.options.map((opt, i) => {
                  if (hiddenOptionIndexes.includes(i)) return null;
                  let optClass = 'challenge-option';
                  if (activeResult) {
                    if (i === activeChallenge.correct_index) optClass += ' correct';
                    else optClass += ' wrong';
                  }
                  return (
                    <button
                      key={i}
                      type="button"
                      className={optClass}
                      onClick={() => handleAnswer(activeChallenge.id, i, activeChallenge.correct_index)}
                    >
                      {opt}
                      {activeResult && i === activeChallenge.correct_index && <CheckCircle size={16} className="opt-correct-icon" />}
                    </button>
                  );
                })}
              </div>

              {activeResult && (
                <div className={`challenge-result ${activeResult.correct ? 'result-correct' : 'result-incorrect'}`}>
                  {activeResult.correct
                    ? isLoggedIn
                      ? (activeResult.xpAwarded > 0
                        ? <>Clean hit. Perfect groove! <strong>+{activeResult.xpAwarded} XP</strong></>
                        : <>Clean hit. Perfect groove! <strong>Reward already claimed</strong></>)
                      : <>Clean hit. Nice hit! <strong>Sign in to save XP</strong></>
                    : <>Off beat — the answer was <strong>{activeChallenge.options[activeChallenge.correct_index]}</strong></>
                  }
                </div>
              )}

              {xpBreakdown && activeResult?.correct && (
                <div className="daily-xp-breakdown">
                  <span>Base {xpBreakdown.baseXp} XP</span>
                  {xpBreakdown.penalties > 0 && <span>-{xpBreakdown.penalties} XP penalties</span>}
                  {xpBreakdown.bonusXp > 0 && <span>+{xpBreakdown.bonusXp} XP bonuses</span>}
                  <strong>= {xpBreakdown.finalXp} XP</strong>
                </div>
              )}

              {dailySummary && (
                <div className="daily-summary-card">
                  <h4>Daily Summary</h4>
                  <p>
                    {dailySummary.score ? `Daily Complete! You earned ${dailySummary.xpEarned} XP` : 'Daily challenge missed this round'}
                    {dailySummary.streak ? ` and kept your ${dailySummary.streak}-day streak.` : '.'}
                  </p>
                  <div className="daily-summary-grid">
                    <div><span>Accuracy</span><strong>{Math.round((dailySummary.accuracy || 0) * 100)}%</strong></div>
                    <div><span>Combo</span><strong>{dailySummary.combo}</strong></div>
                    <div><span>Powers</span><strong>{dailySummary.powersUsed.length}</strong></div>
                  </div>
                  <div className="daily-next-card">
                    <span>Recommended next move</span>
                    <strong>{getNextRecommendation()}</strong>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="challenges-actions">
            {totalRemaining > 0 && (
              <button className="load-more-btn" onClick={handleLoadMore} disabled={loadingMore}>
                {loadingMore ? 'Loading next challenge…' : 'Load another challenge'}
                {!loadingMore && totalRemaining > 0 ? ` (${totalRemaining} remaining)` : ''}
              </button>
            )}
            <button className="reload-btn" onClick={handleReload} disabled={seeding}>
              <RefreshCw size={16} className={seeding ? 'spin' : ''} />
              {seeding ? 'Generating…' : 'Reload challenge bank'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default DailyChallenge;
