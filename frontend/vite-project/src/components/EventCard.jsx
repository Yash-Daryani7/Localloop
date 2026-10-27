import React from 'react'
import { useNavigate } from 'react-router-dom'

function EventCard({ event }) {
  const navigate = useNavigate()

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  const categoryColors = {
    Community: 'badge-primary', Sports: 'badge-success', Music: 'badge-cyan',
    Food: 'badge-warning', Education: 'badge-gray', Other: 'badge-gray'
  }

  return (
    <div className="card event-card" onClick={() => navigate(`/events/${event._id}`)}>
      {event.images?.[0] ? (
        <img src={event.images[0]} alt={event.title} className="event-card-image" />
      ) : (
        <div className="event-card-image-placeholder">
          {event.category === 'Music' ? '🎵' : event.category === 'Sports' ? '⚽' : event.category === 'Food' ? '🍕' : event.category === 'Education' ? '📚' : '🎉'}
        </div>
      )}
      <div className="event-card-body">
        <span className={`badge ${categoryColors[event.category] || 'badge-gray'}`} style={{ marginBottom: 8, display: 'inline-flex' }}>
          {event.category}
        </span>
        <div className="event-card-title">{event.title}</div>
        <div className="event-card-meta">
          <span>📅 {formatDate(event.date)}{event.time ? ` • ${event.time}` : ''}</span>
          <span>📍 {event.location}</span>
        </div>
        <div className="event-card-footer">
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            👥 {event.attendees?.length || 0}/{event.maxAttendees} attending
          </span>
          <button className="btn btn-primary btn-sm" onClick={e => { e.stopPropagation(); navigate(`/events/${event._id}`) }}>
            View
          </button>
        </div>
      </div>
    </div>
  )
}

export default EventCard
