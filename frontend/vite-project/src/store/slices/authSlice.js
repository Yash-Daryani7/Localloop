import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../api/axios'

export const registerUser = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
  try {
    // Let the browser set the multipart boundary for FormData.
    const res = await axiosInstance.post('/auth/register', data)
    return res.data.user
  } catch (err) {
    return rejectWithValue(
      err.response?.data?.message ||
      (err.request ? 'Unable to reach the server. Check your connection and try again.' : err.message) ||
      'Registration failed'
    )
  }
})

export const loginUser = createAsyncThunk('auth/login', async (data, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.post('/auth/login', data)
    return res.data.user
  } catch (err) {
    return rejectWithValue(
      err.response?.data?.message ||
      (err.request ? 'Unable to reach the server. Check that the backend is running and try again.' : err.message) ||
      'Login failed'
    )
  }
})

export const logoutUser = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await axiosInstance.post('/auth/logout')
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Logout failed')
  }
})

export const getMe = createAsyncThunk('auth/getMe', async (_, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get('/auth/me')
    return res.data.user
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Not authenticated')
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, loading: false, error: null, initialized: false },
  reducers: {
    clearError: (state) => { state.error = null },
    setUser: (state, action) => { state.user = action.payload }
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => { state.loading = true; state.error = null })
      .addCase(registerUser.fulfilled, (state, action) => { state.loading = false; state.user = action.payload })
      .addCase(registerUser.rejected, (state, action) => { state.loading = false; state.error = action.payload })
      .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null })
      .addCase(loginUser.fulfilled, (state, action) => { state.loading = false; state.user = action.payload })
      .addCase(loginUser.rejected, (state, action) => { state.loading = false; state.error = action.payload })
      .addCase(logoutUser.fulfilled, (state) => { state.user = null })
      .addCase(getMe.pending, (state) => { state.loading = true })
      .addCase(getMe.fulfilled, (state, action) => { state.loading = false; state.user = action.payload; state.initialized = true })
      .addCase(getMe.rejected, (state) => { state.loading = false; state.user = null; state.initialized = true })
  }
})

export const { clearError, setUser } = authSlice.actions
export default authSlice.reducer
