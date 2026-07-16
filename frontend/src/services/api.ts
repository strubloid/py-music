import axios from 'axios'

const api = axios.create({
  baseURL: '/',
  withCredentials: true, // Send cookies for session auth
  headers: {
    'Content-Type': 'application/json',
  },
})

// ─── CSRF Token Interceptor ─────────────────────────────────────────────────────
// Read csrf_token cookie set by the server and attach it as X-CSRFToken header
// on every state-changing request (POST, PUT, DELETE, PATCH).
// This implements the double-submit cookie pattern for CSRF protection.

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

api.interceptors.request.use((config) => {
  if (['post', 'put', 'delete', 'patch'].includes(config.method?.toLowerCase())) {
    const csrfToken = getCookie('csrf_token')
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken
    }
  }
  return config
})

// ─── Auth ──────────────────────────────────────────────────────────────────────

export const login = (loginId, password) => api.post('/api/auth/login', { login: loginId, password })

export const register = (username, email, password) => api.post('/api/auth/register', { username, email, password })

export const logout = () => api.post('/api/auth/logout')

export const getMe = () => api.get('/api/auth/me')

export const updatePreferences = (prefs) => api.patch('/api/me/preferences', prefs)

// ─── Progressions ───────────────────────────────────────────────────────────────

export const getProgressions = () => api.get('/api/progressions')

export const createProgression = (data) => api.post('/api/progressions', data)

export const updateProgression = (id, data) => api.put(`/api/progressions/${id}`, data)

export const deleteProgression = (id) => api.delete(`/api/progressions/${id}`)

// ─── Favorites ─────────────────────────────────────────────────────────────────

export const getFavorites = () => api.get('/api/favorites')

export const createFavorite = (data) => api.post('/api/favorites', data)

export const deleteFavorite = (id) => api.delete(`/api/favorites/${id}`)

// ─── XP ────────────────────────────────────────────────────────────────────────

export const awardXp = () => api.post('/api/me/xp', {})

export const claimQuestReward = (questId) => api.post('/api/me/quest-claim', { quest_id: questId })

// ─── Living Music City ────────────────────────────────────────────────────────

export const startActivity = (activity, sessionKey) =>
  api.post('/api/game/activity-start', { activity, session_key: sessionKey })

export const completeActivity = (sessionKey) => api.post('/api/game/activity-complete', { session_key: sessionKey })

export const mutateFocus = ({ transactionKey, operation, reason, amount, sessionKey }) =>
  api.post('/api/game/focus', {
    transaction_key: transactionKey,
    operation,
    reason,
    amount,
    session_key: sessionKey,
  })

export const useSoundGatesPower = ({ transactionKey, sessionKey, challengeId, powerId }) =>
  api.post('/api/game/sound-gates-power', {
    transaction_key: transactionKey,
    session_key: sessionKey,
    challenge_id: challengeId,
    power_id: powerId,
  })

export const getLeaderboard = (limit = 25) => api.get(`/api/leaderboard?limit=${limit}`)

export const recordAnalyticsEvent = (event, activity, properties = {}) =>
  api.post('/api/analytics/events', { event, activity, properties })

// ─── Daily Challenges ─────────────────────────────────────────────────────────

export const getDailyChallenges = (
  limit = 10,
  offset = 0,
  options: { random?: boolean; excludeIds?: Array<number | string> } = {},
) => {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  })

  if (options.random) params.set('random', '1')
  if (options.excludeIds?.length) params.set('exclude_ids', options.excludeIds.join(','))

  return api.get(`/api/daily-challenges?${params.toString()}`)
}

export const completeDailyChallenge = (challengeId, payload = {}) =>
  api.post(`/api/daily-challenge/${challengeId}/complete`, payload)

export const revealDailyChallengeHint = (challengeId) => api.post(`/api/daily-challenge/${challengeId}/hint`)

export const seedChallenges = () => api.post('/api/daily-challenge/seed')

export const getUserStreak = () => api.get('/api/user/streak')

export const getGameProgress = () => api.get('/api/me/game-progress')
// ─── Error Logging ─────────────────────────────────────────────────────────────

export const logError = (category, message, details) => api.post('/api/log-error', { category, message, details })

// Global handler: attach to window.onerror and unhandled rejections
if (typeof window !== 'undefined') {
  const send = (msg, source, lineno, colno, err) => {
    logError(
      err ? 'FRONTEND' : 'JS_ERROR',
      err?.message || msg,
      [`Source: ${source}`, `Line: ${lineno}  Col: ${colno}`, err ? `Stack: ${err.stack}` : '']
        .filter(Boolean)
        .join('\n'),
    ).catch(() => {}) // fire-and-forget
  }
  window.addEventListener('error', (e) => send(e.message, e.filename, e.lineno, e.colno, e.error))
  window.addEventListener('unhandledrejection', (e) => {
    send(`Unhandled Promise Rejection: ${e.reason}`, '', 0, 0, e.reason)
  })
}

export default api
