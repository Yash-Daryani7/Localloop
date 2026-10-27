import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { registerUser, clearError } from '../store/slices/authSlice'
import Avatar from '../components/Avatar'
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
  const [mapLocation, setMapLocation] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [localError, setLocalError] = useState(null)

  useEffect(() => {
    dispatch(clearError())
    if (user) navigate('/home')
  }, [user, navigate, dispatch])

  useEffect(() => () => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
  }, [avatarPreview])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
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
      setLocalError('Choose your neighborhood on the map to continue.')
      return
    }

    const data = new FormData()
    data.append('name', formData.name.trim())
    data.append('email', formData.email.trim())
    data.append('password', formData.password)
    data.append('neighborhood', mapLocation.neighborhood)
    data.append('lat', mapLocation.lat)
    data.append('lng', mapLocation.lng)
    if (formData.bio.trim()) data.append('bio', formData.bio.trim())
    if (avatarFile) data.append('avatar', avatarFile)

    const res = await dispatch(registerUser(data))
    if (registerUser.fulfilled.match(res)) navigate('/home')
  }

  const displayError = localError || error

  return (
    <div className="register-page">
      <aside className="register-hero">
        <div className="register-hero-orb register-hero-orb-one" />
        <div className="register-hero-orb register-hero-orb-two" />
        <div className="register-hero-content">
          <Link to="/login" className="register-brand" aria-label="LocalLoop home">
            <span className="register-brand-mark">L</span>
            <span>LocalLoop</span>
          </Link>

          <div className="register-hero-copy">
            <span className="register-eyebrow"><span>✦</span> YOUR NEIGHBORHOOD, IN THE LOOP</span>
            <h1>Good things happen <span className="gradient-text">closer to home.</span></h1>
            <p>Meet the people nearby, find what’s happening, and make your neighborhood feel a little smaller.</p>

            <div className="register-feature-list">
              <div className="register-feature">
                <span className="register-feature-icon">💬</span>
                <div><strong>Talk to your neighbors</strong><small>Community chat and direct messages</small></div>
              </div>
              <div className="register-feature">
                <span className="register-feature-icon">📍</span>
                <div><strong>Find your local loop</strong><small>Events, useful finds, and nearby help</small></div>
              </div>
            </div>
          </div>

          <div className="register-hero-footer">
            <span className="register-live-dot" /> A more connected neighborhood starts here
          </div>
        </div>
      </aside>

      <main className="register-form-side">
        <section className="register-card" aria-labelledby="register-title">
          <header className="register-heading">
            <div className="register-step-label"><span>01</span> CREATE YOUR ACCOUNT</div>
            <h2 id="register-title">Join your neighborhood</h2>
            <p>A few details help your neighbors recognize you and find your community.</p>
          </header>

          {displayError && <div className="register-error" role="alert">{displayError}</div>}

          <form onSubmit={handleSubmit} className="register-form">
            <div className="register-profile-row">
              <Avatar
                name={formData.name}
                src={avatarPreview}
                size="lg"
                className="register-avatar"
              />
              <div className="register-profile-copy">
                <strong>Your profile photo</strong>
                <span>{formData.name.trim() ? `Your avatar will show ${formData.name.trim().charAt(0).toUpperCase()} until you add a photo.` : 'Your first initial becomes your avatar if you skip the photo.'}</span>
              </div>
              <label className="register-upload-button">
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarChange} />
                {avatarPreview ? 'Change photo' : 'Add photo'}
              </label>
            </div>

            <div className="register-fields-grid">
              <div className="form-group register-field">
                <label className="form-label" htmlFor="register-name">Full name <span>*</span></label>
                <input
                  id="register-name"
                  type="text"
                  name="name"
                  required
                  autoComplete="name"
                  className="form-input"
                  placeholder="e.g. Yash Sharma"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group register-field">
                <label className="form-label" htmlFor="register-email">Email address <span>*</span></label>
                <input
                  id="register-email"
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <section className="register-location-section" aria-labelledby="register-location-title">
              <div className="register-section-heading">
                <div>
                  <div className="register-section-title" id="register-location-title">Where’s your neighborhood?</div>
                  <p>Pick a spot or use your location to connect with nearby neighbors.</p>
                </div>
                <span className={`register-location-status ${mapLocation ? 'is-selected' : ''}`}>
                  {mapLocation ? '✓ Location set' : 'Required'}
                </span>
              </div>
              <NeighborhoodMapPicker
                value={mapLocation}
                onChange={setMapLocation}
                height="220px"
              />
            </section>

            <div className="register-fields-grid">
              <div className="form-group register-field">
                <label className="form-label" htmlFor="register-password">Password <span>*</span></label>
                <input
                  id="register-password"
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="form-input"
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group register-field">
                <label className="form-label" htmlFor="register-confirm-password">Confirm password <span>*</span></label>
                <input
                  id="register-confirm-password"
                  type="password"
                  name="confirmPassword"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="form-input"
                  placeholder="Enter it once more"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group register-field register-bio-field">
              <label className="form-label" htmlFor="register-bio">A little about you <span>OPTIONAL</span></label>
              <input
                id="register-bio"
                type="text"
                name="bio"
                className="form-input"
                placeholder="Gardener, dog lover, home baker…"
                value={formData.bio}
                onChange={handleChange}
              />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary register-submit">
              {loading ? (
                <><div className="loading-spinner loading-spinner-sm" /><span>Creating your account…</span></>
              ) : (
                <>Create my account <span aria-hidden="true">→</span></>
              )}
            </button>
          </form>

          <div className="register-signin">
            Already part of the neighborhood? <Link to="/login">Sign in</Link>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Register
