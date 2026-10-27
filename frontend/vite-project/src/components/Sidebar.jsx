import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

function Sidebar() {
  const { user } = useSelector(state => state.auth)
  const { unreadCount } = useSelector(state => state.notifications)

  const navItems = [
    { to: '/home', icon: '🏠', label: 'Home' },
    { to: '/events', icon: '📅', label: 'Events' },
    { to: '/marketplace', icon: '🛍️', label: 'Marketplace' },
    { to: '/services', icon: '🔧', label: 'Services' },
    { to: '/polls', icon: '📊', label: 'Polls' },
    { to: '/chat', icon: '💬', label: 'Chat' },
    { to: '/map', icon: '🗺️', label: 'Map View' },
    { to: '/notifications', icon: '🔔', label: 'Notifications', badge: unreadCount }
  ]

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-text">LocalLoop</div>
        <div className="sidebar-logo-sub">Your Neighborhood, Connected</div>
      </div>
      <nav className="sidebar-nav">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
            {item.badge > 0 && <span className="nav-badge">{item.badge > 99 ? '99+' : item.badge}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-neighborhood">
          📍 <span>{user?.neighborhood || 'Unknown'}</span>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
