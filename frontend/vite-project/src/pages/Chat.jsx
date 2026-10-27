import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchConversations, fetchMessages, setActiveConversation } from '../store/slices/chatSlice'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import ChatWindow from '../components/ChatWindow'
import GroupChatWindow from '../components/GroupChatWindow'
import Avatar from '../components/Avatar'
import axiosInstance from '../api/axios'

function Chat() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { conversations, activeConversation, loading } = useSelector(state => state.chat)
  const { user } = useSelector(state => state.auth)
  const [otherUser, setOtherUser] = useState(null)
  const [activeTab, setActiveTab] = useState(userId ? 'dm' : 'community')

  useEffect(() => {
    dispatch(fetchConversations())
  }, [])

  useEffect(() => {
    if (userId) {
      setActiveTab('dm')
      loadUserAndConv(userId)
    }
  }, [userId])

  const loadUserAndConv = async (uid) => {
    try {
      const res = await axiosInstance.get(`/users/${uid}`)
      const fetchedUser = res.data.user
      setOtherUser(fetchedUser)
      // Build conversationId from sorted user ids
      const convId = [user._id, uid].sort().join('_')
      dispatch(setActiveConversation(convId))
      dispatch(fetchMessages(convId))
    } catch (err) {
      console.error('Failed to load user', err)
    }
  }

  const handleSelectConversation = (conv) => {
    setActiveTab('dm')
    const other = conv.otherUser
    setOtherUser(other)
    dispatch(setActiveConversation(conv.conversationId))
    dispatch(fetchMessages(conv.conversationId))
    navigate(`/chat/${other._id}`)
  }

  const timeAgo = (date) => {
    if (!date) return ''
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'now'
    if (mins < 60) return `${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h`
    return `${Math.floor(hrs / 24)}d`
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content" style={{ display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <div className="chat-layout">
          <div className="chat-sidebar">
            {/* Tab bar at top */}
            <div className="chat-tabs">
              <button
                className={`chat-tab ${activeTab === 'community' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('community')
                  if (userId) navigate('/chat')
                }}
              >
                🌐 Community
              </button>
              <button
                className={`chat-tab ${activeTab === 'dm' ? 'active' : ''}`}
                onClick={() => setActiveTab('dm')}
              >
                💬 Direct
              </button>
            </div>

            {/* Conditional sidebar content */}
            {activeTab === 'community' ? (
              <div className="community-sidebar-info">
                <div style={{ padding: '20px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span className="online-dot" />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Community Chat Room
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Chat with everyone in your neighborhood
                  </div>
                </div>
              </div>
            ) : (
              /* Existing DM conversations list */
              <>
                <div className="chat-sidebar-header">💬 Messages</div>
                {loading && <div className="loading-center"><div className="loading-spinner loading-sm" /></div>}
                {conversations.length === 0 && !loading ? (
                  <div className="empty-state" style={{ padding: 24 }}>
                    <div className="empty-icon">💬</div>
                    <div className="empty-title" style={{ fontSize: '0.9rem' }}>No conversations yet</div>
                    <div className="empty-subtitle" style={{ fontSize: '0.8rem' }}>Start chatting by visiting a neighbor's profile</div>
                  </div>
                ) : (
                  conversations.map(conv => (
                    <div
                      key={conv.conversationId}
                      className={`conversation-item ${activeConversation === conv.conversationId ? 'active' : ''}`}
                      onClick={() => handleSelectConversation(conv)}
                    >
                      <Avatar name={conv.otherUser?.name || 'Neighbor'} src={conv.otherUser?.avatar} style={{ width: 40, height: 40, flexShrink: 0 }} />
                      <div className="conversation-info">
                        <div className="conversation-name">{conv.otherUser?.name || 'Neighbor'}</div>
                        <div className="conversation-last-msg">{conv.lastMessage?.content || 'No messages yet'}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                        <span className="conversation-time">{timeAgo(conv.lastMessage?.createdAt)}</span>
                        {!conv.lastMessage?.read && conv.lastMessage?.receiver === user._id && <div className="unread-dot" />}
                      </div>
                    </div>
                  ))
                )}
              </>
            )}
          </div>

          {/* Main chat area */}
          {activeTab === 'community' ? (
            <GroupChatWindow />
          ) : (
            <ChatWindow otherUser={otherUser} conversationId={activeConversation} />
          )}
        </div>
      </div>
    </div>
  )
}

export default Chat
