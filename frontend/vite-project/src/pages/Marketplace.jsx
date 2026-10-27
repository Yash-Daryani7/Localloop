import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchListings } from '../store/slices/listingSlice'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import ListingCard from '../components/ListingCard'
import CreateListingModal from '../components/CreateListingModal'

function Marketplace() {
  const dispatch = useDispatch()
  const { listings, loading } = useSelector(state => state.listings)
  const [showModal, setShowModal] = useState(false)
  const [typeFilter, setTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  useEffect(() => {
    const params = {}
    if (typeFilter !== 'all') params.type = typeFilter
    if (categoryFilter !== 'all') params.category = categoryFilter
    dispatch(fetchListings(params))
  }, [typeFilter, categoryFilter])

  const types = ['all', 'sell', 'buy', 'free']
  const categories = ['all', 'Electronics', 'Furniture', 'Clothing', 'Books', 'Vehicles', 'Food', 'Services', 'Other']

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <div className="page-wrapper">
          <div className="page-header">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h1 className="page-title">🛍️ Marketplace</h1>
                <p className="page-subtitle">Buy, sell, or give away items in your neighborhood</p>
              </div>
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Listing</button>
            </div>
          </div>

          <div className="filter-bar">
            {types.map(t => (
              <button key={t} className={`filter-chip ${typeFilter === t ? 'active' : ''}`} onClick={() => setTypeFilter(t)}>
                {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
            <span style={{ color: 'var(--border)', margin: '0 4px' }}>|</span>
            <select className="form-input form-select" style={{ width: 'auto', padding: '7px 32px 7px 12px', fontSize: '0.85rem' }}
              value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              {categories.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="loading-center"><div className="loading-spinner" /></div>
          ) : listings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🛍️</div>
              <div className="empty-title">No listings yet</div>
              <div className="empty-subtitle">Be the first to post something!</div>
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>Post a Listing</button>
            </div>
          ) : (
            <div className="grid-auto">
              {listings.map(listing => <ListingCard key={listing._id} listing={listing} />)}
            </div>
          )}
        </div>
      </div>
      {showModal && <CreateListingModal onClose={() => setShowModal(false)} />}
    </div>
  )
}

export default Marketplace
