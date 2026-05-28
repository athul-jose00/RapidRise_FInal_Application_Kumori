import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

const initialState = {
  currentUser: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  accessToken: null,
  refreshToken: null,
  sidebarOpen: true,
  sidebarCollapsed: false,
  hasShownWelcome: false,
};

export const loginUser = createAsyncThunk(
  "user/loginUser",
  async (credentials, thunkAPI) => {
    try {
      const response = await api.post(`/api/auth/login`, credentials);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const registerUser = createAsyncThunk(
  "user/registerUser",
  async (payload, thunkAPI) => {
    try {
      const response = await api.post(`/api/auth/register`, payload);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      return thunkAPI.rejectWithValue(message);
    }
  },
);

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    logoutUser: (state) => {
      state.currentUser = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.sidebarOpen = true;
      state.sidebarCollapsed = false;
      state.hasShownWelcome = false;
    },
    setTokens: (state, action) => {
      const { accessToken, refreshToken } = action.payload || {};
      if (accessToken) state.accessToken = accessToken;
      if (refreshToken) state.refreshToken = refreshToken;
    },
    setWelcomeShown: (state) => {
      state.hasShownWelcome = true;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = !!action.payload;
    },
    toggleSidebarOpen: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarCollapsed: (state, action) => {
      state.sidebarCollapsed = !!action.payload;
    },
    toggleSidebarCollapsed: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        const { user, accessToken, refreshToken } = action.payload;
        state.currentUser = user;
        state.isAuthenticated = true;
        state.loading = false;
        state.error = null;
        state.accessToken = accessToken;
        state.refreshToken = refreshToken;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
        state.currentUser = null;
        state.isAuthenticated = false;
      })
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const {
  logoutUser,
  setTokens,
  setWelcomeShown,
  setSidebarOpen,
  toggleSidebarOpen,
  setSidebarCollapsed,
  toggleSidebarCollapsed,
} = userSlice.actions;

export const selectCurrentUser = (state) => state.user.currentUser;
export const selectIsAuthenticated = (state) => state.user.isAuthenticated;
export const selectAccessToken = (state) => state.user.accessToken;

export default userSlice.reducer;
