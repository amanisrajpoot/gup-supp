import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppState } from '../../types/store';

// Initial state
const initialState: AppState = {
  isOnline: true,
  isBackground: false,
  currentRoute: '',
  loading: {
    global: false,
    screens: {},
  },
  error: {
    global: null,
    screens: {},
  },
};

// App slice
const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    setBackgroundStatus: (state, action: PayloadAction<boolean>) => {
      state.isBackground = action.payload;
    },
    setCurrentRoute: (state, action: PayloadAction<string>) => {
      state.currentRoute = action.payload;
    },
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.global = action.payload;
    },
    setScreenLoading: (state, action: PayloadAction<{ screen: string; loading: boolean }>) => {
      const { screen, loading } = action.payload;
      state.loading.screens[screen] = loading;
    },
    setGlobalError: (state, action: PayloadAction<string | null>) => {
      state.error.global = action.payload;
    },
    setScreenError: (state, action: PayloadAction<{ screen: string; error: string | null }>) => {
      const { screen, error } = action.payload;
      state.error.screens[screen] = error;
    },
    clearGlobalError: (state) => {
      state.error.global = null;
    },
    clearScreenError: (state, action: PayloadAction<string>) => {
      const screen = action.payload;
      state.error.screens[screen] = null;
    },
    clearAllErrors: (state) => {
      state.error.global = null;
      state.error.screens = {};
    },
    resetApp: () => {
      return initialState;
    },
  },
});

export const {
  setOnlineStatus,
  setBackgroundStatus,
  setCurrentRoute,
  setGlobalLoading,
  setScreenLoading,
  setGlobalError,
  setScreenError,
  clearGlobalError,
  clearScreenError,
  clearAllErrors,
  resetApp,
} = appSlice.actions;

export default appSlice.reducer;
