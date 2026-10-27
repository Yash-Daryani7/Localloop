import React from 'react'
import { useNavigate } from 'react-router-dom'

const categoryIcons = {
  Plumbing: '🔧', Electrical: '⚡', Carpentry: '🪚', Cleaning: '🧹',
  Tutoring: '📚', Delivery: '📦', Gardening: '🌱', Other: '🛠️'
}

function ServiceCard({ service, onRespond }) {
  const navigate = useNavigate()

  return (
    <div className="card service-card" onClick={() => navigate(`/services`)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <span className="service-card-category">{categoryIcons[service.category] || '🛠️'}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <span className={`badge ${service.type === 'offer' ? 'badge-success' : 'badge-primary'}`}>
            {service.type === 'offer' ? 'OFFER' : 'REQUEST'}
          </span>
          <span className={`badge ${service.status === 'open' ? 'badge-cyan' : 'badge-gray'}`}>
            {service.status}
          </span>
        </div>
      </div>
      <div className="service-card-title">{service.title}</div>
      <div className="service-card-desc">{service.description}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          💬 {service.responses?.length || 0} responses
        </span>
        {service.budget && (
          <span style={{ fontSize: '0.82rem', color: 'var(--accent-warning)', fontWeight: 600 }}>
            💰 {service.budget}
          </span>
        )}
      </div>
      {onRespond && service.status === 'open' && (
        <button
          className="btn btn-secondary btn-sm"
          style={{ marginTop: 12, width: '100%' }}
          onClick={e => { e.stopPropagation(); onRespond(service) }}
        >
          Respond
        </button>
      )}
    </div>
  )
}

export default ServiceCard
