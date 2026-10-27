import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../api/axios'

export const fetchServices = createAsyncThunk('services/fetchAll', async (params = {}, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get('/services', { params })
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch services')
  }
})

export const fetchServiceById = createAsyncThunk('services/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get(`/services/${id}`)
    return res.data.service
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch service')
  }
})

export const createService = createAsyncThunk('services/create', async (data, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.post('/services', data)
    return res.data.service
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create service request')
  }
})

export const respondToService = createAsyncThunk('services/respond', async ({ id, message }, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.post(`/services/${id}/respond`, { message })
    return res.data.service
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to respond')
  }
})

export const closeService = createAsyncThunk('services/close', async (id, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.put(`/services/${id}/close`)
    return res.data.service
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to close service')
  }
})

export const deleteService = createAsyncThunk('services/delete', async (id, { rejectWithValue }) => {
  try {
    await axiosInstance.delete(`/services/${id}`)
    return id
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to delete')
  }
})

const serviceSlice = createSlice({
  name: 'services',
  initialState: { services: [], currentService: null, loading: false, error: null },
  reducers: {
    addService: (state, action) => { state.services.unshift(action.payload) }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchServices.pending, (state) => { state.loading = true })
      .addCase(fetchServices.fulfilled, (state, action) => { state.loading = false; state.services = action.payload.services })
      .addCase(fetchServices.rejected, (state, action) => { state.loading = false; state.error = action.payload })
      .addCase(fetchServiceById.fulfilled, (state, action) => { state.currentService = action.payload })
      .addCase(createService.fulfilled, (state, action) => { state.services.unshift(action.payload) })
      .addCase(respondToService.fulfilled, (state, action) => {
        const idx = state.services.findIndex(s => s._id === action.payload._id)
        if (idx !== -1) state.services[idx] = action.payload
        if (state.currentService?._id === action.payload._id) state.currentService = action.payload
      })
      .addCase(closeService.fulfilled, (state, action) => {
        const idx = state.services.findIndex(s => s._id === action.payload._id)
        if (idx !== -1) state.services[idx] = action.payload
      })
      .addCase(deleteService.fulfilled, (state, action) => { state.services = state.services.filter(s => s._id !== action.payload) })
  }
})

export const { addService } = serviceSlice.actions
export default serviceSlice.reducer
