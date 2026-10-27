import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { votePoll } from '../store/slices/pollSlice'

function PollCard({ poll }) {
  const dispatch = useDispatch()
  const { user } = useSelector(state => state.auth)

  const totalVotes = poll.options?.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0) || 0
  const hasVoted = poll.options?.some(opt => opt.votes?.includes(user?._id))
  const isExpired = new Date(poll.expiresAt) < new Date()

  const handleVote = (optionIndex) => {
    if (hasVoted || isExpired) return
    dispatch(votePoll({ pollId: poll._id, optionIndex }))
  }

  const getPercent = (votes) => totalVotes === 0 ? 0 : Math.round((votes.length / totalVotes) * 100)

  const timeLeft = () => {
    if (isExpired) return 'Expired'
    const diff = new Date(poll.expiresAt) - new Date()
    const hours = Math.floor(diff / 3600000)
    if (hours < 24) return `${hours}h left`
    return `${Math.floor(hours / 24)}d left`
  }

  return (
    <div className={`card poll-card ${hasVoted ? 'poll-voted' : ''}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div className="poll-question">{poll.question}</div>
        <span className={`badge ${isExpired ? 'badge-gray' : 'badge-success'}`} style={{ flexShrink: 0, marginLeft: 8 }}>
          {timeLeft()}
        </span>
      </div>
      <div>
        {poll.options?.map((opt, idx) => {
          const pct = getPercent(opt.votes || [])
          const userVotedThis = opt.votes?.includes(user?._id)
          return (
            <div key={idx} className="poll-option">
              <div className="poll-option-label">
                <span className="poll-option-text" style={{ color: userVotedThis ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                  {userVotedThis ? '✓ ' : ''}{opt.text}
                </span>
                <span>{pct}% ({opt.votes?.length || 0})</span>
              </div>
              <div
                className="poll-progress-bar"
                onClick={() => handleVote(idx)}
                title={hasVoted || isExpired ? '' : `Vote for "${opt.text}"`}
                style={{ cursor: hasVoted || isExpired ? 'default' : 'pointer' }}
              >
                <div className="poll-progress-fill" style={{ width: `${pct}%`, background: userVotedThis ? 'var(--gradient-primary)' : 'linear-gradient(135deg, rgba(124,58,237,0.4), rgba(6,182,212,0.4))' }} />
              </div>
            </div>
          )
        })}
      </div>
      <div className="poll-meta">
        <span>📊 {totalVotes} total votes</span>
        <span>by {poll.createdBy?.name || 'Neighbor'}</span>
      </div>
    </div>
  )
}

export default PollCard
