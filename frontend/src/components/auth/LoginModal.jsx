import React, { useState } from 'react';
import { X, Mail, Lock, User, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './LoginModal.css';

const LoginModal = () => {
  const { user, showLoginModal, loading: authLoading, login, register, requestPasswordReset, continueAsGuest, closeLoginModal, loginReason, isLoggedIn } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetConfirm, setResetConfirm] = useState('');

  if (authLoading) return null;
  if (!showLoginModal) return null;
  if (user) return null;

  const resetForm = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setError('');
    setResetSent(false);
    setResetConfirm('');
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email, password);
        resetForm();
      } else if (mode === 'register') {
        await register(username, email, password);
        resetForm();
      } else if (mode === 'forgot') {
        const res = await requestPasswordReset(email);
        setResetSent(true);
        setResetConfirm(res?.data?.message || 'If that email is registered, you will receive a password reset link.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getReasonText = () => {
    if (loginReason === 'save') return 'Sign up to save your songs permanently.';
    if (loginReason === 'load') return 'Sign in to load your saved songs.';
    return null;
  };

  return (
    <div className="modal-overlay" onClick={closeLoginModal}>
      <div className="login-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={closeLoginModal}>
          <X size={20} />
        </button>

        <div className="modal-header">
          <h2>
            {mode === 'login' ? 'Welcome back' :
             mode === 'register' ? 'Create account' :
             resetSent ? 'Check your inbox' : 'Reset password'}
          </h2>
          {!resetSent && getReasonText() && (
            <p className="login-reason">{getReasonText()}</p>
          )}
        </div>

        {mode === 'forgot' && resetSent ? (
          <div className="reset-sent">
            <CheckCircle size={48} className="reset-sent-icon" />
            <p className="reset-sent-message">{resetConfirm}</p>
            <button className="submit-btn" onClick={() => { switchMode('login'); resetForm(); }}>
              Back to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="login-form">
            {mode === 'register' && (
              <div className="form-group">
                <User size={16} className="form-icon" />
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  minLength={2}
                />
              </div>
            )}

            <div className="form-group">
              <Mail size={16} className="form-icon" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {mode !== 'forgot' && (
              <div className="form-group">
                <Lock size={16} className="form-icon" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            )}

            {error && <div className="form-error">{error}</div>}

            <button type="submit" className="submit-btn" disabled={submitting}>
              {submitting ? (
                'Please wait...'
              ) : mode === 'login' ? (
                <>Sign in <ArrowRight size={16} /></>
              ) : mode === 'register' ? (
                <>Create account <ArrowRight size={16} /></>
              ) : (
                <>Send reset link <ArrowRight size={16} /></>
              )}
            </button>

            {mode === 'login' && (
              <button
                type="button"
                className="forgot-link"
                onClick={() => switchMode('forgot')}
              >
                Forgot password?
              </button>
            )}
          </form>
        )}

        {!resetSent && (
          <div className="modal-footer">
            {mode === 'login' ? (
              <p>
                Don't have an account?{' '}
                <button onClick={() => switchMode('register')}>
                  Sign up
                </button>
              </p>
            ) : mode === 'register' ? (
              <p>
                Already have an account?{' '}
                <button onClick={() => switchMode('login')}>
                  Sign in
                </button>
              </p>
            ) : (
              <p>
                Remember your password?{' '}
                <button onClick={() => switchMode('login')}>
                  Sign in
                </button>
              </p>
            )}

            {mode === 'login' && (
              <>
                <div className="divider">
                  <span>or</span>
                </div>
                <button className="guest-btn" onClick={continueAsGuest}>
                  Continue as Guest
                </button>
                <p className="guest-hint">Guest mode saves your data locally on this device.</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginModal;
