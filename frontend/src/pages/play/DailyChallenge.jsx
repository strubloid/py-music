import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Zap, Flame, RefreshCw, CheckCircle, Loader } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getDailyChallenges,
  completeDailyChallenge,
  seedChallenges,
  getUserStreak,
} from '../../services/api';
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
  const seenChallengeIdsRef = useRef([]);
  const advanceTimerRef = useRef(null);

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

  useEffect(() => () => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
  }, []);

  const activeChallenge = challenges[activeIndex] || null;
  const activeResult = activeChallenge ? results[activeChallenge.id] : null;

  const handleAnswer = async (challengeId, selectedIdx, correctIdx) => {
    if (completing[challengeId] || results[challengeId]) return;

    const isCorrect = selectedIdx === correctIdx;
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
        if (isLoggedIn) {
          const res = await completeDailyChallenge(challengeId);
          updateUserProgress({ xp: res.data.xp, level: res.data.level });
          rememberCompletedChallengeId(challengeId);
          setResults((prev) => ({
            ...prev,
            [challengeId]: {
              correct: true,
              xpAwarded: res.data.xp_awarded,
            },
          }));

          const streakRes = await getUserStreak();
          setStreak(streakRes.data.streak);
          setCompletedToday(streakRes.data.completed_today);
          window.dispatchEvent(new Event('streak:updated'));
          queueNextChallenge();
        } else {
          setResults((prev) => ({
            ...prev,
            [challengeId]: {
              correct: true,
              xpAwarded: 0,
            },
          }));
          queueNextChallenge();
        }
      } else {
        setResults((prev) => ({
          ...prev,
          [challengeId]: {
            correct: false,
            xpAwarded: 0,
          },
        }));
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
          <div className="streak-badge">
            <Flame size={16} />
            <span>{streak} day streak</span>
          </div>
        )}
      </div>

      {error && <div className="daily-error">{error}</div>}

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
                <span className="challenge-xp">+{activeChallenge.xp_reward} XP</span>
                <span className="challenge-diff">{diffStars(activeChallenge.difficulty)}</span>
              </div>

              <h3 className="challenge-title">{activeChallenge.title}</h3>
              <p className="challenge-question">{activeChallenge.question}</p>
              {activeChallenge.explanation && (
                <div className="challenge-explanation">
                  <strong>Helpful hint:</strong> {activeChallenge.explanation}
                </div>
              )}

              <div className="challenge-options">
                {activeChallenge.options.map((opt, i) => {
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
                        ? <>🎉 Perfect groove! <strong>+{activeResult.xpAwarded} XP</strong></>
                        : <>🎉 Perfect groove! <strong>Reward already claimed</strong></>)
                      : <>🎉 Nice hit! <strong>Sign in to save XP</strong></>
                    : <>🎯 Off beat — the answer was <strong>{activeChallenge.options[activeChallenge.correct_index]}</strong></>
                  }
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
