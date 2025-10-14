import { useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { webSocketService } from '../services/websocket/WebSocketService';
import { RootState } from '../store';
import { WebSocketMessage, TypingIndicator, ReadReceipt } from '../types/api';

export const useWebSocket = () => {
  const { token, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const isConnectedRef = useRef(false);

  const connect = useCallback(async () => {
    if (token && isAuthenticated && !isConnectedRef.current) {
      try {
        await webSocketService.connect(token);
        isConnectedRef.current = true;
        console.log('WebSocket connected successfully');
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
      }
    }
  }, [token, isAuthenticated]);

  const disconnect = useCallback(() => {
    if (isConnectedRef.current) {
      webSocketService.disconnect();
      isConnectedRef.current = false;
      console.log('WebSocket disconnected');
    }
  }, []);

  const sendMessage = useCallback((chatId: string, message: any) => {
    webSocketService.sendMessage(chatId, message);
  }, []);

  const sendTyping = useCallback((chatId: string, isTyping: boolean) => {
    webSocketService.sendTyping(chatId, isTyping);
  }, []);

  const sendReadReceipt = useCallback((messageId: string, chatId: string) => {
    webSocketService.sendReadReceipt(messageId, chatId);
  }, []);

  const updateUserStatus = useCallback((status: 'online' | 'offline' | 'away') => {
    webSocketService.updateUserStatus(status);
  }, []);

  useEffect(() => {
    if (isAuthenticated && token) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, token, connect, disconnect]);

  return {
    isConnected: webSocketService.connected,
    sendMessage,
    sendTyping,
    sendReadReceipt,
    updateUserStatus,
    connect,
    disconnect,
  };
};

export const useWebSocketMessage = (
  onMessage?: (message: WebSocketMessage) => void,
  onTyping?: (typing: TypingIndicator) => void,
  onReadReceipt?: (receipt: ReadReceipt) => void,
) => {
  const onMessageRef = useRef(onMessage);
  const onTypingRef = useRef(onTyping);
  const onReadReceiptRef = useRef(onReadReceipt);

  useEffect(() => {
    onMessageRef.current = onMessage;
    onTypingRef.current = onTyping;
    onReadReceiptRef.current = onReadReceipt;
  }, [onMessage, onTyping, onReadReceipt]);

  useEffect(() => {
    const handleMessage = (data: WebSocketMessage) => {
      onMessageRef.current?.(data);
    };

    const handleTyping = (data: TypingIndicator) => {
      onTypingRef.current?.(data);
    };

    const handleReadReceipt = (data: ReadReceipt) => {
      onReadReceiptRef.current?.(data);
    };

    webSocketService.addEventListener('message', handleMessage);
    webSocketService.addEventListener('typing', handleTyping);
    webSocketService.addEventListener('read_receipt', handleReadReceipt);

    return () => {
      webSocketService.removeEventListener('message', handleMessage);
      webSocketService.removeEventListener('typing', handleTyping);
      webSocketService.removeEventListener('read_receipt', handleReadReceipt);
    };
  }, []);
};
