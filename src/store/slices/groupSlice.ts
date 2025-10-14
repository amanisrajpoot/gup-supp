import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { GroupState, Group } from '../../types/store';
import { groupService } from '../../services/api/groupService';

// Initial state
const initialState: GroupState = {
  groups: [],
  isLoading: false,
  error: null,
};

// Async thunks
export const loadGroups = createAsyncThunk(
  'groups/loadGroups',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string | null } };
      const token = state.auth.token;
      
      if (!token) {
        throw new Error('No authentication token');
      }
      
      const response = await groupService.getGroups(token);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load groups');
    }
  }
);

export const createGroup = createAsyncThunk(
  'groups/createGroup',
  async (
    { name, description, participants }: { name: string; description?: string; participants: string[] },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as { auth: { token: string | null } };
      const token = state.auth.token;
      
      if (!token) {
        throw new Error('No authentication token');
      }
      
      const response = await groupService.createGroup(name, description, participants, token);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create group');
    }
  }
);

export const updateGroup = createAsyncThunk(
  'groups/updateGroup',
  async (
    { groupId, updates }: { groupId: string; updates: Partial<Group> },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as { auth: { token: string | null } };
      const token = state.auth.token;
      
      if (!token) {
        throw new Error('No authentication token');
      }
      
      const response = await groupService.updateGroup(groupId, updates, token);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update group');
    }
  }
);

export const addToGroup = createAsyncThunk(
  'groups/addToGroup',
  async (
    { groupId, userIds }: { groupId: string; userIds: string[] },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as { auth: { token: string | null } };
      const token = state.auth.token;
      
      if (!token) {
        throw new Error('No authentication token');
      }
      
      const response = await groupService.addToGroup(groupId, userIds, token);
      return { groupId, participants: response };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to add members to group');
    }
  }
);

export const removeFromGroup = createAsyncThunk(
  'groups/removeFromGroup',
  async (
    { groupId, userId }: { groupId: string; userId: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as { auth: { token: string | null } };
      const token = state.auth.token;
      
      if (!token) {
        throw new Error('No authentication token');
      }
      
      await groupService.removeFromGroup(groupId, userId, token);
      return { groupId, userId };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to remove member from group');
    }
  }
);

export const leaveGroup = createAsyncThunk(
  'groups/leaveGroup',
  async (groupId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string | null } };
      const token = state.auth.token;
      
      if (!token) {
        throw new Error('No authentication token');
      }
      
      await groupService.leaveGroup(groupId, token);
      return groupId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to leave group');
    }
  }
);

export const deleteGroup = createAsyncThunk(
  'groups/deleteGroup',
  async (groupId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string | null } };
      const token = state.auth.token;
      
      if (!token) {
        throw new Error('No authentication token');
      }
      
      await groupService.deleteGroup(groupId, token);
      return groupId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete group');
    }
  }
);

// Group slice
const groupSlice = createSlice({
  name: 'groups',
  initialState,
  reducers: {
    addGroup: (state, action: PayloadAction<Group>) => {
      const group = action.payload;
      const existingIndex = state.groups.findIndex(g => g.id === group.id);
      
      if (existingIndex !== -1) {
        state.groups[existingIndex] = group;
      } else {
        state.groups.push(group);
      }
    },
    updateGroupLocal: (state, action: PayloadAction<Group>) => {
      const updatedGroup = action.payload;
      const index = state.groups.findIndex(g => g.id === updatedGroup.id);
      
      if (index !== -1) {
        state.groups[index] = updatedGroup;
      }
    },
    removeGroup: (state, action: PayloadAction<string>) => {
      const groupId = action.payload;
      state.groups = state.groups.filter(g => g.id !== groupId);
    },
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Load Groups
    builder
      .addCase(loadGroups.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadGroups.fulfilled, (state, action: PayloadAction<Group[]>) => {
        state.isLoading = false;
        state.groups = action.payload;
        state.error = null;
      })
      .addCase(loadGroups.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create Group
    builder
      .addCase(createGroup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createGroup.fulfilled, (state, action: PayloadAction<Group>) => {
        state.isLoading = false;
        state.groups.unshift(action.payload);
        state.error = null;
      })
      .addCase(createGroup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update Group
    builder
      .addCase(updateGroup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateGroup.fulfilled, (state, action: PayloadAction<Group>) => {
        state.isLoading = false;
        const updatedGroup = action.payload;
        const index = state.groups.findIndex(g => g.id === updatedGroup.id);
        
        if (index !== -1) {
          state.groups[index] = updatedGroup;
        }
        state.error = null;
      })
      .addCase(updateGroup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Add to Group
    builder
      .addCase(addToGroup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addToGroup.fulfilled, (state, action: PayloadAction<{ groupId: string; participants: string[] }>) => {
        state.isLoading = false;
        const { groupId, participants } = action.payload;
        const group = state.groups.find(g => g.id === groupId);
        
        if (group) {
          group.participantIds = participants;
          group.updatedAt = new Date();
        }
        state.error = null;
      })
      .addCase(addToGroup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Remove from Group
    builder
      .addCase(removeFromGroup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeFromGroup.fulfilled, (state, action: PayloadAction<{ groupId: string; userId: string }>) => {
        state.isLoading = false;
        const { groupId, userId } = action.payload;
        const group = state.groups.find(g => g.id === groupId);
        
        if (group) {
          group.participantIds = group.participantIds.filter(id => id !== userId);
          group.updatedAt = new Date();
        }
        state.error = null;
      })
      .addCase(removeFromGroup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Leave Group
    builder
      .addCase(leaveGroup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(leaveGroup.fulfilled, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        const groupId = action.payload;
        state.groups = state.groups.filter(g => g.id !== groupId);
        state.error = null;
      })
      .addCase(leaveGroup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Delete Group
    builder
      .addCase(deleteGroup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteGroup.fulfilled, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        const groupId = action.payload;
        state.groups = state.groups.filter(g => g.id !== groupId);
        state.error = null;
      })
      .addCase(deleteGroup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  addGroup,
  updateGroupLocal,
  removeGroup,
  clearError,
  setLoading,
} = groupSlice.actions;

export default groupSlice.reducer;
