import React, { useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { createEvent } from '../store/slices/eventSlice'

function CreateEventModal({ onClose }) {
  const dispatch = useDispatch()
  const [form, setForm] = useState({ title: '', description: '', category: 'Community', date: '', time: '', location: '', maxAttendees: 100 })
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const submittingRef = useRef(false)

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submittingRef.current) return
    if (!form.title || !form.date || !form.location) { setError('Please fill in all required fields'); return }
    submittingRef.current = true
    setLoading(true); setError('')
    const fd = new FormData()
    Object.keys(form).forEach(k => fd.append(k, form[k]))
    images.forEach(img => fd.append('images', img))
    try {
      const res = await dispatch(createEvent(fd))
      if (res.error) setError(res.payload || 'Failed to create event')
      else onClose()
    } finally {
      submittingRef.current = false
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">📅 Create Event</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div style={{ color: 'var(--accent-danger)', marginBottom: 14, fontSize: '0.85rem' }}>{error}</div>}
          <div className="form-group">
            <label className="form-label">Event Title *</label>
            <input name="title" className="form-input" placeholder="What's happening?" value={form.title} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea name="description" className="form-input" placeholder="Tell neighbors about your event..." value={form.description} onChange={handleChange} />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select name="category" className="form-input form-select" value={form.category} onChange={handleChange}>
                {['Community','Sports','Music','Food','Education','Other'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Max Attendees</label>
              <input type="number" name="maxAttendees" className="form-input" value={form.maxAttendees} onChange={handleChange} min="1" />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Date *</label>
              <input type="date" name="date" className="form-input" value={form.date} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Time</label>
              <input type="time" name="time" className="form-input" value={form.time} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Location *</label>
            <input name="location" className="form-input" placeholder="Venue or address" value={form.location} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Images</label>
            <label className="upload-area">
              <input type="file" accept="image/*" multiple onChange={e => setImages([...e.target.files])} />
              <div>📸 {images.length > 0 ? `${images.length} image(s) selected` : 'Click to upload images'}</div>
            </label>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateEventModal
