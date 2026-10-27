import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchNotifications, markAsRead, markAllAsRead } from '../store/slices/notificationSlice'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { useNavigate } from 'react-router-dom'

const typeIcons = {
  event_rsvp: '📅',
  new_event: '📅',
  new_message: '💬',
  poll_vote: '📊',
  new_poll: '📊',
  listing_interest: '🛍️',
  new_listing: '🛍️',
  service_response: '🔧',
  new_service: '🔧',
  new_follower: '👤'
}

function Notifications() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { notifications, loading, unreadCount } = useSelector(state => state.notifications)

  useEffect(() => {
    dispatch(fetchNotifications())
  }, [])

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins} min ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs} hr ago`
    return `${Math.floor(hrs / 24)} days ago`
  }

  const handleClick = (n) => {
    dispatch(markAsRead(n._id))
    if (n.type === 'new_message') navigate('/chat')
    else if (['event_rsvp', 'new_event'].includes(n.type)) navigate('/events')
    else if (['listing_interest', 'new_listing'].includes(n.type)) navigate('/marketplace')
    else if (['service_response', 'new_service'].includes(n.type)) navigate('/services')
    else if (['poll_vote', 'new_poll'].includes(n.type)) navigate('/polls')
    else if (n.type === 'new_follower') navigate(`/profile/${n.sender?._id || ''}`)
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <div className="page-wrapper">
          <div className="page-header">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h1 className="page-title">🔔 Notifications</h1>
                <p className="page-subtitle">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}</p>
              </div>
              {unreadCount > 0 && (
                <button className="btn btn-secondary btn-sm" onClick={() => dispatch(markAllAsRead())}>
                  ✓ Mark all as read
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="loading-center"><div className="loading-spinner" /></div>
          ) : notifications.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔔</div>
              <div className="empty-title">No notifications</div>
              <div className="empty-subtitle">You'll see activity from your neighborhood here</div>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {notifications.map((n, i) => (
                <div
                  key={n._id}
                  onClick={() => handleClick(n)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 14,
                    padding: '16px 20px',
                    background: !n.read ? 'rgba(124,58,237,0.05)' : 'transparent',
                    borderBottom: i < notifications.length - 1 ? '1px solid var(--border)' : 'none',
                    cursor: 'pointer', transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = !n.read ? 'rgba(124,58,237,0.05)' : 'transparent'}
                >
                  <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>{typeIcons[n.type] || '🔔'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 4 }}>{n.message}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{timeAgo(n.createdAt)}</div>
                  </div>
                  {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-primary)', flexShrink: 0, marginTop: 6 }} />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Notifications
