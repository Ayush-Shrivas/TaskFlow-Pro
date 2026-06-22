import { createSlice } from '@reduxjs/toolkit';

const initialToken = localStorage.getItem('token') || null;
let initialUser = null;

try {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    initialUser = JSON.parse(storedUser);
  }
} catch (e) {
  console.error('Failed to parse user from localStorage:', e);
  localStorage.removeItem('user');
}

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: initialUser,
    token: initialToken,
    loading: false,
    error: null
  },
  reducers: {
    authStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    authSuccess: (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.error = null;
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    authFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    updateProfile: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('user', JSON.stringify(state.user));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.loading = false;
      state.error = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
});

export const { authStart, authSuccess, authFailure, updateProfile, logout } = authSlice.actions;
export default authSlice.reducer;
