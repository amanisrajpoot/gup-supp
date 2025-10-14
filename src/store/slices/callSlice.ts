import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { CallState, Call } from '../../types/store';
import { callService } from '../../services/api/callService';
import { callManagementService } from '../../services/calls/CallManagementService';

// Initial state
const initialState: CallState = {
  activeCall: null,
  callHistory: [],
  isLoading: false,
  error: null,
};

// Async thunks
export const initiateCall = createAsyncThunk(
  'calls/initiateCall',
  async (
    { chatId, type }: { chatId: string; type: 'voice' | 'video' },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as { auth: { token: string | null } };
      const token = state.auth.token;
      
      if (!token) {
        throw new Error('No authentication token');
      }
      
      const response = await callService.initiateCall(chatId, type, token);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to initiate call');
    }
  }
);

export const answerCall = createAsyncThunk(
  'calls/answerCall',
  async (callId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string | null } };
      const token = state.auth.token;
      
      if (!token) {
        throw new Error('No authentication token');
      }
      
      const response = await callService.answerCall(callId, token);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to answer call');
    }
  }
);

export const endCall = createAsyncThunk(
  'calls/endCall',
  async (callId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string | null } };
      const token = state.auth.token;
      
      if (!token) {
        throw new Error('No authentication token');
      }
      
      const response = await callService.endCall(callId, token);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to end call');
    }
  }
);

export const rejectCall = createAsyncThunk(
  'calls/rejectCall',
  async (callId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string | null } };
      const token = state.auth.token;
      
      if (!token) {
        throw new Error('No authentication token');
      }
      
      const response = await callService.rejectCall(callId, token);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to reject call');
    }
  }
);

export const muteCall = createAsyncThunk(
  'calls/muteCall',
  async (callId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string | null } };
      const token = state.auth.token;
      
      if (!token) {
        throw new Error('No authentication token');
      }
      
      const response = await callService.muteCall(callId, token);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to mute call');
    }
  }
);

export const unmuteCall = createAsyncThunk(
  'calls/unmuteCall',
  async (callId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string | null } };
      const token = state.auth.token;
      
      if (!token) {
        throw new Error('No authentication token');
      }
      
      const response = await callService.unmuteCall(callId, token);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to unmute call');
    }
  }
);

export const switchCamera = createAsyncThunk(
  'calls/switchCamera',
  async (callId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string | null } };
      const token = state.auth.token;
      
      if (!token) {
        throw new Error('No authentication token');
      }
      
      const response = await callService.switchCamera(callId, token);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to switch camera');
    }
  }
);

export const loadCallHistory = createAsyncThunk(
  'calls/loadCallHistory',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string | null } };
      const token = state.auth.token;
      
      if (!token) {
        throw new Error('No authentication token');
      }
      
      const response = await callService.getCallHistory(token);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load call history');
    }
  }
);

// Call slice
const callSlice = createSlice({
  name: 'calls',
  initialState,
  reducers: {
    setActiveCall: (state, action: PayloadAction<Call | null>) => {
      state.activeCall = action.payload;
    },
    addCallToHistory: (state, action: PayloadAction<Call>) => {
      const call = action.payload;
      const existingIndex = state.callHistory.findIndex(c => c.id === call.id);
      
      if (existingIndex !== -1) {
        state.callHistory[existingIndex] = call;
      } else {
        state.callHistory.unshift(call);
      }
      
      // Keep only last 100 calls
      if (state.callHistory.length > 100) {
        state.callHistory = state.callHistory.slice(0, 100);
      }
    },
    updateCall: (state, action: PayloadAction<Call>) => {
      const updatedCall = action.payload;
      
      // Update active call
      if (state.activeCall && state.activeCall.id === updatedCall.id) {
        state.activeCall = updatedCall;
      }
      
      // Update call history
      const index = state.callHistory.findIndex(c => c.id === updatedCall.id);
      if (index !== -1) {
        state.callHistory[index] = updatedCall;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    clearCallHistory: (state) => {
      state.callHistory = [];
    },
  },
  extraReducers: (builder) => {
    // Initiate Call
    builder
      .addCase(initiateCall.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initiateCall.fulfilled, (state, action: PayloadAction<Call>) => {
        state.isLoading = false;
        state.activeCall = action.payload;
        state.error = null;
      })
      .addCase(initiateCall.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Answer Call
    builder
      .addCase(answerCall.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(answerCall.fulfilled, (state, action: PayloadAction<Call>) => {
        state.isLoading = false;
        state.activeCall = action.payload;
        state.error = null;
      })
      .addCase(answerCall.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // End Call
    builder
      .addCase(endCall.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(endCall.fulfilled, (state, action: PayloadAction<Call>) => {
        state.isLoading = false;
        if (state.activeCall && state.activeCall.id === action.payload.id) {
          state.activeCall = null;
        }
        
        // Add to history
        const call = action.payload;
        const existingIndex = state.callHistory.findIndex(c => c.id === call.id);
        
        if (existingIndex !== -1) {
          state.callHistory[existingIndex] = call;
        } else {
          state.callHistory.unshift(call);
        }
        
        state.error = null;
      })
      .addCase(endCall.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Reject Call
    builder
      .addCase(rejectCall.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(rejectCall.fulfilled, (state, action: PayloadAction<Call>) => {
        state.isLoading = false;
        if (state.activeCall && state.activeCall.id === action.payload.id) {
          state.activeCall = null;
        }
        
        // Add to history
        const call = action.payload;
        const existingIndex = state.callHistory.findIndex(c => c.id === call.id);
        
        if (existingIndex !== -1) {
          state.callHistory[existingIndex] = call;
        } else {
          state.callHistory.unshift(call);
        }
        
        state.error = null;
      })
      .addCase(rejectCall.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Mute Call
    builder
      .addCase(muteCall.fulfilled, (state, action: PayloadAction<Call>) => {
        if (state.activeCall && state.activeCall.id === action.payload.id) {
          state.activeCall = action.payload;
        }
      });

    // Unmute Call
    builder
      .addCase(unmuteCall.fulfilled, (state, action: PayloadAction<Call>) => {
        if (state.activeCall && state.activeCall.id === action.payload.id) {
          state.activeCall = action.payload;
        }
      });

    // Switch Camera
    builder
      .addCase(switchCamera.fulfilled, (state, action: PayloadAction<Call>) => {
        if (state.activeCall && state.activeCall.id === action.payload.id) {
          state.activeCall = action.payload;
        }
      });

    // Load Call History
    builder
      .addCase(loadCallHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadCallHistory.fulfilled, (state, action: PayloadAction<Call[]>) => {
        state.isLoading = false;
        state.callHistory = action.payload;
        state.error = null;
      })
      .addCase(loadCallHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setActiveCall,
  addCallToHistory,
  updateCall,
  clearError,
  setLoading,
  clearCallHistory,
} = callSlice.actions;

export default callSlice.reducer;
