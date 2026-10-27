import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../api/axios'

export const fetchGroupMessages = createAsyncThunk(
  'groupChat/fetchGroupMessages',
  async ({ neighborhood, page = 1, limit = 50 }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/group-chat/messages?neighborhood=${neighborhood}&page=${page}&limit=${limit || 50}`)
      const messages = res.data?.messages || (Array.isArray(res.data) ? res.data : [])
      const hasMore = res.data?.hasMore !== undefined ? res.data.hasMore : false
      return { messages, hasMore, page }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch messages')
    }
  }
)

export const sendGroupMessage = createAsyncThunk(
  'groupChat/sendGroupMessage',
  async ({ content, neighborhood }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/group-chat/send', { content, neighborhood })
      return res.data?.message || res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to send message')
    }
  }
)

export const fetchOnlineMembers = createAsyncThunk(
  'groupChat/fetchOnlineMembers',
  async ({ neighborhood }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/group-chat/online?neighborhood=${neighborhood}`)
      return res.data?.onlineMembers || res.data?.members || res.data?.users || (Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch online members')
    }
  }
)

const groupChatSlice = createSlice({
  name: 'groupChat',
  initialState: {
    messages: [],
    onlineMembers: [],
    loading: false,
    hasMore: true,
    page: 1,
    typingUsers: []
  },
  reducers: {
    addGroupMessage: (state, action) => {
      if (!action.payload) return
      const exists = state.messages.find(m => m._id === action.payload._id)
      if (!exists) {
        state.messages.push(action.payload)
      }
    },
    setTypingUser: (state, action) => {
      const name = action.payload
      if (name && !state.typingUsers.includes(name)) {
        state.typingUsers.push(name)
      }
    },
    clearTypingUser: (state, action) => {
      const name = action.payload
      state.typingUsers = state.typingUsers.filter(u => u !== name)
    },
    clearGroupChat: (state) => {
      state.messages = []
      state.page = 1
      state.hasMore = true
      state.typingUsers = []
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchGroupMessages
      .addCase(fetchGroupMessages.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchGroupMessages.fulfilled, (state, action) => {
        state.loading = false
        const { messages, hasMore, page } = action.payload
        if (page === 1) {
          state.messages = messages
        } else {
          const existingIds = new Set(state.messages.map(m => m._id))
          const uniqueOlder = messages.filter(m => !existingIds.has(m._id))
          state.messages = [...uniqueOlder, ...state.messages]
        }
        state.hasMore = hasMore
        state.page = page
      })
      .addCase(fetchGroupMessages.rejected, (state, action) => {
        state.loading = false
      })
      // sendGroupMessage
      .addCase(sendGroupMessage.fulfilled, (state, action) => {
        const msg = action.payload
        if (msg && msg._id) {
          const exists = state.messages.find(m => m._id === msg._id)
          if (!exists) {
            state.messages.push(msg)
          }
        }
      })
      // fetchOnlineMembers
      .addCase(fetchOnlineMembers.fulfilled, (state, action) => {
        state.onlineMembers = Array.isArray(action.payload) ? action.payload : []
      })
  }
})

export const { addGroupMessage, setTypingUser, clearTypingUser, clearGroupChat } = groupChatSlice.actions
export default groupChatSlice.reducer
