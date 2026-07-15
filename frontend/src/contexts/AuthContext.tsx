import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

const GUEST_USER = {
  id: null,
  username: 'Guest',
  email: null,
  xp: 0,
  level: 1,
  instrument_preference: null,
  skill_level: null,
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginReason, setLoginReason] = useState(null); // 'save' | 'load' | null

  // Sync with backend on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await api.get('/api/auth/me');
        if (res.data.user) {
          setUser(res.data.user);
        } else {
          // Try to restore guest data
          const savedGuest = localStorage.getItem('guestUser');
          if (savedGuest) {
            setUser(JSON.parse(savedGuest));
          }
        }
      } catch {
        const savedGuest = localStorage.getItem('guestUser');
        if (savedGuest) setUser(JSON.parse(savedGuest));
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = useCallback(async (loginId, password) => {
    const res = await api.post('/api/auth/login', { login: loginId, password });
    setUser(res.data.user);
    setShowLoginModal(false);
    localStorage.removeItem('guestUser');
    return res.data.user;
  }, []);

  const register = useCallback(async (username, email, password) => {
    const res = await api.post('/api/auth/register', { username, email, password });
    setUser(res.data.user);
    setShowLoginModal(false);
    localStorage.removeItem('guestUser');
    return res.data.user;
  }, []);

  const logout = useCallback(async () => {
    const wasLoggedIn = Boolean(user?.id);

    if (wasLoggedIn) {
      try {
        await api.post('/api/auth/logout');
      } catch {
        // Still clear local auth state if the remote session is already gone.
      }
    }

    setUser(null);
    localStorage.removeItem('guestUser');
  }, [user?.id]);

  const continueAsGuest = useCallback(() => {
    setUser(GUEST_USER);
    localStorage.setItem('guestUser', JSON.stringify(GUEST_USER));
    setShowLoginModal(false);
  }, []);

  const isLoggedIn = Boolean(user?.id);
  const isGuest = !user?.id;

  const promptLogin = useCallback((reason = null) => {
    setLoginReason(reason);
    setShowLoginModal(true);
  }, []);

  const requestPasswordReset = useCallback(async (email) => {
    return await api.post('/api/auth/forgot-password', { email });
  }, []);

  const updateUserProgress = useCallback((progress) => {
    setUser((current) => {
      if (!current) return current;

      const nextUser = {
        ...current,
        ...(progress.xp !== undefined ? { xp: progress.xp } : {}),
        ...(progress.level !== undefined ? { level: progress.level } : {}),
        ...(progress.rank !== undefined ? { rank: progress.rank } : {}),
      };

      if (!nextUser.id) {
        localStorage.setItem('guestUser', JSON.stringify(nextUser));
      }

      return nextUser;
    });
  }, []);

  const refreshUser = useCallback(async () => {
    const res = await api.get('/api/auth/me');
    if (res.data.user) {
      setUser(res.data.user);
    }
    return res.data.user;
  }, []);

  const updatePreferences = useCallback(async (prefs) => {
    const res = await api.patch('/api/me/preferences', prefs);
    if (res.data.user) {
      setUser(res.data.user);
    }
    return res.data.user;
  }, []);

  const closeLoginModal = useCallback(() => {
    // If user isn't logged in, become a guest so the app has a usable state
    if (!isLoggedIn && !user) {
      setUser(GUEST_USER);
      localStorage.setItem('guestUser', JSON.stringify(GUEST_USER));
    }
    setShowLoginModal(false);
    setLoginReason(null);
  }, [isLoggedIn, user]);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isLoggedIn,
      isGuest,
      login,
      register,
      logout,
      continueAsGuest,
      updateUserProgress,
      refreshUser,
      updatePreferences,
      showLoginModal,
      loginReason,
      promptLogin,
      requestPasswordReset,
      closeLoginModal,
      setShowLoginModal,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
