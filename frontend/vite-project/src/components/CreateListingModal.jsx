import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { createListing } from '../store/slices/listingSlice'

function CreateListingModal({ onClose }) {
  const dispatch = useDispatch()
  const [form, setForm] = useState({ title: '', description: '', type: 'sell', price: '', category: 'Electronics', contactInfo: '' })
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title) { setError('Title is required'); return }
    setLoading(true); setError('')
    const fd = new FormData()
    Object.keys(form).forEach(k => fd.append(k, form[k]))
    images.forEach(img => fd.append('images', img))
    const res = await dispatch(createListing(fd))
    setLoading(false)
    if (res.error) setError(res.payload || 'Failed to create listing')
    else onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">🛍️ New Listing</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div style={{ color: 'var(--accent-danger)', marginBottom: 14, fontSize: '0.85rem' }}>{error}</div>}
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input name="title" className="form-input" placeholder="What are you listing?" value={form.title} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea name="description" className="form-input" placeholder="Describe the item..." value={form.description} onChange={handleChange} />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Type</label>
              <select name="type" className="form-input form-select" value={form.type} onChange={handleChange}>
                <option value="sell">Sell</option>
                <option value="buy">Buy (Wanted)</option>
                <option value="free">Free</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select name="category" className="form-input form-select" value={form.category} onChange={handleChange}>
                {['Electronics','Furniture','Clothing','Books','Vehicles','Food','Services','Other'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          {form.type === 'sell' && (
            <div className="form-group">
              <label className="form-label">Price (₹)</label>
              <input type="number" name="price" className="form-input" placeholder="0 = Negotiable" value={form.price} onChange={handleChange} min="0" />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Contact Info</label>
            <input name="contactInfo" className="form-input" placeholder="Phone or preferred contact method" value={form.contactInfo} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Images</label>
            <label className="upload-area">
              <input type="file" accept="image/*" multiple onChange={e => setImages([...e.target.files])} />
              <div>📸 {images.length > 0 ? `${images.length} image(s) selected` : 'Click to upload images'}</div>
            </label>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? 'Posting...' : 'Post Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateListingModal
