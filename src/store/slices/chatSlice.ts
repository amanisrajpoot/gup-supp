import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ChatState, Message, Chat } from '../../types/store';
import { chatService } from '../../services/api/chatService';
import { MESSAGE_TYPES } from '../../constants';

// Initial state
const initialState: ChatState = {
  chats: [
    {
      id: 'chat-1',
      name: 'John Doe',
      avatar: 'https://via.placeholder.com/150x150/007AFF/FFFFFF?text=JD',
      lastMessage: 'Hey! How are you?',
      lastMessageTime: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      unreadCount: 2,
      type: 'individual',
      participants: ['demo-user-1', 'user-2'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'chat-2',
      name: 'Family Group',
      avatar: 'https://via.placeholder.com/150x150/34C759/FFFFFF?text=FG',
      lastMessage: 'Mom: Dinner is ready!',
      lastMessageTime: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      unreadCount: 0,
      type: 'group',
      participants: ['demo-user-1', 'user-3', 'user-4', 'user-5'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'chat-3',
      name: 'Sarah Wilson',
      avatar: 'https://via.placeholder.com/150x150/FF3B30/FFFFFF?text=SW',
      lastMessage: 'Thanks for the help!',
      lastMessageTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      unreadCount: 1,
      type: 'individual',
      participants: ['demo-user-1', 'user-6'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  activeChat: null,
  messages: {
    'chat-1': [
      {
        id: 'msg-1',
        chatId: 'chat-1',
        senderId: 'user-2',
        content: 'Hey! How are you?',
        type: 'text',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        status: 'delivered',
        isEncrypted: false,
      },
      {
        id: 'msg-2',
        chatId: 'chat-1',
        senderId: 'demo-user-1',
        content: 'I\'m doing great! Thanks for asking.',
        type: 'text',
        timestamp: new Date(Date.now() - 4 * 60 * 1000),
        status: 'read',
        isEncrypted: false,
      },
    ],
    'chat-2': [
      {
        id: 'msg-3',
        chatId: 'chat-2',
        senderId: 'user-3',
        content: 'Mom: Dinner is ready!',
        type: 'text',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        status: 'delivered',
        isEncrypted: false,
      },
    ],
    'chat-3': [
      {
        id: 'msg-4',
        chatId: 'chat-3',
        senderId: 'user-6',
        content: 'Thanks for the help!',
        type: 'text',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        status: 'delivered',
        isEncrypted: false,
      },
    ],
  },
  typingUsers: {},
  isLoading: false,
  error: null,
};

// Async thunks
export const loadChats = createAsyncThunk(
  'chat/loadChats',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string | null } };
      const token = state.auth.token;
      
      if (!token) {
        throw new Error('No authentication token');
      }
      
      const response = await chatService.getChats(token);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load chats');
    }
  }
);

export const loadMessages = createAsyncThunk(
  'chat/loadMessages',
  async (chatId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string | null } };
      const token = state.auth.token;
      
      if (!token) {
        throw new Error('No authentication token');
      }
      
      const response = await chatService.getMessages(chatId, token);
      return { chatId, messages: response };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load messages');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async (
    { chatId, content, type = MESSAGE_TYPES.TEXT }: { chatId: string; content: string; type?: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as { auth: { token: string | null } };
      const token = state.auth.token;
      
      if (!token) {
        throw new Error('No authentication token');
      }
      
      const response = await chatService.sendMessage(chatId, content, type, token);
      return { chatId, message: response };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to send message');
    }
  }
);

export const markAsRead = createAsyncThunk(
  'chat/markAsRead',
  async (chatId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string | null } };
      const token = state.auth.token;
      
      if (!token) {
        throw new Error('No authentication token');
      }
      
      await chatService.markAsRead(chatId, token);
      return chatId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to mark as read');
    }
  }
);

export const deleteMessage = createAsyncThunk(
  'chat/deleteMessage',
  async (messageId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string | null } };
      const token = state.auth.token;
      
      if (!token) {
        throw new Error('No authentication token');
      }
      
      await chatService.deleteMessage(messageId, token);
      return messageId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete message');
    }
  }
);

export const editMessage = createAsyncThunk(
  'chat/editMessage',
  async (
    { messageId, content }: { messageId: string; content: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as { auth: { token: string | null } };
      const token = state.auth.token;
      
      if (!token) {
        throw new Error('No authentication token');
      }
      
      const response = await chatService.editMessage(messageId, content, token);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to edit message');
    }
  }
);

export const createGroup = createAsyncThunk(
  'chat/createGroup',
  async (
    { name, participants }: { name: string; participants: string[] },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as { auth: { token: string | null } };
      const token = state.auth.token;
      
      if (!token) {
        throw new Error('No authentication token');
      }
      
      const response = await chatService.createGroup(name, participants, token);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create group');
    }
  }
);

