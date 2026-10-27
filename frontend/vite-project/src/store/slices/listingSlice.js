import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../api/axios'

export const fetchListings = createAsyncThunk('listings/fetchAll', async (params = {}, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get('/listings', { params })
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch listings')
  }
})

export const fetchListingById = createAsyncThunk('listings/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get(`/listings/${id}`)
    return res.data.listing
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch listing')
  }
})

export const createListing = createAsyncThunk('listings/create', async (formData, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.post('/listings', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    return res.data.listing
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create listing')
  }
})

export const markSold = createAsyncThunk('listings/markSold', async (id, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.post(`/listings/${id}/sold`)
    return res.data.listing
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to mark as sold')
  }
})

export const deleteListing = createAsyncThunk('listings/delete', async (id, { rejectWithValue }) => {
  try {
    await axiosInstance.delete(`/listings/${id}`)
    return id
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to delete listing')
  }
})

export const expressInterest = createAsyncThunk('listings/interest', async (id, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.post(`/listings/${id}/interest`)
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to express interest')
  }
})

const addListingOnce = (listings, listing) => {
  if (!listing?._id) return
  const existingIndex = listings.findIndex(item => item._id === listing._id)
  if (existingIndex === -1) listings.unshift(listing)
  else listings[existingIndex] = { ...listings[existingIndex], ...listing }
}

const listingSlice = createSlice({
  name: 'listings',
  initialState: { listings: [], currentListing: null, loading: false, error: null },
  reducers: {
    addListing: (state, action) => { addListingOnce(state.listings, action.payload) },
    clearCurrentListing: (state) => { state.currentListing = null }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchListings.pending, (state) => { state.loading = true })
      .addCase(fetchListings.fulfilled, (state, action) => { state.loading = false; state.listings = action.payload.listings })
      .addCase(fetchListings.rejected, (state, action) => { state.loading = false; state.error = action.payload })
      .addCase(fetchListingById.pending, (state) => { state.loading = true })
      .addCase(fetchListingById.fulfilled, (state, action) => { state.loading = false; state.currentListing = action.payload })
      .addCase(fetchListingById.rejected, (state, action) => { state.loading = false; state.error = action.payload })
      .addCase(createListing.fulfilled, (state, action) => { addListingOnce(state.listings, action.payload) })
      .addCase(markSold.fulfilled, (state, action) => {
        const idx = state.listings.findIndex(l => l._id === action.payload._id)
        if (idx !== -1) state.listings[idx] = action.payload
        if (state.currentListing?._id === action.payload._id) state.currentListing = action.payload
      })
      .addCase(deleteListing.fulfilled, (state, action) => { state.listings = state.listings.filter(l => l._id !== action.payload) })
  }
})

export const { addListing, clearCurrentListing } = listingSlice.actions
export const markAsSold = markSold  // alias used by ListingDetail
export default listingSlice.reducer
