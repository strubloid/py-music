import axios from 'axios';

const api = axios.create({
  baseURL: '/',
  withCredentials: true, // Send cookies for session auth
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Auth ──────────────────────────────────────────────────────────────────────

export const login = (email, password) =>
  api.post('/api/auth/login', { email, password });

export const register = (username, email, password) =>
  api.post('/api/auth/register', { username, email, password });

export const logout = () =>
  api.post('/api/auth/logout');

export const getMe = () =>
  api.get('/api/auth/me');

// ─── Progressions ───────────────────────────────────────────────────────────────

export const getProgressions = () =>
  api.get('/api/progressions');

export const createProgression = (data) =>
  api.post('/api/progressions', data);

export const updateProgression = (id, data) =>
  api.put(`/api/progressions/${id}`, data);

export const deleteProgression = (id) =>
  api.delete(`/api/progressions/${id}`);

// ─── Favorites ─────────────────────────────────────────────────────────────────

export const getFavorites = () =>
  api.get('/api/favorites');

export const createFavorite = (data) =>
  api.post('/api/favorites', data);

export const deleteFavorite = (id) =>
  api.delete(`/api/favorites/${id}`);

// ─── XP ────────────────────────────────────────────────────────────────────────

export const awardXp = (amount) =>
  api.post('/api/me/xp', { amount });

// ─── Error Logging ─────────────────────────────────────────────────────────────

export const logError = (category, message, details) =>
  api.post('/api/log-error', { category, message, details });

// Global handler: attach to window.onerror and unhandled rejections
if (typeof window !== 'undefined') {
  const send = (msg, source, lineno, colno, err) => {
    logError(
      err ? 'FRONTEND' : 'JS_ERROR',
      err?.message || msg,
      [
        `Source: ${source}`,
        `Line: ${lineno}  Col: ${colno}`,
        err ? `Stack: ${err.stack}` : '',
      ].filter(Boolean).join('\n')
    ).catch(() => {}); // fire-and-forget
  };
  window.addEventListener('error', e => send(e.message, e.filename, e.lineno, e.colno, e.error));
  window.addEventListener('unhandledrejection', e => {
    send(`Unhandled Promise Rejection: ${e.reason}`, '', 0, 0, e.reason);
  });
}

export default api;
