import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { loginUser, clearError } from '../store/slices/authSlice'

const Login = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user, loading, error } = useSelector((state) => state.auth)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })

  useEffect(() => {
    dispatch(clearError())
    if (user) {
      navigate('/home')
    }
  }, [user, navigate, dispatch])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.email || !formData.password) return

    const res = await dispatch(loginUser({
      email: formData.email.trim(),
      password: formData.password
    }))

    if (loginUser.fulfilled.match(res)) {
      navigate('/home')
    }
  }

  return (
    <div className="login-page" style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--bg-primary)'
    }}>
      {/* Hero Side */}
      <div style={{
        flex: 1,
        background: 'var(--gradient-hero)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px',
        position: 'relative',
        overflow: 'hidden',
        borderRight: '1px solid var(--border)'
      }} className="login-hero">
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-10%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(124, 58, 237, 0.25) 0%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none'
        }} />

        <div style={{
          position: 'absolute',
          bottom: '-10%',
          left: '-10%',
          width: '450px',
          height: '450px',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.2) 0%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: '480px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '8px 16px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            marginBottom: '24px'
          }}>
            <span style={{ fontSize: '1.2rem' }}>🌐</span>
            <span style={{ fontSize: '0.88rem', fontWeight: '600', color: '#c4b5fd' }}>
              Next-Gen Hyperlocal Community
            </span>
          </div>

          <h1 style={{ fontSize: '3.2rem', lineHeight: 1.15, marginBottom: '20px' }}>
            Your Neighborhood, <br />
            <span className="gradient-text">Connected in Real-Time.</span>
          </h1>

          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '36px' }}>
            Join LocalLoop to discover nearby events, buy & sell with trusted neighbors, exchange local skills, vote in community polls, and stay in the loop.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>⚡</div>
              <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>Instant Updates</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Real-time chat & notifications</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>📍</div>
              <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>Map Exploration</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pins for listings & events nearby</div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Side */}
      <div className="login-form-side" style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        background: 'var(--bg-secondary)'
      }}>
        <div className="login-form-card">
          <div className="login-heading">
            <span className="login-eyebrow">YOUR NEIGHBORHOOD, IN THE LOOP</span>
            <h2>Welcome back</h2>
            <p>
              Sign in with your email to access your neighborhood hub.
            </p>
          </div>

          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="input-group login-input-group">
              <label className="label" htmlFor="login-email">Email address</label>
              <input
                type="email"
                name="email"
                id="login-email"
                required
                className="input"
                placeholder="neighbor@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="input-group login-input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="label" htmlFor="login-password">Password</label>
              </div>
              <input
                type="password"
                name="password"
                id="login-password"
                required
                className="input"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div className="login-options">
              <label className="login-remember">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  style={{ accentColor: 'var(--accent-primary)' }}
                />
                Remember me
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary login-submit"
            >
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="loading-spinner loading-spinner-sm" />
                  <span>Signing In...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="login-signup">
            New to the neighborhood?{' '}
            <Link to="/register" style={{ color: 'var(--accent-secondary)', fontWeight: '600' }}>
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
