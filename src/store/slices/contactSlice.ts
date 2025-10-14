import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ContactState, Contact } from '../../types/store';
import { contactService } from '../../services/api/contactService';

// Initial state
const initialState: ContactState = {
  contacts: [],
  blockedContacts: [],
  isLoading: false,
  error: null,
};

// Async thunks
export const loadContacts = createAsyncThunk(
  'contacts/loadContacts',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string | null } };
      const token = state.auth.token;
      
      if (!token) {
        throw new Error('No authentication token');
      }
      
      const response = await contactService.getContacts(token);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load contacts');
    }
  }
);

export const syncContacts = createAsyncThunk(
  'contacts/syncContacts',
  async (phoneNumbers: string[], { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string | null } };
      const token = state.auth.token;
      
      if (!token) {
        throw new Error('No authentication token');
      }
      
      const response = await contactService.syncContacts(phoneNumbers, token);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to sync contacts');
    }
  }
);

export const blockContact = createAsyncThunk(
  'contacts/blockContact',
  async (contactId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string | null } };
      const token = state.auth.token;
      
      if (!token) {
        throw new Error('No authentication token');
      }
      
      await contactService.blockContact(contactId, token);
      return contactId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to block contact');
    }
  }
);

export const unblockContact = createAsyncThunk(
  'contacts/unblockContact',
  async (contactId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string | null } };
      const token = state.auth.token;
      
      if (!token) {
        throw new Error('No authentication token');
      }
      
      await contactService.unblockContact(contactId, token);
      return contactId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to unblock contact');
    }
  }
);

export const searchContacts = createAsyncThunk(
  'contacts/searchContacts',
  async (query: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string | null } };
      const token = state.auth.token;
      
      if (!token) {
        throw new Error('No authentication token');
      }
      
      const response = await contactService.searchContacts(query, token);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to search contacts');
    }
  }
);

// Contact slice
const contactSlice = createSlice({
  name: 'contacts',
  initialState,
  reducers: {
    addContact: (state, action: PayloadAction<Contact>) => {
      const contact = action.payload;
      const existingIndex = state.contacts.findIndex(c => c.id === contact.id);
      
      if (existingIndex !== -1) {
        state.contacts[existingIndex] = contact;
      } else {
        state.contacts.push(contact);
      }
    },
    updateContact: (state, action: PayloadAction<Contact>) => {
      const updatedContact = action.payload;
      const index = state.contacts.findIndex(c => c.id === updatedContact.id);
      
      if (index !== -1) {
        state.contacts[index] = updatedContact;
      }
    },
    removeContact: (state, action: PayloadAction<string>) => {
      const contactId = action.payload;
      state.contacts = state.contacts.filter(c => c.id !== contactId);
    },
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Load Contacts
    builder
      .addCase(loadContacts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadContacts.fulfilled, (state, action: PayloadAction<Contact[]>) => {
        state.isLoading = false;
        state.contacts = action.payload;
        state.error = null;
      })
      .addCase(loadContacts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Sync Contacts
    builder
      .addCase(syncContacts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(syncContacts.fulfilled, (state, action: PayloadAction<Contact[]>) => {
        state.isLoading = false;
        // Merge new contacts with existing ones
        action.payload.forEach(newContact => {
          const existingIndex = state.contacts.findIndex(c => c.id === newContact.id);
          if (existingIndex !== -1) {
            state.contacts[existingIndex] = newContact;
          } else {
            state.contacts.push(newContact);
          }
        });
        state.error = null;
      })
      .addCase(syncContacts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Block Contact
    builder
      .addCase(blockContact.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(blockContact.fulfilled, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        const contactId = action.payload;
        
        if (!state.blockedContacts.includes(contactId)) {
          state.blockedContacts.push(contactId);
        }
        
        // Update contact status
        const contact = state.contacts.find(c => c.id === contactId);
        if (contact) {
          contact.isBlocked = true;
        }
        
        state.error = null;
      })
      .addCase(blockContact.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Unblock Contact
    builder
      .addCase(unblockContact.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(unblockContact.fulfilled, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        const contactId = action.payload;
        
        state.blockedContacts = state.blockedContacts.filter(id => id !== contactId);
        
        // Update contact status
        const contact = state.contacts.find(c => c.id === contactId);
        if (contact) {
          contact.isBlocked = false;
        }
        
        state.error = null;
      })
      .addCase(unblockContact.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Search Contacts
    builder
      .addCase(searchContacts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchContacts.fulfilled, (state, action: PayloadAction<Contact[]>) => {
        state.isLoading = false;
        // For search, we might want to store results separately
        // For now, we'll just clear the error
        state.error = null;
      })
      .addCase(searchContacts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  addContact,
  updateContact,
  removeContact,
  clearError,
  setLoading,
} = contactSlice.actions;

export default contactSlice.reducer;
