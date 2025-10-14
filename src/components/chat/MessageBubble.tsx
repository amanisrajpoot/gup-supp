import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import { Message } from '../../types/api';
import { MESSAGE_STATUS } from '../../constants';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  onReply?: () => void;
  onForward?: () => void;
  onDelete?: () => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  showAvatar = false,
  onPress,
  onLongPress,
  onReply,
  onForward,
  onDelete,
}) => {
  const getStatusIcon = () => {
    switch (message.status) {
      case MESSAGE_STATUS.SENDING:
        return <Icon name="time-outline" size={12} color="#999" />;
      case MESSAGE_STATUS.SENT:
        return <Icon name="checkmark" size={12} color="#999" />;
      case MESSAGE_STATUS.DELIVERED:
        return <Icon name="checkmark-done" size={12} color="#999" />;
      case MESSAGE_STATUS.READ:
        return <Icon name="checkmark-done" size={12} color="#25D366" />;
      default:
        return null;
    }
  };

  const formatTime = (timestamp: Date) => {
    const messageTime = new Date(timestamp);
    return messageTime.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderMessageContent = () => {
    switch (message.type) {
      case 'text':
        return (
          <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
            {message.content}
          </Text>
        );
      case 'image':
        return (
          <View style={styles.mediaContainer}>
            <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
              📷 Image
            </Text>
          </View>
        );
      case 'video':
        return (
          <View style={styles.mediaContainer}>
            <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
              🎥 Video
            </Text>
          </View>
        );
      case 'audio':
        return (
          <View style={styles.mediaContainer}>
            <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
              🎵 Audio
            </Text>
          </View>
        );
      case 'document':
        return (
          <View style={styles.mediaContainer}>
            <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
              📄 Document
            </Text>
          </View>
        );
      case 'location':
        return (
          <View style={styles.mediaContainer}>
            <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
              📍 Location
            </Text>
          </View>
        );
      default:
        return (
          <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
            {message.content}
          </Text>
        );
    }
  };

  return (
    <Pressable
      style={[styles.container, isOwn && styles.ownContainer]}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <View style={[styles.bubble, isOwn && styles.ownBubble]}>
        {message.replyTo && (
          <View style={[styles.replyContainer, isOwn && styles.ownReplyContainer]}>
            <View style={styles.replyLine} />
            <Text style={[styles.replyText, isOwn && styles.ownReplyText]}>
              Replying to message
            </Text>
          </View>
        )}
        
        {renderMessageContent()}
        
        {message.isEdited && (
          <Text style={[styles.editedText, isOwn && styles.ownEditedText]}>
            (edited)
          </Text>
        )}
        
        <View style={[styles.footer, isOwn && styles.ownFooter]}>
          <Text style={[styles.timeText, isOwn && styles.ownTimeText]}>
            {formatTime(message.timestamp)}
          </Text>
          {isOwn && (
            <View style={styles.statusContainer}>
              {getStatusIcon()}
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 2,
    alignItems: 'flex-start',
  },
  ownContainer: {
    alignItems: 'flex-end',
  },
  bubble: {
    maxWidth: '80%',
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ownBubble: {
    backgroundColor: '#dcf8c6',
  },
  replyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingLeft: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#25D366',
  },
  ownReplyContainer: {
    borderLeftColor: '#075E54',
  },
  replyLine: {
    width: 2,
    height: 20,
    backgroundColor: '#25D366',
    marginRight: 8,
  },
  ownReplyLine: {
    backgroundColor: '#075E54',
  },
  replyText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  ownReplyText: {
    color: '#666',
  },
  messageText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#333',
  },
  mediaContainer: {
    marginVertical: 4,
  },
  editedText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
  },
  ownEditedText: {
    color: '#999',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  ownFooter: {
    justifyContent: 'flex-end',
  },
  timeText: {
    fontSize: 12,
    color: '#666',
  },
  ownTimeText: {
    color: '#666',
  },
  statusContainer: {
    marginLeft: 4,
  },
});