// Chat slice
const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveChat: (state, action: PayloadAction<Chat | null>) => {
      state.activeChat = action.payload;
    },
    addMessage: (state, action: PayloadAction<{ chatId: string; message: Message }>) => {
      const { chatId, message } = action.payload;
      if (!state.messages[chatId]) {
        state.messages[chatId] = [];
      }
      state.messages[chatId].push(message);
      
      // Update last message in chat
      const chat = state.chats.find(c => c.id === chatId);
      if (chat) {
        chat.lastMessage = message;
        chat.updatedAt = new Date();
      }
    },
    updateMessage: (state, action: PayloadAction<Message>) => {
      const message = action.payload;
      const chatId = message.chatId;
      
      if (state.messages[chatId]) {
        const index = state.messages[chatId].findIndex(m => m.id === message.id);
        if (index !== -1) {
          state.messages[chatId][index] = message;
        }
      }
    },
    removeMessage: (state, action: PayloadAction<{ chatId: string; messageId: string }>) => {
      const { chatId, messageId } = action.payload;
      
      if (state.messages[chatId]) {
        state.messages[chatId] = state.messages[chatId].filter(m => m.id !== messageId);
      }
    },
    setTyping: (state, action: PayloadAction<{ chatId: string; userId: string; isTyping: boolean }>) => {
      const { chatId, userId, isTyping } = action.payload;
      
      if (!state.typingUsers[chatId]) {
        state.typingUsers[chatId] = [];
      }
      
      if (isTyping) {
        if (!state.typingUsers[chatId].includes(userId)) {
          state.typingUsers[chatId].push(userId);
        }
      } else {
        state.typingUsers[chatId] = state.typingUsers[chatId].filter(id => id !== userId);
      }
    },
    clearTyping: (state, action: PayloadAction<string>) => {
      const chatId = action.payload;
      state.typingUsers[chatId] = [];
    },
    updateChat: (state, action: PayloadAction<Chat>) => {
      const updatedChat = action.payload;
      const index = state.chats.findIndex(c => c.id === updatedChat.id);
      
      if (index !== -1) {
        state.chats[index] = updatedChat;
      } else {
        state.chats.unshift(updatedChat);
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    clearMessages: (state, action: PayloadAction<string>) => {
      const chatId = action.payload;
      state.messages[chatId] = [];
    },
  },
  extraReducers: (builder) => {
    // Load Chats
    builder
      .addCase(loadChats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadChats.fulfilled, (state, action: PayloadAction<Chat[]>) => {
        state.isLoading = false;
        state.chats = action.payload;
        state.error = null;
      })
      .addCase(loadChats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Load Messages
    builder
      .addCase(loadMessages.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadMessages.fulfilled, (state, action: PayloadAction<{ chatId: string; messages: Message[] }>) => {
        state.isLoading = false;
        const { chatId, messages } = action.payload;
        state.messages[chatId] = messages;
        state.error = null;
      })
      .addCase(loadMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Send Message
    builder
      .addCase(sendMessage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action: PayloadAction<{ chatId: string; message: Message }>) => {
        state.isLoading = false;
        const { chatId, message } = action.payload;
        
        if (!state.messages[chatId]) {
          state.messages[chatId] = [];
        }
        state.messages[chatId].push(message);
        
        // Update last message in chat
        const chat = state.chats.find(c => c.id === chatId);
        if (chat) {
          chat.lastMessage = message;
          chat.updatedAt = new Date();
        }
        
        state.error = null;
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Mark as Read
    builder
      .addCase(markAsRead.fulfilled, (state, action: PayloadAction<string>) => {
        const chatId = action.payload;
        const chat = state.chats.find(c => c.id === chatId);
        if (chat) {
          chat.unreadCount = 0;
        }
      });

    // Delete Message
    builder
      .addCase(deleteMessage.fulfilled, (state, action: PayloadAction<string>) => {
        const messageId = action.payload;
        
        // Find and remove message from all chats
        Object.keys(state.messages).forEach(chatId => {
          state.messages[chatId] = state.messages[chatId].filter(m => m.id !== messageId);
        });
      });

    // Edit Message
    builder
      .addCase(editMessage.fulfilled, (state, action: PayloadAction<Message>) => {
        const message = action.payload;
        const chatId = message.chatId;
        
        if (state.messages[chatId]) {
          const index = state.messages[chatId].findIndex(m => m.id === message.id);
          if (index !== -1) {
            state.messages[chatId][index] = message;
          }
        }
      });

    // Create Group
    builder
      .addCase(createGroup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createGroup.fulfilled, (state, action: PayloadAction<Chat>) => {
        state.isLoading = false;
        state.chats.unshift(action.payload);
        state.error = null;
      })
      .addCase(createGroup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setActiveChat,
  addMessage,
  updateMessage,
  removeMessage,
  setTyping,
  clearTyping,
  updateChat,
  clearError,
  clearMessages,
} = chatSlice.actions;

export default chatSlice.reducer;
