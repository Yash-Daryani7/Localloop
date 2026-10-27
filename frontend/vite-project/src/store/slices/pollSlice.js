import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../api/axios'

export const fetchPolls = createAsyncThunk('polls/fetchAll', async (params = {}, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get('/polls', { params })
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch polls')
  }
})

export const fetchPollById = createAsyncThunk('polls/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get(`/polls/${id}`)
    return res.data.poll
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch poll')
  }
})

export const createPoll = createAsyncThunk('polls/create', async (data, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.post('/polls', data)
    return res.data.poll
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create poll')
  }
})

export const votePoll = createAsyncThunk('polls/vote', async ({ pollId, optionIndex }, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.post(`/polls/${pollId}/vote`, { optionIndex })
    return res.data.poll
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to vote')
  }
})

export const deletePoll = createAsyncThunk('polls/delete', async (id, { rejectWithValue }) => {
  try {
    await axiosInstance.delete(`/polls/${id}`)
    return id
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to delete poll')
  }
})

const addPollOnce = (polls, poll) => {
  if (!poll?._id) return
  const existingIndex = polls.findIndex(item => item._id === poll._id)
  if (existingIndex === -1) polls.unshift(poll)
  else polls[existingIndex] = { ...polls[existingIndex], ...poll }
}

const pollSlice = createSlice({
  name: 'polls',
  initialState: { polls: [], currentPoll: null, loading: false, error: null },
  reducers: {
    addPoll: (state, action) => { addPollOnce(state.polls, action.payload) },
    updatePoll: (state, action) => {
      const idx = state.polls.findIndex(p => p._id === action.payload._id)
      if (idx !== -1) state.polls[idx] = action.payload
      if (state.currentPoll?._id === action.payload._id) state.currentPoll = action.payload
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPolls.pending, (state) => { state.loading = true })
      .addCase(fetchPolls.fulfilled, (state, action) => { state.loading = false; state.polls = action.payload.polls })
      .addCase(fetchPolls.rejected, (state, action) => { state.loading = false; state.error = action.payload })
      .addCase(fetchPollById.fulfilled, (state, action) => { state.currentPoll = action.payload })
      .addCase(createPoll.fulfilled, (state, action) => { addPollOnce(state.polls, action.payload) })
      .addCase(votePoll.fulfilled, (state, action) => {
        const idx = state.polls.findIndex(p => p._id === action.payload._id)
        if (idx !== -1) state.polls[idx] = action.payload
        if (state.currentPoll?._id === action.payload._id) state.currentPoll = action.payload
      })
      .addCase(deletePoll.fulfilled, (state, action) => { state.polls = state.polls.filter(p => p._id !== action.payload) })
  }
})

export const { addPoll, updatePoll } = pollSlice.actions
export default pollSlice.reducer
