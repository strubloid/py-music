import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Zap, RefreshCw, CheckCircle, Loader, Flame, Target, Trophy, XCircle, Lightbulb } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useGameProgress } from '../../contexts/GameProgressContext'
import StreakBadge from '../../components/game/StreakBadge'
import NoteAvatar from '../../features/ear-game/components/NoteAvatar'
import RewardOverlay from '../../features/ear-game/components/RewardOverlay'
import DailyVisualStage from '../../features/daily-challenge/DailyVisualStage'
import { actionForKeyboardEvent, shouldIgnoreGameShortcut } from '../../features/ear-game/hooks/gameInput'
import {
  completeDailyChallenge,
  getDailyChallenges,
  getMe,
  getUserStreak,
  revealDailyChallengeHint,
} from '../../services/api'
import { calculateXpPreview, getModeBaseXp, getPowerById } from '../../game/gameSystem'
import '../../features/ear-game/styles/overlays.scss'
import './DailyChallenge.scss'

const INITIAL_LIMIT = 1
const RANDOM_FETCH_LIMIT = 10
const DAILY_RUN_LENGTH = 5
const GUEST_HINT_LIMITS = {
  unranked: 2,
  bronze: 3,
  silver: 4,
  gold: 5,
  platinum: 6,
  diamond: 7,
  master: 8,
  grandmaster: 9,
  virtuoso: 10,
  maestro: 11,
  legendary: 12,
}
const utcDateKey = () => new Date().toISOString().slice(0, 10)
const getDisplayQuestion = (challenge) => {
  if (challenge?.visual?.kind !== 'history') return challenge?.question
  if (challenge.category === 'scales') return 'Which scale is this?'
  if (challenge.category === 'intervals') return 'Name this interval.'
  if (/5th of C Major/i.test(challenge.question || '')) return 'Which note is degree 5?'
  return challenge?.question
}

const getCompletedChallengeIds = () => {
  try {
    return JSON.parse(sessionStorage.getItem('strubloid:completed-challenge-ids') || '[]')
  } catch {
    return []
  }
}

const rememberCompletedChallengeId = (challengeId) => {
  const ids = new Set(getCompletedChallengeIds())
  ids.add(challengeId)
  sessionStorage.setItem('strubloid:completed-challenge-ids', JSON.stringify(Array.from(ids)))
}

const DailyChallenge = () => {
  const { user, isLoggedIn, updateUserProgress } = useAuth()
  const [challenges, setChallenges] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [seeding, setSeeding] = useState(false)
  const [streak, setStreak] = useState(0)
  const [completedToday, setCompletedToday] = useState(false)
  const [completing, setCompleting] = useState({}) // { [challengeId]: bool }
  const [results, setResults] = useState({}) // { [challengeId]: { correct, correctAnswerIndex, xpAwarded } }
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [dailySummary, setDailySummary] = useState(null)
  const [hiddenOptionIndexes, setHiddenOptionIndexes] = useState([])
  const [questionPowersUsed, setQuestionPowersUsed] = useState([])
  const [xpBreakdown, setXpBreakdown] = useState(null)
  const [feedbackBurst, setFeedbackBurst] = useState(null)
  const [answerPopup, setAnswerPopup] = useState(null)
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0)
  const [hintAllowance, setHintAllowance] = useState(null)
  const [revealedHint, setRevealedHint] = useState('')
  const [dailyRunComplete, setDailyRunComplete] = useState(false)
  const seenChallengeIdsRef = useRef([])
  const questionStartedAtRef = useRef(Date.now())
  const answerCommitRef = useRef(false)
  const sessionStatsRef = useRef({ answered: 0, correct: 0, totalXp: 0, powersUsed: [] })
  const burstTimerRef = useRef(null)
  const { unlockedPowers, consumeFocus, recordChallengeResult, rankMeta, progressState } = useGameProgress()

  const showFeedbackBurst = useCallback((label, tone = 'positive') => {
    if (burstTimerRef.current) clearTimeout(burstTimerRef.current)
    setFeedbackBurst({ label, tone })
    burstTimerRef.current = setTimeout(() => setFeedbackBurst(null), 1600)
  }, [])

  const rememberSeenChallenges = useCallback((nextChallenges) => {
    const ids = new Set(seenChallengeIdsRef.current)
    nextChallenges.forEach((challenge) => ids.add(challenge.id))
    seenChallengeIdsRef.current = Array.from(ids)
  }, [])

  const loadRandomChallenge = useCallback(
    async ({ replace = false, excludeIds = [], fallbackExcludeIds = [], avoidIds = [] } = {}) => {
      const pickChallenge = (items) => items.find((challenge) => !avoidIds.includes(challenge.id))
      let res = await getDailyChallenges(RANDOM_FETCH_LIMIT, 0, {
        random: true,
        excludeIds,
      })
      let nextChallenge = pickChallenge(res.data.challenges)

      if (!nextChallenge && excludeIds.length > fallbackExcludeIds.length) {
        seenChallengeIdsRef.current = fallbackExcludeIds
        res = await getDailyChallenges(RANDOM_FETCH_LIMIT, 0, {
          random: true,
          excludeIds: fallbackExcludeIds,
        })
        nextChallenge = pickChallenge(res.data.challenges)
      }

      if (!nextChallenge) {
        if (replace) {
          setChallenges([])
          setActiveIndex(0)
          setResults({})
          setCompleting({})
        }
        return null
      }

      rememberSeenChallenges([nextChallenge])

      if (replace) {
        setChallenges([nextChallenge])
        setActiveIndex(0)
        setResults({})
        setCompleting({})
      } else {
        setChallenges((prev) => [...prev, nextChallenge])
        setActiveIndex((current) => current + 1)
      }

      if (res.data.hint_allowance) setHintAllowance(res.data.hint_allowance)
      return nextChallenge
    },
    [rememberSeenChallenges],
  )

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const [chalRes, streakRes] = await Promise.all([
        getDailyChallenges(INITIAL_LIMIT, 0, {
          random: true,
          excludeIds: getCompletedChallengeIds(),
        }),
        isLoggedIn ? getUserStreak() : Promise.resolve({ data: { streak: 0, completed_today: false } }),
      ])
      setChallenges(chalRes.data.challenges)
      setActiveIndex(0)
      const initialSeenIds = chalRes.data.challenges.map((challenge) => challenge.id)
      seenChallengeIdsRef.current = initialSeenIds
      setStreak(streakRes.data.streak)
      setCompletedToday(streakRes.data.completed_today)
      setCompleting({})
      setResults({})
      setCombo(0)
      setMaxCombo(0)
      setDailySummary(null)
      setHiddenOptionIndexes([])
      setQuestionPowersUsed([])
      setXpBreakdown(null)
      setHintAllowance(chalRes.data.hint_allowance || null)
      setRevealedHint('')
      setDailyRunComplete(false)
      sessionStatsRef.current = { answered: 0, correct: 0, totalXp: 0, powersUsed: [] }
      window.dispatchEvent(new Event('streak:updated'))
    } catch (err) {
      setError('Failed to load challenges. Try reloading.')
    } finally {
      setLoading(false)
    }
  }, [isLoggedIn])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    questionStartedAtRef.current = Date.now()
    setHiddenOptionIndexes([])
    setQuestionPowersUsed([])
    setSelectedOptionIndex(0)
    setRevealedHint('')
    answerCommitRef.current = false
  }, [activeIndex])

  const activeChallenge = challenges[activeIndex] || null
  const displayQuestion = getDisplayQuestion(activeChallenge)
  const activeResult = activeChallenge ? results[activeChallenge.id] : null
  const challengeBaseXp = activeChallenge
    ? getModeBaseXp({ mode: 'challenge', difficulty: activeChallenge.difficulty })
    : 0
  const xpPreview = calculateXpPreview({ baseXp: challengeBaseXp, replayCount: 0, powerIds: [] })

  const advanceToNextChallenge = useCallback(
    (challengeId) => {
      const excludeIds = Array.from(new Set([...seenChallengeIdsRef.current, challengeId]))
      loadRandomChallenge({
        replace: true,
        excludeIds,
        fallbackExcludeIds: [challengeId],
        avoidIds: [challengeId],
      }).catch(() => {
        setError('Failed to load next challenge.')
      })
    },
    [loadRandomChallenge],
  )

  const dismissAnswerPopup = () => {
    if (!answerPopup) return
    const { challengeId, userProgress } = answerPopup
    setAnswerPopup(null)
    if (userProgress) updateUserProgress(userProgress)
    if (sessionStatsRef.current.answered >= DAILY_RUN_LENGTH) {
      setDailyRunComplete(true)
      return
    }
    advanceToNextChallenge(challengeId)
  }

  const handleAnswer = async (challengeId, selectedIdx) => {
    if (completing[challengeId] || results[challengeId] || answerCommitRef.current) return
    if (!activeChallenge) return
    answerCommitRef.current = true

    const penalties = 0
    const bonusXp = 0
    setXpBreakdown({
      baseXp: challengeBaseXp,
      penalties,
      bonusXp,
      finalXp: 0,
    })
    setCompleting((prev) => ({ ...prev, [challengeId]: true }))

    let serverCorrect = false
    let serverCorrectAnswer = null
    let serverXpAwarded = 0
    let serverAuthenticated = isLoggedIn
    let pendingUserProgress = null

    try {
      const res = await completeDailyChallenge(challengeId, {
        mode: 'challenge',
        submitted_answer: selectedIdx,
        submitted_answer_label: activeChallenge.options[selectedIdx],
      })
      serverCorrect = Boolean(res.data.correct)
      serverCorrectAnswer = res.data.correct_answer ?? null
      serverXpAwarded = res.data.xp_awarded || 0
      serverAuthenticated = res.data.authenticated !== false
    } catch (err) {
      if (err.response?.status === 400) {
        setError('That challenge is not part of the scored bank anymore.')
      } else {
        setError('Failed to submit answer.')
      }
      setCompleting((prev) => ({ ...prev, [challengeId]: false }))
      answerCommitRef.current = false
      return
    }

    setXpBreakdown({
      baseXp: challengeBaseXp,
      penalties,
      bonusXp,
      finalXp: serverXpAwarded,
    })

    const openAnswerPopup = (extra = {}) =>
      setAnswerPopup({
        challengeId,
        correct: serverCorrect,
        correctAnswer: serverCorrectAnswer ?? activeChallenge.options[selectedIdx],
        explanation: activeChallenge.explanation,
        ...extra,
      })

    if (serverCorrect) {
      const nextCombo = combo + 1
      setCombo(nextCombo)
      setMaxCombo((current) => Math.max(current, nextCombo))
      if (serverAuthenticated) {
        let streakData = { streak: 0, completed_today: false }
        try {
          const streakRes = await getUserStreak()
          streakData = streakRes.data
        } catch {
          /* keep previous streak */
        }
        setStreak(streakData.streak)
        setCompletedToday(streakData.completed_today)
        rememberCompletedChallengeId(challengeId)

        try {
          const me = await getMe()
          if (me.data?.user) {
            pendingUserProgress = {
              xp: me.data.user.xp,
              level: me.data.user.level,
              rank: me.data.user.rank,
            }
          }
        } catch {
          /* ignore */
        }

        setResults((prev) => ({
          ...prev,
          [challengeId]: {
            correct: true,
            correctAnswerIndex: activeChallenge.options.indexOf(serverCorrectAnswer),
            xpAwarded: serverXpAwarded,
          },
        }))
        setDailySummary({
          score: 1,
          accuracy: 1,
          xpEarned: serverXpAwarded,
          combo: nextCombo,
          powersUsed: questionPowersUsed,
          streak: streakData.streak,
        })
        sessionStatsRef.current = {
          answered: sessionStatsRef.current.answered + 1,
          correct: sessionStatsRef.current.correct + 1,
          totalXp: sessionStatsRef.current.totalXp + serverXpAwarded,
          powersUsed: [...sessionStatsRef.current.powersUsed, ...questionPowersUsed],
        }
        recordChallengeResult({
          challengeId: `${challengeId}`,
          mode: 'daily',
          score: 1,
          accuracy: 1,
          xpEarned: serverXpAwarded,
          maxCombo: Math.max(maxCombo, nextCombo),
          powersUsed: questionPowersUsed,
          streakDays: streakData.streak,
          completedAt: new Date().toISOString(),
        })
        showFeedbackBurst(`+${serverXpAwarded} XP`, 'positive')
        window.dispatchEvent(new Event('streak:updated'))
        openAnswerPopup({ xpAwarded: serverXpAwarded, signedInReward: true, userProgress: pendingUserProgress })
      } else {
        setResults((prev) => ({
          ...prev,
          [challengeId]: {
            correct: true,
            correctAnswerIndex: activeChallenge.options.indexOf(serverCorrectAnswer),
            xpAwarded: 0,
          },
        }))
        sessionStatsRef.current = {
          answered: sessionStatsRef.current.answered + 1,
          correct: sessionStatsRef.current.correct + 1,
          totalXp: sessionStatsRef.current.totalXp,
          powersUsed: [...sessionStatsRef.current.powersUsed, ...questionPowersUsed],
        }
        setDailySummary({
          score: 1,
          accuracy: 1,
          xpEarned: 0,
          combo: nextCombo,
          powersUsed: questionPowersUsed,
          streak,
        })
        recordChallengeResult({
          challengeId: `${challengeId}`,
          mode: 'daily',
          score: 1,
          accuracy: 1,
          xpEarned: 0,
          maxCombo: Math.max(maxCombo, nextCombo),
          powersUsed: questionPowersUsed,
          streakDays: streak,
          completedAt: new Date().toISOString(),
        })
        showFeedbackBurst('Sign in to save XP', 'neutral')
        openAnswerPopup({ xpAwarded: 0, signedInReward: false })
      }
    } else {
      const preservesCombo = questionPowersUsed.includes('second_chance') || questionPowersUsed.includes('freeze_combo')
      if (!preservesCombo) setCombo(0)
      setResults((prev) => ({
        ...prev,
        [challengeId]: {
          correct: false,
          correctAnswerIndex: activeChallenge.options.indexOf(serverCorrectAnswer),
          xpAwarded: 0,
        },
      }))
      sessionStatsRef.current = {
        ...sessionStatsRef.current,
        answered: sessionStatsRef.current.answered + 1,
      }
      setDailySummary({ score: 0, accuracy: 0, xpEarned: 0, combo, powersUsed: questionPowersUsed, streak })
      if (penalties > 0) showFeedbackBurst(`-${penalties} XP lost`, 'negative')
      rememberCompletedChallengeId(challengeId)
      openAnswerPopup()
    }

    setCompleting((prev) => ({ ...prev, [challengeId]: false }))
    answerCommitRef.current = false
  }

  const usePower = (powerId) => {
    const power = getPowerById(powerId)
    if (!power || !activeChallenge || results[activeChallenge.id] || questionPowersUsed.includes(powerId)) return
    if (power.focusCost && !consumeFocus(power.focusCost)) return
    if (powerId === 'remove_one_option') {
      const visibleIndexes = activeChallenge.options
        .map((_, index) => index)
        .filter((index) => !hiddenOptionIndexes.includes(index))
      if (visibleIndexes.length > 1) {
        setHiddenOptionIndexes((current) => [...current, visibleIndexes[0]])
      }
    }
    setQuestionPowersUsed((current) => [...current, powerId])
    if (power.xpPenalty) {
      showFeedbackBurst(`-${power.xpPenalty} XP`, 'negative')
    } else if (power.focusCost) {
      showFeedbackBurst(`-${power.focusCost} focus`, 'neutral')
    }
  }

  const revealHint = async () => {
    if (!activeChallenge || activeResult || revealedHint) return
    if (isLoggedIn) {
      try {
        const response = await revealDailyChallengeHint(activeChallenge.id)
        setHintAllowance({
          remaining: response.data.remaining,
          limit: response.data.limit,
          reset_at: response.data.reset_at,
          local_only: false,
        })
        setRevealedHint(response.data.explanation)
      } catch (err) {
        if (err.response?.status === 429) {
          setHintAllowance((current) => ({ ...(current || {}), remaining: 0 }))
          showFeedbackBurst('No daily hints left', 'neutral')
          return
        }
        setError('Failed to reveal hint. Try again.')
      }
      return
    }

    const storageKey = 'strubloid:guest-daily-hints'
    const saved = JSON.parse(localStorage.getItem(storageKey) || '{}')
    const rankId = rankMeta.id || 'unranked'
    const limit = GUEST_HINT_LIMITS[rankId] || GUEST_HINT_LIMITS.unranked
    const usage = saved.date === utcDateKey() ? saved : { date: utcDateKey(), used: 0, revealed: [] }
    if (!usage.revealed.includes(activeChallenge.id) && usage.used >= limit) {
      setHintAllowance({ remaining: 0, limit, local_only: true })
      showFeedbackBurst('No daily hints left', 'neutral')
      return
    }
    if (!usage.revealed.includes(activeChallenge.id)) {
      usage.used += 1
      usage.revealed.push(activeChallenge.id)
      localStorage.setItem(storageKey, JSON.stringify(usage))
    }
    setHintAllowance({ remaining: limit - usage.used, limit, local_only: true })
    setRevealedHint(activeChallenge.explanation)
  }

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!activeChallenge || activeResult || answerPopup || shouldIgnoreGameShortcut(event)) return
      const action = actionForKeyboardEvent(event)
      if (!action) return
      const visible = activeChallenge.options
        .map((_, index) => index)
        .filter((index) => !hiddenOptionIndexes.includes(index))
      if (!visible.length) return

      if (action === 'move-left' || action === 'move-right') {
        event.preventDefault()
        const currentPosition = Math.max(0, visible.indexOf(selectedOptionIndex))
        const direction = action === 'move-left' ? -1 : 1
        setSelectedOptionIndex(visible[(currentPosition + direction + visible.length) % visible.length])
        return
      }
      if (action.startsWith('lane-')) {
        const optionIndex = visible[Number(action.slice(5)) - 1]
        if (optionIndex !== undefined) {
          event.preventDefault()
          setSelectedOptionIndex(optionIndex)
          handleAnswer(activeChallenge.id, optionIndex)
        }
        return
      }
      if (['jump', 'confirm'].includes(action)) {
        event.preventDefault()
        handleAnswer(activeChallenge.id, selectedOptionIndex)
      } else if (action === 'hint') {
        event.preventDefault()
        revealHint()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    activeChallenge,
    activeResult,
    answerPopup,
    hiddenOptionIndexes,
    selectedOptionIndex,
    revealedHint,
    hintAllowance,
  ])

  const handleReload = async () => {
    setSeeding(true)
    setError('')
    try {
      await fetchData()
    } catch (err) {
      setError('Failed to check for a challenge. Try again.')
    } finally {
      setSeeding(false)
    }
  }

  const categoryEmoji = (cat) => {
    switch (cat) {
      case 'scales':
        return '🎼'
      case 'chords':
        return '🎸'
      case 'intervals':
        return '📏'
      case 'theory':
        return '📖'
      case 'ear_training':
        return '👂'
      default:
        return '🎵'
    }
  }

  const diffStars = (d) => '★'.repeat(d) + '☆'.repeat(5 - d)

  const getNextRecommendation = () => {
    if (!activeChallenge) return 'Next: keep the run warm.'
    if (activeChallenge.category === 'intervals') return 'Next: try another interval without powers.'
    if (activeChallenge.category === 'chords') return 'Next: stack one more chord color.'
    if (activeChallenge.category === 'scales') return 'Next: complete another scale route.'
    return 'Next: keep the combo moving.'
  }

  const answeredCount = sessionStatsRef.current.answered
  const dailyRun = {
    challengeCount: DAILY_RUN_LENGTH,
    correctCount: sessionStatsRef.current.correct,
    score: sessionStatsRef.current.totalXp,
    maxCombo,
  }

  if (loading) {
    return (
      <div className="daily-page">
        <div className="daily-loading">
          <Loader size={32} className="spin" />
          <p>Loading challenges…</p>
        </div>
      </div>
    )
  }

  if (dailyRunComplete) {
    const accuracy = Math.round((dailyRun.correctCount / DAILY_RUN_LENGTH) * 100)
    return (
      <RewardOverlay
        accuracy={accuracy}
        game={dailyRun}
        rankMeta={{
          ...rankMeta,
          progressLabel: `Daily run complete · ${dailyRun.correctCount}/${DAILY_RUN_LENGTH} correct`,
        }}
        onContinue={fetchData}
        runLabel="daily"
      />
    )
  }

  return (
    <div className="daily-page daily-page--arcade">
      {answerPopup && (
        <div
          className={`challenge-answer-popup ${answerPopup.correct ? 'challenge-answer-popup--correct' : 'challenge-answer-popup--incorrect'}`}
          role="dialog"
          aria-modal="true"
          aria-label={answerPopup.correct ? 'Correct answer' : 'Incorrect answer'}
          onClick={dismissAnswerPopup}
        >
          <div className="challenge-answer-popup__panel">
            {answerPopup.correct ? <CheckCircle size={42} /> : <XCircle size={42} />}
            <p className="challenge-answer-popup__eyebrow">{answerPopup.correct ? 'Clean hit' : 'Not this time'}</p>
            <h2>{answerPopup.correct ? 'You got it!' : `The answer was ${answerPopup.correctAnswer}`}</h2>
            {answerPopup.correct && (
              <strong className="challenge-answer-popup__reward">
                {answerPopup.signedInReward ? `+${answerPopup.xpAwarded} XP` : 'Nice work!'}
              </strong>
            )}
            {answerPopup.explanation && (
              <p className="challenge-answer-popup__explanation">{answerPopup.explanation}</p>
            )}
            <span className="challenge-answer-popup__continue">Click anywhere to continue</span>
          </div>
        </div>
      )}
      <div className="daily-header">
        <Zap className="daily-icon" size={28} />
        <div>
          <h1>Challenges</h1>
          <p className="daily-subtitle">
            {isLoggedIn ? `Keep practicing, ${user?.username}` : 'Practice now. Sign up to save XP!'}
          </p>
        </div>
        {isLoggedIn && <StreakBadge streak={streak} />}
      </div>

      {error && <div className="daily-error">{error}</div>}

      <div className="daily-run-header">
        <div className="daily-run-stat">
          <Trophy size={16} />
          <span>{rankMeta.name}</span>
          <strong>Account level {rankMeta.accountLevel}</strong>
        </div>
        <div className="daily-run-stat combo">
          <Flame size={16} />
          <span>Combo</span>
          <strong>{combo}x</strong>
        </div>
        <div className="daily-run-stat">
          <Target size={16} />
          <span>Focus</span>
          <strong>{progressState.focusPoints}</strong>
        </div>
        <div className="daily-score-rail" aria-label="Current reward score rail">
          <div className="daily-score-rail-top">
            <span>Current reward</span>
            <strong>{xpPreview.previewXp} XP</strong>
          </div>
          <div className="daily-score-track">
            <span
              style={{
                width: `${Math.max(6, Math.min(100, (xpPreview.previewXp / Math.max(1, xpPreview.baseXp)) * 100))}%`,
              }}
            />
          </div>
          <small>
            {xpPreview.penalties > 0 ? `${xpPreview.penalties} XP spent on powers` : 'Full reward available'}
          </small>
        </div>
      </div>
      <div
        className="daily-stage-map"
        aria-label={`Daily run progress: ${Math.min(DAILY_RUN_LENGTH, answeredCount)} of ${DAILY_RUN_LENGTH} gates complete`}
      >
        <div>
          <span>DAILY GATE RUN</span>
          <strong>
            {answeredCount + 1 < DAILY_RUN_LENGTH
              ? `Gate ${answeredCount + 1} ahead`
              : answeredCount < DAILY_RUN_LENGTH
                ? 'Reward vault ahead'
                : 'Reward vault unlocked'}
          </strong>
        </div>
        <ol>
          {Array.from({ length: DAILY_RUN_LENGTH }, (_, index) => (
            <li
              key={index}
              className={
                index < answeredCount
                  ? 'daily-stage-map__cleared'
                  : index === answeredCount
                    ? 'daily-stage-map__active'
                    : ''
              }
            >
              <b>{index + 1}</b>
              <small>{index === DAILY_RUN_LENGTH - 1 ? 'VAULT' : 'GATE'}</small>
            </li>
          ))}
        </ol>
      </div>

      {!activeChallenge ? (
        <div className="daily-empty">
          <CheckCircle size={48} className="empty-icon" />
          <h2>All challenges completed!</h2>
          <p>No challenge is ready yet. Check again without rebuilding the shared challenge bank.</p>
          <button className="reload-btn" onClick={handleReload} disabled={seeding}>
            <RefreshCw size={16} className={seeding ? 'spin' : ''} />
            {seeding ? 'Checking…' : 'Try again'}
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

              <DailyVisualStage
                visual={activeChallenge.visual}
                exercise={activeChallenge.exercise}
                category={activeChallenge.category}
                question={activeChallenge.question}
                title={activeChallenge.title}
              />

              <div className="daily-xp-preview">
                <span className="daily-xp-base">Base +{xpPreview.baseXp} XP</span>
                {xpPreview.penalties > 0 && <span className="daily-xp-penalty">-{xpPreview.penalties} XP</span>}
                <strong className="daily-xp-total">Current reward {xpPreview.previewXp} XP</strong>
              </div>
              {feedbackBurst && (
                <div className={`daily-feedback-burst ${feedbackBurst.tone}`}>{feedbackBurst.label}</div>
              )}

              <h3 className="challenge-title">{activeChallenge.title}</h3>
              <p className="challenge-question">{displayQuestion}</p>
              <div className="daily-hint-row">
                <button
                  type="button"
                  className="daily-hint-button"
                  onClick={revealHint}
                  disabled={!!activeResult || !!revealedHint || hintAllowance?.remaining === 0}
                >
                  <Lightbulb size={16} />
                  {revealedHint
                    ? 'Hint shown'
                    : hintAllowance?.remaining === 0
                      ? 'Hints reset at 00:00 UTC'
                      : `Hint${hintAllowance?.remaining !== null && hintAllowance?.remaining !== undefined ? ` ${hintAllowance.remaining} left today` : ''}`}
                </button>
              </div>
              {revealedHint && (
                <div className="challenge-explanation">
                  <strong>Hint:</strong> {revealedHint}
                </div>
              )}

              <div className="daily-powers">
                {unlockedPowers
                  .filter((power) => ['remove_one_option', 'second_chance', 'freeze_combo'].includes(power.id))
                  .map((power) => (
                    <button
                      key={power.id}
                      type="button"
                      className={`daily-power ${questionPowersUsed.includes(power.id) ? 'used' : ''}`}
                      onClick={() => usePower(power.id)}
                      disabled={questionPowersUsed.includes(power.id) || !!activeResult}
                    >
                      <span>{power.name}</span>
                      <small>{power.focusCost ? `${power.focusCost} focus` : `-${power.xpPenalty} XP`}</small>
                    </button>
                  ))}
              </div>

              <details className="challenge-controls-hint">
                <summary>Controls</summary>A / D or arrows move · W / Space / Enter commit · 1–6 jump to a gate · H
                shows a hint
              </details>
              <div
                className="challenge-gate-world"
                style={{ '--gate-count': activeChallenge.options.length, '--selected-gate': selectedOptionIndex }}
              >
                <div className="challenge-nomi-track" aria-hidden="true">
                  <NoteAvatar
                    lane={selectedOptionIndex}
                    laneCount={activeChallenge.options.length}
                    state={activeResult ? (activeResult.correct ? 'celebrating' : 'wobble') : 'idle'}
                    legacy
                  />
                </div>
                <div className="challenge-options" role="radiogroup" aria-label="Challenge answer gates">
                  {activeChallenge.options.map((opt, i) => {
                    if (hiddenOptionIndexes.includes(i)) return null
                    let optClass = 'challenge-option'
                    if (activeResult) {
                      if (i === activeResult.correctAnswerIndex) optClass += ' correct'
                      else optClass += ' wrong'
                    }
                    return (
                      <button
                        key={`${activeChallenge.id}-${i}-${opt}`}
                        type="button"
                        aria-label={String(opt)}
                        className={optClass}
                        role="radio"
                        aria-checked={selectedOptionIndex === i}
                        onPointerEnter={() => setSelectedOptionIndex(i)}
                        onFocus={() => setSelectedOptionIndex(i)}
                        onClick={() => handleAnswer(activeChallenge.id, i)}
                      >
                        <span className="challenge-gate-key">{i + 1}</span>
                        <span className="challenge-gate-answer">{opt}</span>
                        {activeResult && i === activeResult.correctAnswerIndex && (
                          <CheckCircle size={16} className="opt-correct-icon" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {activeResult && (
                <div className={`challenge-result ${activeResult.correct ? 'result-correct' : 'result-incorrect'}`}>
                  {activeResult.correct ? (
                    isLoggedIn ? (
                      activeResult.xpAwarded > 0 ? (
                        <>
                          Clean hit. Perfect groove! <strong>+{activeResult.xpAwarded} XP</strong>
                        </>
                      ) : (
                        <>
                          Clean hit. Perfect groove! <strong>Reward already claimed</strong>
                        </>
                      )
                    ) : (
                      <>
                        Clean hit. Nice hit! <strong>Sign in to save XP</strong>
                      </>
                    )
                  ) : (
                    <>
                      Off beat — the answer was{' '}
                      <strong>{activeChallenge.options[activeResult.correctAnswerIndex]}</strong>
                    </>
                  )}
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
                    {dailySummary.score
                      ? `Daily Complete! You earned ${dailySummary.xpEarned} XP`
                      : 'Daily challenge missed this round'}
                    {dailySummary.streak ? ` and kept your ${dailySummary.streak}-day streak.` : '.'}
                  </p>
                  <div className="daily-summary-grid">
                    <div>
                      <span>Accuracy</span>
                      <strong>{Math.round((dailySummary.accuracy || 0) * 100)}%</strong>
                    </div>
                    <div>
                      <span>Combo</span>
                      <strong>{dailySummary.combo}</strong>
                    </div>
                    <div>
                      <span>Powers</span>
                      <strong>{dailySummary.powersUsed.length}</strong>
                    </div>
                  </div>
                  <div className="daily-next-card">
                    <span>Recommended next move</span>
                    <strong>{getNextRecommendation()}</strong>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default DailyChallenge
