import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { createService } from '../store/slices/serviceSlice'

function CreateServiceModal({ onClose }) {
  const dispatch = useDispatch()
  const [form, setForm] = useState({ title: '', description: '', type: 'request', category: 'Other', budget: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.description) { setError('Title and description are required'); return }
    setLoading(true); setError('')
    const res = await dispatch(createService(form))
    setLoading(false)
    if (res.error) setError(res.payload || 'Failed to post')
    else onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">🔧 {form.type === 'offer' ? 'Offer a Service' : 'Request a Service'}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div style={{ color: 'var(--accent-danger)', marginBottom: 14, fontSize: '0.85rem' }}>{error}</div>}
          <div className="form-group">
            <label className="form-label">I want to...</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {['request', 'offer'].map(t => (
                <button key={t} type="button"
                  className={`btn ${form.type === t ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ flex: 1 }}
                  onClick={() => setForm({ ...form, type: t })}
                >
                  {t === 'request' ? '🙋 Request Help' : '🤝 Offer Help'}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input name="title" className="form-input" placeholder={form.type === 'request' ? 'I need help with...' : 'I can help with...'} value={form.title} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea name="description" className="form-input" placeholder="Provide more details..." value={form.description} onChange={handleChange} required />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select name="category" className="form-input form-select" value={form.category} onChange={handleChange}>
                {['Plumbing','Electrical','Carpentry','Cleaning','Tutoring','Delivery','Gardening','Other'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Budget / Rate</label>
              <input name="budget" className="form-input" placeholder="e.g. ₹500/hr or Free" value={form.budget} onChange={handleChange} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateServiceModal
