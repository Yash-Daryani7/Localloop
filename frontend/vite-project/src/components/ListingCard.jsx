import React from 'react'
import { useNavigate } from 'react-router-dom'
import Avatar from './Avatar'

function ListingCard({ listing }) {
  const navigate = useNavigate()
  const typeBadge = { sell: 'badge-danger', buy: 'badge-primary', free: 'badge-success' }

  return (
    <div className="card listing-card" onClick={() => navigate(`/marketplace/${listing._id}`)}>
      <div className="listing-card-image">
        {listing.images?.[0] ? (
          <img src={listing.images[0]} alt={listing.title} />
        ) : (
          <div className="listing-card-image-placeholder">📦</div>
        )}
      </div>
      <div className="listing-card-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <span className={`badge ${typeBadge[listing.type] || 'badge-gray'}`}>{listing.type.toUpperCase()}</span>
          {listing.status === 'sold' && <span className="badge badge-gray">SOLD</span>}
        </div>
        <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 4 }}>{listing.title}</div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 10 }}>📍 {listing.neighborhood}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.1rem', color: listing.type === 'free' ? 'var(--accent-success)' : 'var(--text-primary)' }}>
            {listing.type === 'free' ? 'FREE' : listing.price > 0 ? `₹${listing.price}` : 'Negotiable'}
          </span>
          <Avatar name={listing.seller?.name} src={listing.seller?.avatar} size="sm" style={{ fontSize: '0.7rem' }} />
        </div>
      </div>
    </div>
  )
}

export default ListingCard
