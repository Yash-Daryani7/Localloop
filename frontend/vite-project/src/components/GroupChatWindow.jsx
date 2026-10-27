import React, { useEffect, useRef, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchGroupMessages,
  sendGroupMessage,
  fetchOnlineMembers
} from '../store/slices/groupChatSlice'
import socket from '../socket'

function GroupChatWindow() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useSelector(state => state.auth)
  const {
    messages,
    onlineMembers,
    loading,
    hasMore,
    page,
    typingUsers
  } = useSelector(state => state.groupChat)

  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const bottomRef = useRef(null)
  const sendingRef = useRef(false)
  const typingTimeoutRef = useRef(null)
  const prevLastMsgIdRef = useRef(null)

  const neighborhood = user?.neighborhood || 'Neighborhood'

  // Initial data fetch and room join
  useEffect(() => {
    if (user?.neighborhood) {
      dispatch(fetchGroupMessages({ neighborhood: user.neighborhood, page: 1 }))
      dispatch(fetchOnlineMembers({ neighborhood: user.neighborhood }))
      socket.emit('join_neighborhood', user.neighborhood)
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (user?.neighborhood) {
        socket.emit('stop_typing_group', {
          neighborhood: user.neighborhood,
          name: user.name
        })
      }
    }
  }, [user?.neighborhood, dispatch])

  // Auto-scroll to bottom only when new message is appended or initial load
  useEffect(() => {
    const lastMsg = messages[messages.length - 1]
    const lastMsgId = lastMsg?._id || lastMsg?.id
    if (!prevLastMsgIdRef.current || (lastMsgId && lastMsgId !== prevLastMsgIdRef.current)) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    prevLastMsgIdRef.current = lastMsgId
  }, [messages])

  // Typing handler
  const handleInputChange = (e) => {
    const val = e.target.value
    setText(val)

    if (user?.neighborhood) {
      socket.emit('typing_group', {
        neighborhood: user.neighborhood,
        name: user.name
      })

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop_typing_group', {
          neighborhood: user.neighborhood,
          name: user.name
        })
      }, 2000)
    }
  }

  // Send message handler
  const handleSend = async (e) => {
    e.preventDefault()
    const content = text.trim()
    if (!content || !user?.neighborhood || sendingRef.current) return

    sendingRef.current = true
    setSending(true)
    setSendError('')

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    socket.emit('stop_typing_group', {
      neighborhood: user.neighborhood,
      name: user.name
    })

    try {
      await dispatch(sendGroupMessage({ content })).unwrap()
      setText('')
    } catch (error) {
      setSendError(typeof error === 'string' ? error : 'Failed to send message. Please try again.')
    } finally {
      sendingRef.current = false
      setSending(false)
    }
  }

  const handleLoadOlder = () => {
    if (user?.neighborhood && !loading) {
      dispatch(
        fetchGroupMessages({
          neighborhood: user.neighborhood,
          page: page + 1
        })
      )
    }
  }

  // Format timestamp
  const formatTime = (d) => {
    if (!d) return ''
    try {
      return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  // Filter typing users (exclude self)
  const otherTypingUsers = useMemo(() => {
    return typingUsers.filter(name => name && name !== user?.name)
  }, [typingUsers, user?.name])

  const getTypingText = (users) => {
    if (users.length === 1) return `${users[0]} is typing...`
    if (users.length === 2) return `${users[0]} and ${users[1]} are typing...`
    return `${users[0]}, ${users[1]} and ${users.length - 2} others are typing...`
  }

  // Ensure current user is included in displayed online members
  const displayedMembers = useMemo(() => {
    const list = Array.isArray(onlineMembers) ? [...onlineMembers] : []
    if (user && !list.some(m => m._id === user._id)) {
      list.unshift(user)
    }
    return list
  }, [onlineMembers, user])

  const onlineCount = displayedMembers.length

  return (
    <div className="group-chat-window">
      {/* Header */}
      <div className="group-chat-header">
        <div className="group-chat-header-info">
          <div className="group-chat-header-icon">🌐</div>
          <div className="group-chat-header-text">
            <h3>{neighborhood} Community</h3>
            <span>Neighborhood Public Chat</span>
          </div>
        </div>
        <div className="online-count-badge">
          <span className="online-dot" />
          <span>{onlineCount} Online</span>
        </div>
      </div>

      {/* Online Members Strip */}
      {displayedMembers.length > 0 && (
        <div className="online-members-strip">
          {displayedMembers.map(member => (
            <div
              key={member._id}
              className="online-member-chip"
              onClick={() => navigate(`/profile/${member._id}`)}
              title={member.name}
            >
              <div className="online-member-avatar">
                {member.avatar ? (
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="avatar"
                    style={{ width: 36, height: 36 }}
                  />
                ) : (
                  <div
                    className="avatar avatar-placeholder"
                    style={{ width: 36, height: 36, fontSize: '0.85rem' }}
                  >
                    {member.name?.charAt(0) || 'U'}
                  </div>
                )}
                <span className="online-indicator" />
              </div>
              <span className="online-member-name">{member.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Messages Area */}
      <div className="group-messages">
        {hasMore && messages.length > 0 && (
          <button
            type="button"
            className="load-more-btn"
            onClick={handleLoadOlder}
            disabled={loading}
          >
            {loading ? 'Loading older messages...' : 'Load older messages'}
          </button>
        )}

        {loading && messages.length === 0 && (
          <div className="loading-center">
            <div className="loading-spinner loading-sm" />
          </div>
        )}

        {messages.length === 0 && !loading && (
          <div className="empty-state" style={{ padding: '60px 20px' }}>
            <div className="empty-icon">💬</div>
            <div className="empty-title">Welcome to {neighborhood}!</div>
            <div className="empty-subtitle">
              This is the start of your neighborhood public room. Say hello to your neighbors!
            </div>
          </div>
        )}

        {messages.map((msg, index) => {
          const senderObj = typeof msg.sender === 'object' ? msg.sender : null
          const senderId = senderObj?._id || msg.sender
          const senderName = senderObj?.name || msg.senderName || 'Neighbor'
          const senderAvatar = senderObj?.avatar
          const isSent = senderId === user?._id || senderObj?._id === user?._id

          const prevMsg = index > 0 ? messages[index - 1] : null
          const prevSenderObj = prevMsg && typeof prevMsg.sender === 'object' ? prevMsg.sender : null
          const prevSenderId = prevSenderObj?._id || prevMsg?.sender
          const isFirstInGroup = !prevMsg || prevSenderId !== senderId

          return (
            <div
              key={msg._id || index}
              className={`group-message ${isSent ? 'sent' : 'received'}`}
            >
              {!isSent && (
                isFirstInGroup ? (
                  senderAvatar ? (
                    <img
                      src={senderAvatar}
                      alt={senderName}
                      className="group-message-avatar"
                      onClick={() => navigate(`/profile/${senderId}`)}
                      title={senderName}
                    />
                  ) : (
                    <div
                      className="avatar avatar-placeholder group-message-avatar"
                      onClick={() => navigate(`/profile/${senderId}`)}
                      title={senderName}
                    >
                      {senderName?.charAt(0) || 'U'}
                    </div>
                  )
                ) : (
                  <div style={{ width: 32, flexShrink: 0 }} />
                )
              )}

              <div className="group-message-content">
                {!isSent && isFirstInGroup && (
                  <span
                    className="group-message-sender"
                    onClick={() => navigate(`/profile/${senderId}`)}
                  >
                    {senderName}
                  </span>
                )}
                <div className="group-message-bubble">
                  {msg.content}
                </div>
                <span className="group-message-time">
                  {formatTime(msg.createdAt)}
                </span>
              </div>
            </div>
          )
        })}

        <div ref={bottomRef} />
      </div>

      {/* Typing Indicator */}
      {otherTypingUsers.length > 0 && (
        <div className="typing-indicator">
          <span>{getTypingText(otherTypingUsers)}</span>
          <div className="typing-dots">
            <span />
            <span />
            <span />
          </div>
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSend} className="chat-input-area">
        <input
          type="text"
          className="chat-input"
          placeholder={`Message #${neighborhood}...`}
          value={text}
          onChange={handleInputChange}
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!text.trim() || sending}
        >
          {sending ? 'Sending…' : 'Send ➤'}
        </button>
      </form>
      {sendError && <div role="alert" className="chat-send-error">{sendError}</div>}
    </div>
  )
}

export default GroupChatWindow
