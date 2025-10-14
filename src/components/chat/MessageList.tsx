import React, { useCallback, useMemo } from 'react';
import {
  FlatList,
  View,
  StyleSheet,
  RefreshControl,
  ListRenderItem,
} from 'react-native';

import { Message } from '../../types/api';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';

interface MessageListProps {
  messages: Message[];
  typingUsers: string[];
  currentUserId: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onMessagePress?: (message: Message) => void;
  onMessageLongPress?: (message: Message) => void;
  onReply?: (message: Message) => void;
  onForward?: (message: Message) => void;
  onDelete?: (message: Message) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  typingUsers,
  currentUserId,
  onRefresh,
  isRefreshing = false,
  onMessagePress,
  onMessageLongPress,
  onReply,
  onForward,
  onDelete,
}) => {
  const renderMessage: ListRenderItem<Message> = useCallback(({ item }) => {
    const isOwn = item.senderId === currentUserId;
    
    return (
      <MessageBubble
        message={item}
        isOwn={isOwn}
        onPress={() => onMessagePress?.(item)}
        onLongPress={() => onMessageLongPress?.(item)}
        onReply={() => onReply?.(item)}
        onForward={() => onForward?.(item)}
        onDelete={() => onDelete?.(item)}
      />
    );
  }, [currentUserId, onMessagePress, onMessageLongPress, onReply, onForward, onDelete]);

  const renderTypingIndicator = useCallback(() => {
    if (typingUsers.length === 0) return null;
    
    return (
      <TypingIndicator
        isVisible={true}
        typingUsers={typingUsers}
      />
    );
  }, [typingUsers]);

  const keyExtractor = useCallback((item: Message) => item.id, []);

  const getItemLayout = useCallback((data: any, index: number) => {
    // Approximate item height for better performance
    const itemHeight = 60;
    return {
      length: itemHeight,
      offset: itemHeight * index,
      index,
    };
  }, []);

  const ListFooterComponent = useMemo(() => {
    return renderTypingIndicator;
  }, [renderTypingIndicator]);

  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [messages]);

  return (
    <FlatList
      data={sortedMessages}
      keyExtractor={keyExtractor}
      renderItem={renderMessage}
      getItemLayout={getItemLayout}
      ListFooterComponent={ListFooterComponent}
      contentContainerStyle={styles.container}
      style={styles.list}
      inverted
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#25D366']}
            tintColor="#25D366"
          />
        ) : undefined
      }
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={10}
      initialNumToRender={20}
      updateCellsBatchingPeriod={50}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  list: {
    flex: 1,
    backgroundColor: '#e5ddd5',
  },
});
