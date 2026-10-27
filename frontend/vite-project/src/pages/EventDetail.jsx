import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchEventById,
  rsvpEvent,
  cancelRsvp,
  deleteEvent,
  updateEvent
} from '../store/slices/eventSlice'
import Avatar from '../components/Avatar'

const EventDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { currentEvent: event, loading } = useSelector((state) => state.events)
  const { user } = useSelector((state) => state.auth)

  const [activeImageIdx, setActiveImageIdx] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    location: '',
    date: '',
    time: '',
    category: ''
  })

  useEffect(() => {
    if (id) {
      dispatch(fetchEventById(id))
    }
  }, [id, dispatch])

  useEffect(() => {
    if (event) {
      setEditForm({
        title: event.title || '',
        description: event.description || '',
        location: event.location || '',
        date: event.date ? event.date.slice(0, 10) : '',
        time: event.time || '',
        category: event.category || 'Community'
      })
    }
  }, [event])

  if (loading && !event) {
    return <div className="loading-spinner" />
  }

  if (!event) {
    return (
      <div className="card empty-state">
        <div className="empty-state-icon">🔍</div>
        <div className="empty-state-title">Event Not Found</div>
        <div className="empty-state-desc">This event may have been cancelled or removed by the host.</div>
        <Link to="/events" className="btn btn-secondary btn-sm">
          Back to Events
        </Link>
      </div>
    )
  }

  const currentUserId = user?._id || user?.id
  const organizerId = event.creator?._id || event.creator?.id || event.creator || event.organizer?._id || event.organizer
  const isOrganizer = currentUserId && (currentUserId === organizerId)

  const isAttending = event.attendees?.some((att) => {
    const attId = att._id || att.id || att
    return attId === currentUserId
  })

  const handleRsvpToggle = () => {
    const eventId = event._id || event.id
    if (isAttending) {
      dispatch(cancelRsvp(eventId))
    } else {
      dispatch(rsvpEvent(eventId))
    }
  }

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      await dispatch(deleteEvent(event._id || event.id))
      navigate('/events')
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    await dispatch(updateEvent({ id: event._id || event.id, eventData: editForm }))
    setIsEditing(false)
  }

  const images = event.images && event.images.length > 0 ? event.images : []

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* Back Button */}
      <div style={{ marginBottom: '20px' }}>
        <button
          type="button"
          onClick={() => navigate('/events')}
          className="btn btn-secondary btn-sm"
        >
          ← Back to Events
        </button>
      </div>

      {/* Gallery / Hero */}
      {images.length > 0 ? (
        <div style={{ marginBottom: '28px' }}>
          <div style={{
            height: '380px',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-md)'
          }}>
            <img
              src={images[activeImageIdx]}
              alt={event.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          {images.length > 1 && (
            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              {images.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  style={{
                    width: '80px',
                    height: '60px',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: activeImageIdx === idx ? '2px solid var(--accent-primary)' : '1px solid var(--border)'
                  }}
                >
                  <img src={img} alt="thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{
          height: '240px',
          borderRadius: 'var(--radius-xl)',
          background: 'linear-gradient(135deg, #2e1065, #083344)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '4.5rem',
          marginBottom: '28px'
        }}>
          🎉
        </div>
      )}

      {/* Event Details Card */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span className="badge badge-purple">{event.category || 'Community'}</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                📍 {event.neighborhood || 'Local Community'}
              </span>
            </div>
            <h1 style={{ fontSize: '2.2rem' }}>{event.title}</h1>
          </div>

          {/* Organizer Controls */}
          {isOrganizer && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="btn btn-secondary btn-sm"
              >
                {isEditing ? 'Cancel Edit' : 'Edit Event'}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="btn btn-danger btn-sm"
              >
                Delete Event
              </button>
            </div>
          )}
        </div>

        {/* Edit Form */}
        {isEditing ? (
          <form onSubmit={handleUpdate} style={{ marginTop: '20px' }}>
            <div className="input-group">
              <label className="label">Title</label>
              <input
                type="text"
                className="input"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>
            <div className="input-group">
              <label className="label">Location</label>
              <input
                type="text"
                className="input"
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
              />
            </div>
            <div className="grid-2">
              <div className="input-group">
                <label className="label">Date</label>
                <input
                  type="date"
                  className="input"
                  value={editForm.date}
                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                />
              </div>
              <div className="input-group">
                <label className="label">Time</label>
                <input
                  type="time"
                  className="input"
                  value={editForm.time}
                  onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                />
              </div>
            </div>
            <div className="input-group">
              <label className="label">Description</label>
              <textarea
                className="textarea"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-sm">
              Save Changes
            </button>
          </form>
        ) : (
          <>
            {/* Metadata Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              padding: '18px',
              background: 'var(--bg-input)',
              borderRadius: 'var(--radius-md)',
              margin: '20px 0'
            }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date & Time</div>
                <div style={{ fontWeight: '600', marginTop: '4px' }}>
                  📅 {event.date ? new Date(event.date).toLocaleDateString() : 'TBD'} {event.time ? `at ${event.time}` : ''}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Location</div>
                <div style={{ fontWeight: '600', marginTop: '4px' }}>
                  📍 {event.location || 'Local community venue'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Capacity</div>
                <div style={{ fontWeight: '600', marginTop: '4px' }}>
                  👥 {event.attendees?.length || 0} attending {event.maxAttendees ? `(max ${event.maxAttendees})` : ''}
                </div>
              </div>
            </div>

            {/* Description */}
            <div style={{ margin: '24px 0', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '10px' }}>About This Event</h3>
              <p>{event.description || 'No detailed description provided.'}</p>
            </div>

            {/* RSVP Section */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '20px',
              borderTop: '1px solid var(--border)'
            }}>
              <div>
                <span style={{ fontWeight: '700', fontSize: '1.05rem' }}>Are you going?</span>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Reserve your spot to receive real-time schedule notifications.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRsvpToggle}
                className={`btn btn-lg ${isAttending ? 'btn-secondary' : 'btn-primary'}`}
              >
                {isAttending ? '✓ You are Attending (Cancel)' : 'RSVP Now'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Host & Attendees Section */}
      <div className="grid-2">
        {/* Organizer Card */}
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '14px' }}>Organizer</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Avatar name={event.creator?.name || 'Organizer'} src={event.creator?.avatar} size="lg" />
            <div>
              <div style={{ fontWeight: '700', fontSize: '1.05rem' }}>{event.creator?.name || 'Neighbor'}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Community Host • {event.creator?.neighborhood || event.neighborhood || 'Local'}
              </div>
              <Link
                to={`/chat/${organizerId}`}
                className="btn btn-secondary btn-sm"
                style={{ marginTop: '10px' }}
              >
                💬 Message Host
              </Link>
            </div>
          </div>
        </div>

        {/* Attendees List */}
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '14px' }}>
            Attendees ({event.attendees?.length || 0})
          </h3>

          {event.attendees && event.attendees.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {event.attendees.map((att, i) => {
                const name = att.name || 'Neighbor'
                return (
                  <div
                    key={att._id || att.id || i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'var(--bg-input)',
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <Avatar name={name} src={att.avatar} size="sm" />
                    <span style={{ fontSize: '0.82rem', fontWeight: '500' }}>{name}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              No one has RSVP'd yet. Be the first to join!
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default EventDetail
