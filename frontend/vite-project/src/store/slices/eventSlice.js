import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../api/axios'

export const fetchEvents = createAsyncThunk('events/fetchAll', async (params = {}, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get('/events', { params })
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch events')
  }
})

export const fetchEventById = createAsyncThunk('events/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get(`/events/${id}`)
    return res.data.event
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch event')
  }
})

export const createEvent = createAsyncThunk('events/create', async (formData, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.post('/events', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    return res.data.event
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create event')
  }
})

export const rsvpEvent = createAsyncThunk('events/rsvp', async (id, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.post(`/events/${id}/rsvp`)
    return res.data.event
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to RSVP')
  }
})

export const cancelRsvp = createAsyncThunk('events/cancelRsvp', async (id, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.post(`/events/${id}/cancel-rsvp`)
    return res.data.event
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to cancel RSVP')
  }
})

export const updateEvent = createAsyncThunk('events/update', async ({ id, eventData }, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.put(`/events/${id}`, eventData)
    return res.data.event
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update event')
  }
})

export const deleteEvent = createAsyncThunk('events/delete', async (id, { rejectWithValue }) => {
  try {
    await axiosInstance.delete(`/events/${id}`)
    return id
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to delete event')
  }
})

const addEventOnce = (events, event) => {
  if (!event?._id) return
  const existingIndex = events.findIndex(item => item._id === event._id)
  if (existingIndex === -1) events.unshift(event)
  else events[existingIndex] = { ...events[existingIndex], ...event }
}

const uniqueEvents = (events) => {
  const seen = new Set()
  return events.filter(event => {
    const id = event?._id
    if (!id || seen.has(id)) return false
    seen.add(id)
    return true
  })
}

const eventSlice = createSlice({
  name: 'events',
  initialState: { events: [], currentEvent: null, loading: false, error: null, totalPages: 1 },
  reducers: {
    addEvent: (state, action) => { addEventOnce(state.events, action.payload) },
    clearCurrentEvent: (state) => { state.currentEvent = null },
    clearError: (state) => { state.error = null }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvents.pending, (state) => { state.loading = true })
      .addCase(fetchEvents.fulfilled, (state, action) => { state.loading = false; state.events = uniqueEvents(action.payload.events || []); state.totalPages = action.payload.totalPages || 1 })
      .addCase(fetchEvents.rejected, (state, action) => { state.loading = false; state.error = action.payload })
      .addCase(fetchEventById.pending, (state) => { state.loading = true })
      .addCase(fetchEventById.fulfilled, (state, action) => { state.loading = false; state.currentEvent = action.payload })
      .addCase(fetchEventById.rejected, (state, action) => { state.loading = false; state.error = action.payload })
      .addCase(createEvent.fulfilled, (state, action) => { addEventOnce(state.events, action.payload) })
      .addCase(rsvpEvent.fulfilled, (state, action) => {
        state.currentEvent = action.payload
        const idx = state.events.findIndex(e => e._id === action.payload._id)
        if (idx !== -1) state.events[idx] = action.payload
      })
      .addCase(cancelRsvp.fulfilled, (state, action) => {
        state.currentEvent = action.payload
        const idx = state.events.findIndex(e => e._id === action.payload._id)
        if (idx !== -1) state.events[idx] = action.payload
      })
      .addCase(updateEvent.fulfilled, (state, action) => {
        state.currentEvent = action.payload
        const idx = state.events.findIndex(e => e._id === action.payload._id)
        if (idx !== -1) state.events[idx] = action.payload
      })
      .addCase(deleteEvent.fulfilled, (state, action) => { state.events = state.events.filter(e => e._id !== action.payload) })
  }
})

export const { addEvent, clearCurrentEvent, clearError } = eventSlice.actions
export default eventSlice.reducer
