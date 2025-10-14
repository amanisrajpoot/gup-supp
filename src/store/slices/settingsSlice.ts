import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { SettingsState } from '../../types/store';
import { settingsService } from '../../services/api/settingsService';
import { THEMES, FONT_SIZES, MEDIA_DOWNLOAD, PRIVACY_LEVELS } from '../../constants';

// Initial state
const initialState: SettingsState = {
  theme: 'system',
  language: 'en',
  notifications: {
    enabled: true,
    sound: true,
    vibration: true,
    showPreview: true,
  },
  privacy: {
    lastSeen: 'everyone',
    readReceipts: true,
    profilePhoto: 'everyone',
    status: 'everyone',
  },
  chat: {
    fontSize: 'medium',
    enterToSend: true,
    mediaDownload: 'wifi_cellular',
  },
  storage: {
    autoDownload: true,
    clearCache: false,
    backupEnabled: false,
  },
};

// Async thunks
export const loadSettings = createAsyncThunk(
  'settings/loadSettings',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string | null } };
      const token = state.auth.token;
      
      if (!token) {
        throw new Error('No authentication token');
      }
      
      const response = await settingsService.getSettings(token);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load settings');
    }
  }
);

export const updateSettings = createAsyncThunk(
  'settings/updateSettings',
  async (settings: Partial<SettingsState>, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string | null } };
      const token = state.auth.token;
      
      if (!token) {
        throw new Error('No authentication token');
      }
      
      const response = await settingsService.updateSettings(settings, token);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update settings');
    }
  }
);

export const clearCache = createAsyncThunk(
  'settings/clearCache',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string | null } };
      const token = state.auth.token;
      
      if (!token) {
        throw new Error('No authentication token');
      }
      
      await settingsService.clearCache(token);
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to clear cache');
    }
  }
);

export const exportData = createAsyncThunk(
  'settings/exportData',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string | null } };
      const token = state.auth.token;
      
      if (!token) {
        throw new Error('No authentication token');
      }
      
      const response = await settingsService.exportData(token);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to export data');
    }
  }
);

export const importData = createAsyncThunk(
  'settings/importData',
  async (data: any, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string | null } };
      const token = state.auth.token;
      
      if (!token) {
        throw new Error('No authentication token');
      }
      
      const response = await settingsService.importData(data, token);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to import data');
    }
  }
);

// Settings slice
const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
    },
    updateLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
    },
    updateNotifications: (state, action: PayloadAction<Partial<SettingsState['notifications']>>) => {
      state.notifications = { ...state.notifications, ...action.payload };
    },
    updatePrivacy: (state, action: PayloadAction<Partial<SettingsState['privacy']>>) => {
      state.privacy = { ...state.privacy, ...action.payload };
    },
    updateChatSettings: (state, action: PayloadAction<Partial<SettingsState['chat']>>) => {
      state.chat = { ...state.chat, ...action.payload };
    },
    updateStorageSettings: (state, action: PayloadAction<Partial<SettingsState['storage']>>) => {
      state.storage = { ...state.storage, ...action.payload };
    },
    resetSettings: (state) => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    // Load Settings
    builder
      .addCase(loadSettings.pending, (state) => {
        // Keep current state while loading
      })
      .addCase(loadSettings.fulfilled, (state, action: PayloadAction<SettingsState>) => {
        return action.payload;
      })
      .addCase(loadSettings.rejected, (state, action) => {
        // Keep current state on error
        console.warn('Failed to load settings:', action.payload);
      });

    // Update Settings
    builder
      .addCase(updateSettings.pending, (state) => {
        // Keep current state while updating
      })
      .addCase(updateSettings.fulfilled, (state, action: PayloadAction<SettingsState>) => {
        return action.payload;
      })
      .addCase(updateSettings.rejected, (state, action) => {
        // Keep current state on error
        console.warn('Failed to update settings:', action.payload);
      });

    // Clear Cache
    builder
      .addCase(clearCache.pending, (state) => {
        // Keep current state while clearing
      })
      .addCase(clearCache.fulfilled, (state) => {
        // Cache cleared successfully
        state.storage.clearCache = false;
      })
      .addCase(clearCache.rejected, (state, action) => {
        console.warn('Failed to clear cache:', action.payload);
      });

    // Export Data
    builder
      .addCase(exportData.pending, (state) => {
        // Keep current state while exporting
      })
      .addCase(exportData.fulfilled, (state, action) => {
        // Data exported successfully
        console.log('Data exported successfully');
      })
      .addCase(exportData.rejected, (state, action) => {
        console.warn('Failed to export data:', action.payload);
      });

    // Import Data
    builder
      .addCase(importData.pending, (state) => {
        // Keep current state while importing
      })
      .addCase(importData.fulfilled, (state, action: PayloadAction<SettingsState>) => {
        return action.payload;
      })
      .addCase(importData.rejected, (state, action) => {
        console.warn('Failed to import data:', action.payload);
      });
  },
});

export const {
  updateTheme,
  updateLanguage,
  updateNotifications,
  updatePrivacy,
  updateChatSettings,
  updateStorageSettings,
  resetSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;
