import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Lock, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react'
import api from '../../services/api'
import './ResetPasswordPage.css'

const ResetPasswordPage = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [invalid, setInvalid] = useState(false)

  useEffect(() => {
    if (!token) {
      setInvalid(true)
      setError('No reset token provided. The link may be broken.')
    }
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!password || !confirm) {
      setError('Please fill in both fields.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      const res = await api.post('/api/auth/reset-password', { token, password })
      setSuccess(true)
    } catch (err) {
      const msg = err.response?.data?.error || 'Something went wrong.'
      setError(msg)
      if (msg.includes('expired') || msg.includes('Invalid')) {
        setInvalid(true)
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="reset-page">
        <div className="reset-card">
          <CheckCircle size={56} className="reset-success-icon" />
          <h2>All set!</h2>
          <p>Your password has been reset successfully.</p>
          <button className="reset-btn" onClick={() => navigate('/')}>
            Go to sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="reset-page">
      <div className="reset-card">
        <h2>Reset your password</h2>

        {invalid ? (
          <div className="reset-invalid">
            <AlertCircle size={48} className="reset-error-icon" />
            <p>{error}</p>
            <button className="reset-btn" onClick={() => navigate('/')}>
              Back to home
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="reset-form">
            <div className="reset-form-group">
              <Lock size={16} className="reset-form-icon" />
              <input
                type="password"
                placeholder="New password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoFocus
              />
            </div>

            <div className="reset-form-group">
              <Lock size={16} className="reset-form-icon" />
              <input
                type="password"
                placeholder="Confirm new password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {error && <div className="reset-error">{error}</div>}

            <button
              type="submit"
              className="reset-btn"
              disabled={submitting}
            >
              {submitting ? (
                'Please wait...'
              ) : (
                <>Reset password <ArrowRight size={16} /></>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default ResetPasswordPage
