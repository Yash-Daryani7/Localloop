import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchListingById, markAsSold, deleteListing, expressInterest } from '../store/slices/listingSlice'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'

function ListingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { currentListing: listing, loading } = useSelector(state => state.listings)
  const { user } = useSelector(state => state.auth)
  const [activeImg, setActiveImg] = useState(0)
  const [interestSent, setInterestSent] = useState(false)

  useEffect(() => {
    if (id) dispatch(fetchListingById(id))
  }, [id])

  if (loading && !listing) return <div className="loading-center"><div className="loading-spinner" /></div>
  if (!listing) return <div className="empty-state"><div className="empty-icon">🔍</div><div className="empty-title">Listing not found</div></div>

  const isSeller = user?._id === (listing.seller?._id || listing.seller)
  const typeBadge = { sell: 'badge-danger', buy: 'badge-primary', free: 'badge-success' }

  const handleInterest = async () => {
    await dispatch(expressInterest(listing._id))
    setInterestSent(true)
  }

  const handleDelete = async () => {
    if (window.confirm('Delete this listing?')) {
      await dispatch(deleteListing(listing._id))
      navigate('/marketplace')
    }
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <div className="page-wrapper">
          <button className="btn btn-secondary btn-sm" style={{ marginBottom: 20 }} onClick={() => navigate('/marketplace')}>← Back</button>
          <div className="grid-2" style={{ alignItems: 'start' }}>
            {/* Images */}
            <div>
              {listing.images?.length > 0 ? (
                <div>
                  <div style={{ height: 320, borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--border)', marginBottom: 10 }}>
                    <img src={listing.images[activeImg]} alt={listing.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  {listing.images.length > 1 && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      {listing.images.map((img, i) => (
                        <div key={i} onClick={() => setActiveImg(i)} style={{ width: 70, height: 52, borderRadius: 8, overflow: 'hidden', border: `2px solid ${activeImg === i ? 'var(--accent-primary)' : 'var(--border)'}`, cursor: 'pointer' }}>
                          <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ height: 320, borderRadius: 'var(--radius-xl)', background: 'linear-gradient(135deg, #1e1e2a, #2a2a3a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem', border: '1px solid var(--border)' }}>📦</div>
              )}
            </div>

            {/* Details */}
            <div>
              <div className="card">
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <span className={`badge ${typeBadge[listing.type]}`}>{listing.type?.toUpperCase()}</span>
                  <span className="badge badge-gray">{listing.category}</span>
                  {listing.status === 'sold' && <span className="badge badge-gray">SOLD</span>}
                </div>
                <h1 style={{ fontSize: '1.6rem', fontFamily: 'Outfit', fontWeight: 800, marginBottom: 8 }}>{listing.title}</h1>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: listing.type === 'free' ? 'var(--accent-success)' : 'var(--text-primary)', fontFamily: 'Outfit', marginBottom: 16 }}>
                  {listing.type === 'free' ? 'FREE' : listing.price > 0 ? `₹${listing.price}` : 'Negotiable'}
                </div>
                <div style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 20 }}>{listing.description || 'No description provided.'}</div>
                <div style={{ padding: '14px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', marginBottom: 20 }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6 }}>SELLER</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="avatar avatar-placeholder" style={{ width: 36, height: 36, borderRadius: '50%', fontSize: '0.85rem' }}>{listing.seller?.name?.charAt(0) || 'U'}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{listing.seller?.name || 'Neighbor'}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>📍 {listing.neighborhood}</div>
                    </div>
                  </div>
                  {listing.contactInfo && <div style={{ marginTop: 8, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>📞 {listing.contactInfo}</div>}
                </div>

                {isSeller ? (
                  <div style={{ display: 'flex', gap: 10 }}>
                    {listing.status === 'active' && <button className="btn btn-success" style={{ flex: 1 }} onClick={() => dispatch(markAsSold(listing._id))}>Mark as Sold</button>}
                    <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleDelete}>Delete</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-primary" style={{ flex: 1 }} disabled={interestSent || listing.status === 'sold'} onClick={handleInterest}>
                      {interestSent ? '✓ Interest Sent!' : listing.status === 'sold' ? 'Item Sold' : '❤️ Express Interest'}
                    </button>
                    <button className="btn btn-secondary" onClick={() => navigate(`/chat/${listing.seller?._id}`)}>💬 Chat</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ListingDetail
