import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { fetchEvents } from '../store/slices/eventSlice'
import { fetchListings } from '../store/slices/listingSlice'
import { fetchPolls } from '../store/slices/pollSlice'
import EventCard from '../components/EventCard'
import ListingCard from '../components/ListingCard'
import PollCard from '../components/PollCard'
import CreateEventModal from '../components/CreateEventModal'
import CreateListingModal from '../components/CreateListingModal'
import CreatePollModal from '../components/CreatePollModal'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'

const Home = () => {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { events, loading: eventsLoading } = useSelector((state) => state.events)
  const { listings, loading: listingsLoading } = useSelector((state) => state.listings)
  const { polls, loading: pollsLoading } = useSelector((state) => state.polls)
  const { unreadCount } = useSelector((state) => state.notifications)

  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [isListingModalOpen, setIsListingModalOpen] = useState(false)
  const [isPollModalOpen, setIsPollModalOpen] = useState(false)

  useEffect(() => {
    dispatch(fetchEvents({ limit: 4 }))
    dispatch(fetchListings({ limit: 4 }))
    dispatch(fetchPolls({ limit: 3 }))
  }, [dispatch])

  // Get active items
  const recentEvents = events.slice(0, 4)
  const activeListings = listings.slice(0, 4)
  const activePolls = polls.slice(0, 3)

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <div className="page-wrapper">
        <div>
      {/* Welcome Banner */}
      <div style={{
        background: 'var(--gradient-hero)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: '36px',
        marginBottom: '32px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>👋</span>
            <span style={{ color: 'var(--accent-secondary)', fontWeight: '600', fontSize: '0.9rem' }}>
              Welcome back to your neighborhood hub
            </span>
          </div>

          <h1 style={{ fontSize: '2.4rem', marginBottom: '10px' }}>
            Hello, <span className="gradient-text">{user?.name || 'Neighbor'}</span>!
          </h1>

          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', fontSize: '1rem', lineHeight: 1.5, marginBottom: '24px' }}>
            Here is what is currently buzzing around <strong>{user?.neighborhood || 'your local area'}</strong> today. Discover neighbor meetups, buy second-hand goods, or join community discussions.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setIsEventModalOpen(true)}
              className="btn btn-primary"
            >
              + Create Event
            </button>
            <button
              type="button"
              onClick={() => setIsListingModalOpen(true)}
              className="btn btn-secondary"
            >
              + Sell Item
            </button>
            <button
              type="button"
              onClick={() => setIsPollModalOpen(true)}
              className="btn btn-outline"
            >
              + Start Poll
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid-auto" style={{ marginBottom: '36px' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(124, 58, 237, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.6rem'
          }}>
            📅
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Upcoming Events
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800' }}>
              {events?.length || 0}
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(6, 182, 212, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.6rem'
          }}>
            🛍️
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Active Listings
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800' }}>
              {listings?.length || 0}
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.6rem'
          }}>
            📊
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Community Polls
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800' }}>
              {polls?.length || 0}
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(239, 68, 68, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.6rem'
          }}>
            🔔
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              New Notifications
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: unreadCount > 0 ? 'var(--accent-danger)' : 'var(--text-primary)' }}>
              {unreadCount}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Events Section */}
      <section style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.45rem' }}>Upcoming Events</h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              Gatherings and activities happening near you
            </p>
          </div>
          <Link to="/events" className="btn btn-secondary btn-sm">
            View All Events →
          </Link>
        </div>

        {eventsLoading && recentEvents.length === 0 ? (
          <div className="loading-spinner" />
        ) : recentEvents.length === 0 ? (
          <div className="card empty-state">
            <div className="empty-state-icon">🎉</div>
            <div className="empty-state-title">No upcoming events yet</div>
            <div className="empty-state-desc">Host the first block party, workshop or book club in your neighborhood.</div>
            <button type="button" onClick={() => setIsEventModalOpen(true)} className="btn btn-primary btn-sm">
              Create an Event
            </button>
          </div>
        ) : (
          <div className="grid-auto">
            {recentEvents.map((evt) => (
              <EventCard key={evt._id || evt.id} event={evt} />
            ))}
          </div>
        )}
      </section>

      {/* Active Listings Section */}
      <section style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.45rem' }}>Local Marketplace</h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              Items for sale, wanted, or free giveaways from neighbors
            </p>
          </div>
          <Link to="/marketplace" className="btn btn-secondary btn-sm">
            Explore Marketplace →
          </Link>
        </div>

        {listingsLoading && activeListings.length === 0 ? (
          <div className="loading-spinner" />
        ) : activeListings.length === 0 ? (
          <div className="card empty-state">
            <div className="empty-state-icon">🛍️</div>
            <div className="empty-state-title">No listings posted yet</div>
            <div className="empty-state-desc">Declutter your home or find useful goods right next door.</div>
            <button type="button" onClick={() => setIsListingModalOpen(true)} className="btn btn-primary btn-sm">
              Post First Item
            </button>
          </div>
        ) : (
          <div className="grid-auto">
            {activeListings.map((listing) => (
              <ListingCard key={listing._id || listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>

      {/* Community Polls Section */}
      <section style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.45rem' }}>Community Decisions & Polls</h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              Vote and share your opinion on neighborhood matters
            </p>
          </div>
          <Link to="/polls" className="btn btn-secondary btn-sm">
            All Polls →
          </Link>
        </div>

        {pollsLoading && activePolls.length === 0 ? (
          <div className="loading-spinner" />
        ) : activePolls.length === 0 ? (
          <div className="card empty-state">
            <div className="empty-state-icon">📊</div>
            <div className="empty-state-title">No active community polls</div>
            <div className="empty-state-desc">Ask a question to see what your neighbors think.</div>
            <button type="button" onClick={() => setIsPollModalOpen(true)} className="btn btn-primary btn-sm">
              Create a Poll
            </button>
          </div>
        ) : (
          <div className="grid-auto">
            {activePolls.map((poll) => (
              <PollCard key={poll._id || poll.id} poll={poll} />
            ))}
          </div>
        )}
      </section>

      {/* Modals */}
      {isEventModalOpen && <CreateEventModal onClose={() => setIsEventModalOpen(false)} />}
      {isListingModalOpen && <CreateListingModal onClose={() => setIsListingModalOpen(false)} />}
      {isPollModalOpen && <CreatePollModal onClose={() => setIsPollModalOpen(false)} />}
        </div>
        </div>
      </div>
    </div>
  )
}

export default Home
