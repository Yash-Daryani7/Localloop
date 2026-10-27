import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchServices, respondToService, createService } from '../store/slices/serviceSlice'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import ServiceCard from '../components/ServiceCard'
import CreateServiceModal from '../components/CreateServiceModal'

function Services() {
  const dispatch = useDispatch()
  const { services, loading } = useSelector(state => state.services)
  const [showModal, setShowModal] = useState(false)
  const [typeFilter, setTypeFilter] = useState('all')
  const [respondTarget, setRespondTarget] = useState(null)
  const [responseMsg, setResponseMsg] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    const params = {}
    if (typeFilter !== 'all') params.type = typeFilter
    dispatch(fetchServices(params))
  }, [typeFilter])

  const handleRespond = async (e) => {
    e.preventDefault()
    if (!responseMsg.trim()) return
    setSending(true)
    // Use axiosInstance directly for respond
    const axiosInstance = (await import('../api/axios')).default
    await axiosInstance.post(`/services/${respondTarget._id}/respond`, { message: responseMsg })
    setSending(false)
    setRespondTarget(null)
    setResponseMsg('')
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
                <h1 className="page-title">🔧 Services</h1>
                <p className="page-subtitle">Offer or request local services from neighbors</p>
              </div>
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Post Service</button>
            </div>
          </div>

          <div className="filter-bar">
            {['all', 'offer', 'request'].map(t => (
              <button key={t} className={`filter-chip ${typeFilter === t ? 'active' : ''}`} onClick={() => setTypeFilter(t)}>
                {t === 'all' ? 'All' : t === 'offer' ? '🤝 Offers' : '🙋 Requests'}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="loading-center"><div className="loading-spinner" /></div>
          ) : services.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔧</div>
              <div className="empty-title">No services yet</div>
              <div className="empty-subtitle">Post a service offer or request help from your neighbors!</div>
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>Post Service</button>
            </div>
          ) : (
            <div className="grid-auto">
              {services.map(service => <ServiceCard key={service._id} service={service} onRespond={(s) => setRespondTarget(s)} />)}
            </div>
          )}
        </div>
      </div>

      {showModal && <CreateServiceModal onClose={() => setShowModal(false)} />}

      {respondTarget && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setRespondTarget(null)}>
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <span className="modal-title">💬 Respond to Service</span>
              <button className="modal-close" onClick={() => setRespondTarget(null)}>✕</button>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: '0.9rem' }}>
              Responding to: <strong style={{ color: 'var(--text-primary)' }}>{respondTarget.title}</strong>
            </p>
            <form onSubmit={handleRespond}>
              <div className="form-group">
                <label className="form-label">Your Message</label>
                <textarea className="form-input" placeholder="Write your response..." value={responseMsg} onChange={e => setResponseMsg(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setRespondTarget(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={sending}>{sending ? 'Sending...' : 'Send Response'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Services
