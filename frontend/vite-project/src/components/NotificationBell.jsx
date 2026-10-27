import React, { useState, useRef, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { fetchNotifications, markAllAsRead, markAsRead, getUnreadCount } from '../store/slices/notificationSlice'

function NotificationBell() {
  const [open, setOpen] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { notifications, unreadCount } = useSelector(state => state.notifications)
  const dropdownRef = useRef(null)

  useEffect(() => {
    dispatch(getUnreadCount())
  }, [])

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleOpen = () => {
    if (!open) dispatch(fetchNotifications())
    setOpen(!open)
  }

  const handleMarkAll = () => dispatch(markAllAsRead())

  const handleNotifClick = (notif) => {
    dispatch(markAsRead(notif._id))
    setOpen(false)
    if (notif.type === 'new_message') navigate('/chat')
    else if (['event_rsvp', 'new_event'].includes(notif.type)) navigate('/events')
    else if (['listing_interest', 'new_listing'].includes(notif.type)) navigate('/marketplace')
    else if (['service_response', 'new_service'].includes(notif.type)) navigate('/services')
    else if (['poll_vote', 'new_poll'].includes(notif.type)) navigate('/polls')
    else navigate('/notifications')
  }

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div className="notification-bell" ref={dropdownRef}>
      <button className="btn btn-ghost btn-icon" onClick={handleOpen} title="Notifications">
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>
      {open && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={handleMarkAll}>Mark all read</button>
            )}
          </div>
          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px' }}>
                <div className="empty-icon">🔔</div>
                <div className="empty-title">No notifications yet</div>
              </div>
            ) : (
              notifications.slice(0, 8).map(n => (
                <div key={n._id} className={`notification-item ${!n.read ? 'unread' : ''}`} onClick={() => handleNotifClick(n)}>
                  {!n.read && <div className="notification-dot" />}
                  <div style={{ flex: 1 }}>
                    <div className="notification-text">{n.message}</div>
                    <div className="notification-time">{timeAgo(n.createdAt)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)' }}>
            <button className="btn btn-ghost btn-sm" style={{ width: '100%' }} onClick={() => { navigate('/notifications'); setOpen(false) }}>
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
