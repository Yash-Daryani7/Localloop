import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchEvents } from '../store/slices/eventSlice'
import EventCard from '../components/EventCard'
import CreateEventModal from '../components/CreateEventModal'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'

const Events = () => {
  const dispatch = useDispatch()
  const { events, loading, totalPages } = useSelector((state) => state.events)
  const { user } = useSelector((state) => state.auth)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [neighborhoodFilter, setNeighborhoodFilter] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    dispatch(fetchEvents({
      page,
      category: categoryFilter !== 'All' ? categoryFilter : undefined,
      neighborhood: neighborhoodFilter || undefined,
    }))
  }, [dispatch, page, categoryFilter, neighborhoodFilter])

  const categories = ['All', 'Community', 'Sports', 'Music', 'Food', 'Education', 'Other']

  const filteredEvents = events.filter((e) => {
    if (categoryFilter !== 'All' && e.category !== categoryFilter) return false
    if (neighborhoodFilter && !e.neighborhood?.toLowerCase().includes(neighborhoodFilter.toLowerCase())) return false
    if (statusFilter === 'Upcoming') return e.date ? new Date(e.date) >= new Date() : true
    if (statusFilter === 'Past') return e.date ? new Date(e.date) < new Date() : false
    return true
  })

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <div className="page-wrapper">
          {/* Header */}
          <div className="page-header">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h1 className="page-title">📅 Neighborhood Events</h1>
                <p className="page-subtitle">Find out what's happening around {user?.neighborhood || 'your neighborhood'}</p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(true)} className="btn btn-primary">
                + Host an Event
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="filter-bar">
            {categories.map((cat) => (
              <button key={cat} type="button" className={`filter-chip ${categoryFilter === cat ? 'active' : ''}`} onClick={() => setCategoryFilter(cat)}>
                {cat}
              </button>
            ))}
            <span style={{ color: 'var(--border)', margin: '0 4px' }}>|</span>
            <select className="form-input form-select" style={{ width: 'auto', padding: '7px 32px 7px 12px', fontSize: '0.85rem' }}
              value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="All">All Dates</option>
              <option value="Upcoming">Upcoming Only</option>
              <option value="Past">Past Events</option>
            </select>
            <input type="text" className="form-input" style={{ width: '180px', padding: '7px 12px', fontSize: '0.85rem' }}
              placeholder="Filter by neighborhood..." value={neighborhoodFilter} onChange={(e) => setNeighborhoodFilter(e.target.value)} />
          </div>

          {/* Events Grid */}
          {loading && filteredEvents.length === 0 ? (
            <div className="loading-center"><div className="loading-spinner" /></div>
          ) : filteredEvents.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <div className="empty-title">No events found</div>
              <div className="empty-subtitle">Be the first to host a neighborhood event!</div>
              <button type="button" onClick={() => setIsModalOpen(true)} className="btn btn-primary" style={{ marginTop: 16 }}>Create an Event</button>
            </div>
          ) : (
            <div className="grid-auto">
              {filteredEvents.map((evt) => <EventCard key={evt._id || evt.id} event={evt} />)}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '36px' }}>
              <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn btn-secondary btn-sm">Previous</button>
              <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: '0.9rem' }}>Page {page} of {totalPages}</span>
              <button type="button" disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="btn btn-secondary btn-sm">Next</button>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && <CreateEventModal onClose={() => setIsModalOpen(false)} />}
    </div>
  )
}

export default Events
