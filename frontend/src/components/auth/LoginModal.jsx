import React, { useState } from 'react';
import { X, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './LoginModal.css';

const LoginModal = () => {
  const { login, register, continueAsGuest, closeLoginModal, loginReason, isLoggedIn } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isLoggedIn) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(username, email, password);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
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
          <h2>{mode === 'login' ? 'Welcome back' : 'Create account'}</h2>
          {getReasonText() && (
            <p className="login-reason">{getReasonText()}</p>
          )}
        </div>

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

          {error && <div className="form-error">{error}</div>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? (
              'Please wait...'
            ) : mode === 'login' ? (
              <>Sign in <ArrowRight size={16} /></>
            ) : (
              <>Create account <ArrowRight size={16} /></>
            )}
          </button>
        </form>

        <div className="modal-footer">
          {mode === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button onClick={() => { setMode('register'); setError(''); }}>
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button onClick={() => { setMode('login'); setError(''); }}>
                Sign in
              </button>
            </p>
          )}

          <div className="divider">
            <span>or</span>
          </div>

          <button className="guest-btn" onClick={continueAsGuest}>
            Continue as Guest
          </button>
          <p className="guest-hint">Guest mode saves your data locally on this device.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
