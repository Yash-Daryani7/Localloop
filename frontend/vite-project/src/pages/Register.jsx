import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { registerUser, clearError } from '../store/slices/authSlice'
import NeighborhoodMapPicker from '../components/NeighborhoodMapPicker'

const Register = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user, loading, error } = useSelector((state) => state.auth)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    bio: ''
  })
  const [mapLocation, setMapLocation] = useState(null) // { neighborhood, lat, lng }
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [localError, setLocalError] = useState(null)

  useEffect(() => {
    dispatch(clearError())
    if (user) {
      navigate('/home')
    }
  }, [user, navigate, dispatch])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalError(null)

    if (formData.password !== formData.confirmPassword) {
      setLocalError('Passwords do not match.')
      return
    }

    if (formData.password.length < 6) {
      setLocalError('Password must be at least 6 characters.')
      return
    }

    if (!mapLocation?.neighborhood) {
      setLocalError('Please select your neighborhood on the map.')
      return
    }

    const data = new FormData()
    data.append('name', formData.name.trim())
    data.append('email', formData.email.trim())
    data.append('password', formData.password)
    data.append('neighborhood', mapLocation.neighborhood)
    data.append('lat', mapLocation.lat)
    data.append('lng', mapLocation.lng)
    if (formData.bio) {
      data.append('bio', formData.bio.trim())
    }
    if (avatarFile) {
      data.append('avatar', avatarFile)
    }

    const res = await dispatch(registerUser(data))
    if (registerUser.fulfilled.match(res)) {
      navigate('/home')
    }
  }

  const displayError = localError || error

  return (
    <div style={{
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
      }} className="register-hero">
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
            <span style={{ fontSize: '1.2rem' }}>🤝</span>
            <span style={{ fontSize: '0.88rem', fontWeight: '600', color: '#67e8f9' }}>
              Welcome to LocalLoop
            </span>
          </div>

          <h1 style={{ fontSize: '3rem', lineHeight: 1.15, marginBottom: '20px' }}>
            Find out what's <br />
            <span className="gradient-text">Happening next door.</span>
          </h1>

          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Connect directly with verified neighbors. Borrow tools, buy second-hand treasures, coordinate block parties, and build a safer, closer neighborhood.
          </p>
        </div>
      </div>

      {/* Form Side */}
      <div style={{
        flex: 1.1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        background: 'var(--bg-secondary)',
        overflowY: 'auto'
      }}>
        <div style={{ width: '100%', maxWidth: '480px' }}>
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>Join Your Neighborhood</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
              Create your account in seconds and link your local area.
            </p>
          </div>

          {displayError && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid var(--accent-danger)',
              color: '#fca5a5',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
              fontSize: '0.9rem'
            }}>
              {displayError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Avatar Preview & Upload */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <div className="avatar avatar-lg" style={{ position: 'relative' }}>
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar preview" />
                ) : (
                  <span>{formData.name ? formData.name.charAt(0).toUpperCase() : '👤'}</span>
                )}
              </div>
              <div>
                <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                  <span>Choose Profile Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleAvatarChange}
                  />
                </label>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  JPG, PNG or WEBP (Optional)
                </div>
              </div>
            </div>

            <div className="input-group">
              <label className="label">Full Name *</label>
              <input
                type="text"
                name="name"
                required
                className="input"
                placeholder="Jane Doe"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div className="input-group">
              <label className="label">Email Address *</label>
              <input
                type="email"
                name="email"
                required
                className="input"
                placeholder="jane@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="input-group">
              <label className="label">Neighborhood or Community *</label>
              <NeighborhoodMapPicker
                value={mapLocation}
                onChange={setMapLocation}
                height="300px"
              />
            </div>

            <div className="grid-2">
              <div className="input-group">
                <label className="label">Password *</label>
                <input
                  type="password"
                  name="password"
                  required
                  className="input"
                  placeholder="Min 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              <div className="input-group">
                <label className="label">Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  className="input"
                  placeholder="Repeat password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="input-group">
              <label className="label">Short Bio (optional)</label>
              <input
                type="text"
                name="bio"
                className="input"
                placeholder="e.g. Gardener, dog lover & home baker"
                value={formData.bio}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '13px', marginTop: '10px' }}
            >
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="loading-spinner loading-spinner-sm" />
                  <span>Creating Account...</span>
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div style={{
            marginTop: '24px',
            textAlign: 'center',
            fontSize: '0.9rem',
            color: 'var(--text-secondary)'
          }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent-secondary)', fontWeight: '600' }}>
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
