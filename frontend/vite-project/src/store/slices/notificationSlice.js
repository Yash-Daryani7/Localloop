import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../api/axios'

export const fetchNotifications = createAsyncThunk('notifications/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get('/notifications')
    return res.data.notifications
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch notifications')
  }
})

export const getUnreadCount = createAsyncThunk('notifications/unreadCount', async (_, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get('/notifications/unread-count')
    return res.data.unreadCount
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to get count')
  }
})

export const markAsRead = createAsyncThunk('notifications/markRead', async (id, { rejectWithValue }) => {
  try {
    await axiosInstance.put(`/notifications/${id}/read`)
    return id
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to mark as read')
  }
})

export const markAllAsRead = createAsyncThunk('notifications/markAllRead', async (_, { rejectWithValue }) => {
  try {
    await axiosInstance.put('/notifications/read-all')
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to mark all as read')
  }
})

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: { notifications: [], unreadCount: 0, loading: false },
  reducers: {
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload)
      state.unreadCount += 1
    },
    decrementUnread: (state) => { if (state.unreadCount > 0) state.unreadCount -= 1 }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => { state.loading = true })
      .addCase(fetchNotifications.fulfilled, (state, action) => { state.loading = false; state.notifications = action.payload })
      .addCase(fetchNotifications.rejected, (state) => { state.loading = false })
      .addCase(getUnreadCount.fulfilled, (state, action) => { state.unreadCount = action.payload })
      .addCase(markAsRead.fulfilled, (state, action) => {
        const n = state.notifications.find(n => n._id === action.payload)
        if (n && !n.read) { n.read = true; if (state.unreadCount > 0) state.unreadCount -= 1 }
      })
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.notifications.forEach(n => { n.read = true })
        state.unreadCount = 0
      })
  }
})

export const { addNotification, decrementUnread } = notificationSlice.actions
export default notificationSlice.reducer
