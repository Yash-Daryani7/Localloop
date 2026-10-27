import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import eventReducer from './slices/eventSlice'
import listingReducer from './slices/listingSlice'
import serviceReducer from './slices/serviceSlice'
import pollReducer from './slices/pollSlice'
import chatReducer from './slices/chatSlice'
import notificationReducer from './slices/notificationSlice'
import groupChatReducer from './slices/groupChatSlice'

const store = configureStore({
  reducer: {
    auth: authReducer,
    events: eventReducer,
    listings: listingReducer,
    services: serviceReducer,
    polls: pollReducer,
    chat: chatReducer,
    notifications: notificationReducer,
    groupChat: groupChatReducer
  }
})

export default store
