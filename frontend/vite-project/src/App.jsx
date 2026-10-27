import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { getMe } from './store/slices/authSlice'
import { addEvent } from './store/slices/eventSlice'
import { addListing } from './store/slices/listingSlice'
import { addService } from './store/slices/serviceSlice'
import { addPoll, updatePoll } from './store/slices/pollSlice'
import { addMessage } from './store/slices/chatSlice'
import { addNotification, getUnreadCount } from './store/slices/notificationSlice'
import { addGroupMessage, setTypingUser, clearTypingUser } from './store/slices/groupChatSlice'
import socket from './socket'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Events from './pages/Events'
import EventDetail from './pages/EventDetail'
import Marketplace from './pages/Marketplace'
import ListingDetail from './pages/ListingDetail'
import Services from './pages/Services'
import Polls from './pages/Polls'
import Chat from './pages/Chat'
import Notifications from './pages/Notifications'
import Profile from './pages/Profile'
import MapView from './pages/MapView'

function App() {
  const dispatch = useDispatch()
  const { user, initialized } = useSelector(state => state.auth)

  useEffect(() => {
    dispatch(getMe())
  }, [])

  useEffect(() => {
    if (user) {
      socket.connect()
      dispatch(getUnreadCount())

      socket.on('receive_message', (message) => {
        dispatch(addMessage(message))
      })
      socket.on('event_created', (event) => {
        dispatch(addEvent(event))
      })
      socket.on('listing_created', (listing) => {
        dispatch(addListing(listing))
      })
      socket.on('service_created', (service) => {
        dispatch(addService(service))
      })
      socket.on('poll_created', (poll) => {
        dispatch(addPoll(poll))
      })
      socket.on('poll_updated', (poll) => {
        dispatch(updatePoll(poll))
      })
      socket.on('new_notification', (notification) => {
        dispatch(addNotification(notification))
      })
      socket.on('receive_group_message', (message) => {
        dispatch(addGroupMessage(message))
      })
      socket.on('user_typing_group', (data) => {
        dispatch(setTypingUser(data.name))
      })
      socket.on('user_stop_typing_group', (data) => {
        dispatch(clearTypingUser(data.name))
      })

      return () => {
        socket.off('receive_message')
        socket.off('event_created')
        socket.off('listing_created')
        socket.off('service_created')
        socket.off('poll_created')
        socket.off('poll_updated')
        socket.off('new_notification')
        socket.off('receive_group_message')
        socket.off('user_typing_group')
        socket.off('user_stop_typing_group')
        socket.disconnect()
      }
    }
  }, [user])

  if (!initialized) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a0a0f' }}>
        <div className="loading-spinner" />
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/home" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/home" replace /> : <Register />} />
      <Route path="/" element={<Navigate to={user ? '/home' : '/login'} replace />} />
      <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
      <Route path="/events/:id" element={<ProtectedRoute><EventDetail /></ProtectedRoute>} />
      <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
      <Route path="/marketplace/:id" element={<ProtectedRoute><ListingDetail /></ProtectedRoute>} />
      <Route path="/services" element={<ProtectedRoute><Services /></ProtectedRoute>} />
      <Route path="/polls" element={<ProtectedRoute><Polls /></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/chat/:userId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/profile/:id" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/map" element={<ProtectedRoute><MapView /></ProtectedRoute>} />
    </Routes>
  )
}

export default App
