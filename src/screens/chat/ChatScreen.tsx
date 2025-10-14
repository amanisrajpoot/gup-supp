import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';

import { RootState, AppDispatch } from '../../store';
import { loadMessages, sendMessage, setTyping, clearTyping } from '../../store/slices/chatSlice';
import { Message } from '../../types/api';
import { MESSAGE_TYPES } from '../../constants';
import { MessageList } from '../../components/chat/MessageList';
import { ChatInput } from '../../components/chat/ChatInput';
import { useWebSocket, useWebSocketMessage } from '../../hooks/useWebSocket';

const ChatScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const route = useRoute();
  
  const { chatId } = route.params as { chatId: string; chatName?: string };
  
  const { messages, isLoading, typingUsers } = useSelector((state: RootState) => state.chat);
  const { user } = useSelector((state: RootState) => state.auth);
  const currentMessages = messages[chatId] || [];
  const currentTypingUsers = typingUsers[chatId] || [];

  const { sendMessage: sendWebSocketMessage, sendTyping } = useWebSocket();

  // WebSocket message handlers
  const handleWebSocketMessage = useCallback((data: any) => {
    // Handle incoming messages from WebSocket
    console.log('Received message via WebSocket:', data);
  }, []);

  const handleTypingIndicator = useCallback((data: any) => {
    dispatch(setTyping({
      chatId: data.chatId,
      userId: data.userId,
      isTyping: data.isTyping,
    }));
  }, [dispatch]);

  useWebSocketMessage(handleWebSocketMessage, handleTypingIndicator);

  useEffect(() => {
    if (chatId) {
      dispatch(loadMessages(chatId));
    }
  }, [dispatch, chatId]);

  const handleSendMessage = useCallback(async (messageContent: string, type: string) => {
    try {
      // Send via Redux (which will also send via API)
      await dispatch(sendMessage({
        chatId,
        content: messageContent,
        type,
      })).unwrap();

      // Also send via WebSocket for real-time delivery
      sendWebSocketMessage(chatId, {
        content: messageContent,
        type,
        timestamp: new Date(),
      });
    } catch (error: any) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  }, [dispatch, chatId, sendWebSocketMessage]);

  const handleTyping = useCallback((isTyping: boolean) => {
    if (isTyping) {
      dispatch(setTyping({
        chatId,
        userId: user?.id || 'current-user',
        isTyping: true,
      }));
      sendTyping(chatId, true);
    } else {
      dispatch(clearTyping(chatId));
      sendTyping(chatId, false);
    }
  }, [dispatch, chatId, user?.id, sendTyping]);

  const handleMessagePress = useCallback((message: Message) => {
    // Handle message press (e.g., show message options)
    console.log('Message pressed:', message);
  }, []);

  const handleMessageLongPress = useCallback((message: Message) => {
    // Handle message long press (e.g., show context menu)
    Alert.alert(
      'Message Options',
      'What would you like to do?',
      [
        { text: 'Reply', onPress: () => console.log('Reply to message') },
        { text: 'Forward', onPress: () => console.log('Forward message') },
        { text: 'Delete', onPress: () => console.log('Delete message'), style: 'destructive' },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, []);

  const handleRefresh = useCallback(() => {
    dispatch(loadMessages(chatId));
  }, [dispatch, chatId]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.messagesContainer}>
          <MessageList
            messages={currentMessages}
            typingUsers={currentTypingUsers}
            currentUserId={user?.id || 'current-user'}
            onRefresh={handleRefresh}
            isRefreshing={isLoading}
            onMessagePress={handleMessagePress}
            onMessageLongPress={handleMessageLongPress}
          />
        </View>

        <ChatInput
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          disabled={isLoading}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e5ddd5',
  },
  keyboardView: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
});

export default ChatScreen;
