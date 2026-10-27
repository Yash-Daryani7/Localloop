import React, { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { sendMessage } from '../store/slices/chatSlice'

function ChatWindow({ otherUser, conversationId }) {
  const dispatch = useDispatch()
  const { user } = useSelector(state => state.auth)
  const { messages, loading } = useSelector(state => state.chat)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const sendingRef = useRef(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    const content = text.trim()
    if (!content || !otherUser || sendingRef.current) return

    sendingRef.current = true
    setSending(true)
    setSendError('')
    try {
      await dispatch(sendMessage({ receiverId: otherUser._id, content })).unwrap()
      setText('')
    } catch (error) {
      setSendError(typeof error === 'string' ? error : 'Failed to send message. Please try again.')
    } finally {
      sendingRef.current = false
      setSending(false)
    }
  }

  const formatTime = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  if (!otherUser) {
    return (
      <div className="chat-window">
        <div className="chat-empty">
          <span style={{ fontSize: '3rem' }}>💬</span>
          <div style={{ fontWeight: 600 }}>Select a conversation</div>
          <div style={{ fontSize: '0.85rem' }}>Choose a neighbor from the list to start chatting</div>
        </div>
      </div>
    )
  }

  return (
    <div className="chat-window">
      <div className="chat-window-header">
        {otherUser.avatar ? (
          <img src={otherUser.avatar} alt={otherUser.name} className="avatar" />
        ) : (
          <div className="avatar avatar-placeholder">{otherUser.name?.charAt(0)}</div>
        )}
        <div>
          <div style={{ fontWeight: 600 }}>{otherUser.name}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>📍 {otherUser.neighborhood}</div>
        </div>
      </div>
      <div className="chat-messages">
        {loading && <div className="loading-center"><div className="loading-spinner loading-sm" /></div>}
        {messages.map(msg => {
          const isSent = msg.sender === user._id || msg.sender?._id === user._id
          return (
            <div key={msg._id} style={{ display: 'flex', flexDirection: 'column', alignItems: isSent ? 'flex-end' : 'flex-start' }}>
              <div className={`message-bubble ${isSent ? 'sent' : 'received'}`}>
                {msg.content}
                <div className="message-time">{formatTime(msg.createdAt)}</div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="chat-input-area">
        <input
          type="text"
          className="chat-input"
          placeholder="Type a message..."
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={!text.trim() || sending}>
          {sending ? 'Sending…' : 'Send ➤'}
        </button>
      </form>
      {sendError && <div role="alert" className="chat-send-error">{sendError}</div>}
    </div>
  )
}

export default ChatWindow
