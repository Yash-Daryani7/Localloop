import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { createPoll } from '../store/slices/pollSlice'

function CreatePollModal({ onClose }) {
  const dispatch = useDispatch()
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [expiresAt, setExpiresAt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const addOption = () => setOptions([...options, ''])
  const removeOption = (idx) => setOptions(options.filter((_, i) => i !== idx))
  const updateOption = (idx, val) => setOptions(options.map((o, i) => i === idx ? val : o))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const filled = options.filter(o => o.trim())
    if (!question.trim()) { setError('Question is required'); return }
    if (filled.length < 2) { setError('At least 2 options required'); return }
    if (!expiresAt) { setError('Expiry date is required'); return }
    setLoading(true); setError('')
    const res = await dispatch(createPoll({ question, options: filled.map(text => ({ text })), expiresAt }))
    setLoading(false)
    if (res.error) setError(res.payload || 'Failed to create poll')
    else onClose()
  }

  const minDate = new Date(Date.now() + 3600000).toISOString().slice(0, 16)

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">📊 Create Poll</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div style={{ color: 'var(--accent-danger)', marginBottom: 14, fontSize: '0.85rem' }}>{error}</div>}
          <div className="form-group">
            <label className="form-label">Question *</label>
            <input className="form-input" placeholder="Ask your neighborhood..." value={question} onChange={e => setQuestion(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Options *</label>
            {options.map((opt, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input
                  className="form-input"
                  placeholder={`Option ${idx + 1}`}
                  value={opt}
                  onChange={e => updateOption(idx, e.target.value)}
                  style={{ marginBottom: 0 }}
                />
                {options.length > 2 && (
                  <button type="button" className="btn btn-danger btn-icon" onClick={() => removeOption(idx)}>✕</button>
                )}
              </div>
            ))}
            {options.length < 6 && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={addOption}>+ Add Option</button>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Poll Expires At *</label>
            <input type="datetime-local" className="form-input" value={expiresAt} min={minDate} onChange={e => setExpiresAt(e.target.value)} required />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? 'Creating...' : 'Launch Poll'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreatePollModal
