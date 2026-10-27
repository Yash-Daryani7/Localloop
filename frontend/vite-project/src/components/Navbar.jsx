import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { logoutUser } from '../store/slices/authSlice'
import NotificationBell from './NotificationBell'
import Avatar from './Avatar'

function Navbar() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector(state => state.auth)
  const [showDropdown, setShowDropdown] = useState(false)
  const [search, setSearch] = useState('')

  const handleLogout = async () => {
    await dispatch(logoutUser())
    navigate('/login')
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) navigate(`/profile/${search.trim()}`)
  }

  return (
    <nav className="navbar">
      <div className="navbar-search">
        <span className="search-icon">🔍</span>
        <form onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search neighbors, events..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </form>
      </div>
      <div className="navbar-actions">
        <NotificationBell />
        <div style={{ position: 'relative' }}>
          <Avatar name={user?.name} src={user?.avatar} onClick={() => setShowDropdown(!showDropdown)} style={{ fontSize: '0.9rem' }} />
          {showDropdown && (
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 10px)',
              background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', width: '180px',
              boxShadow: 'var(--shadow-lg)', zIndex: 200, overflow: 'hidden'
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user?.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user?.neighborhood}</div>
              </div>
              <button className="nav-item" style={{ borderRadius: 0 }} onClick={() => { navigate(`/profile/${user._id}`); setShowDropdown(false) }}>
                <span>👤</span> My Profile
              </button>
              <button className="nav-item" style={{ borderRadius: 0, color: 'var(--accent-danger)' }} onClick={handleLogout}>
                <span>🚪</span> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
