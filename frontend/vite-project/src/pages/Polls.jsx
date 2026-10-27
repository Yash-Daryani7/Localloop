import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchPolls } from '../store/slices/pollSlice'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import PollCard from '../components/PollCard'
import CreatePollModal from '../components/CreatePollModal'

function Polls() {
  const dispatch = useDispatch()
  const { polls, loading } = useSelector(state => state.polls)
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState('active')

  useEffect(() => {
    dispatch(fetchPolls())
  }, [])

  const now = new Date()
  const filtered = polls.filter(p => {
    if (filter === 'active') return new Date(p.expiresAt) > now
    if (filter === 'expired') return new Date(p.expiresAt) <= now
    return true
  })

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <div className="page-wrapper">
          <div className="page-header">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h1 className="page-title">📊 Community Polls</h1>
                <p className="page-subtitle">Vote on neighborhood decisions in real time</p>
              </div>
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Create Poll</button>
            </div>
          </div>

          <div className="filter-bar">
            {['all', 'active', 'expired'].map(f => (
              <button key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="loading-center"><div className="loading-spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <div className="empty-title">No polls yet</div>
              <div className="empty-subtitle">Start a poll to get your neighborhood's opinion!</div>
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>Create Poll</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {filtered.map(poll => <PollCard key={poll._id} poll={poll} />)}
            </div>
          )}
        </div>
      </div>
      {showModal && <CreatePollModal onClose={() => setShowModal(false)} />}
    </div>
  )
}

export default Polls
