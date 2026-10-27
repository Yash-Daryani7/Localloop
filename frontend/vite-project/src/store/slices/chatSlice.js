import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../api/axios'

export const fetchConversations = createAsyncThunk('chat/fetchConversations', async (_, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get('/chat/conversations')
    return res.data.conversations
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch conversations')
  }
})

export const fetchMessages = createAsyncThunk('chat/fetchMessages', async (conversationId, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get(`/chat/${conversationId}`)
    return res.data.messages
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch messages')
  }
})

export const sendMessage = createAsyncThunk('chat/sendMessage', async ({ receiverId, content }, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.post('/chat/send', { receiverId, content })
    return res.data.message
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to send message')
  }
})

const chatSlice = createSlice({
  name: 'chat',
  initialState: { conversations: [], messages: [], activeConversation: null, loading: false, error: null },
  reducers: {
    addMessage: (state, action) => {
      const exists = state.messages.find(m => m._id === action.payload._id)
      if (!exists) state.messages.push(action.payload)
    },
    setActiveConversation: (state, action) => { state.activeConversation = action.payload }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => { state.loading = true })
      .addCase(fetchConversations.fulfilled, (state, action) => { state.loading = false; state.conversations = action.payload })
      .addCase(fetchConversations.rejected, (state, action) => { state.loading = false; state.error = action.payload })
      .addCase(fetchMessages.pending, (state) => { state.loading = true; state.messages = [] })
      .addCase(fetchMessages.fulfilled, (state, action) => { state.loading = false; state.messages = action.payload })
      .addCase(fetchMessages.rejected, (state, action) => { state.loading = false; state.error = action.payload })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const exists = state.messages.find(m => m._id === action.payload._id)
        if (!exists) state.messages.push(action.payload)
      })
  }
})

export const { addMessage, setActiveConversation } = chatSlice.actions
export default chatSlice.reducer
