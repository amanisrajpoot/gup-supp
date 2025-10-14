import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import { MESSAGE_TYPES } from '../../constants';

interface ChatInputProps {
  onSendMessage: (message: string, type: string) => void;
  onTyping: (isTyping: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onTyping,
  placeholder = 'Type a message...',
  disabled = false,
  maxLength = 4096,
}) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleTextChange = (text: string) => {
    setMessage(text);

    // Handle typing indicator
    if (text.length > 0 && !isTyping) {
      setIsTyping(true);
      onTyping(true);
    }

    // Clear typing indicator after 2 seconds of no typing
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTyping(false);
    }, 2000);
  };

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage.length === 0) return;

    onSendMessage(trimmedMessage, MESSAGE_TYPES.TEXT);
    setMessage('');
    
    // Clear typing indicator
    if (isTyping) {
      setIsTyping(false);
      onTyping(false);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleAttachImage = () => {
    Alert.alert(
      'Attach Image',
      'Choose an option',
      [
        { text: 'Camera', onPress: () => console.log('Open camera') },
        { text: 'Gallery', onPress: () => console.log('Open gallery') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleAttachDocument = () => {
    Alert.alert(
      'Attach Document',
      'Choose a document type',
      [
        { text: 'PDF', onPress: () => console.log('Attach PDF') },
        { text: 'Word', onPress: () => console.log('Attach Word') },
        { text: 'Other', onPress: () => console.log('Attach other') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleRecordAudio = () => {
    Alert.alert('Record Audio', 'Audio recording feature coming soon');
  };

  const handleLocation = () => {
    Alert.alert('Share Location', 'Location sharing feature coming soon');
  };

  const canSend = message.trim().length > 0 && !disabled;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            value={message}
            onChangeText={handleTextChange}
            placeholder={placeholder}
            placeholderTextColor="#999"
            multiline
            maxLength={maxLength}
            editable={!disabled}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          
          <View style={styles.attachmentContainer}>
            <TouchableOpacity
              style={styles.attachButton}
              onPress={handleAttachImage}
              disabled={disabled}
            >
              <Icon name="camera-outline" size={24} color="#666" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.attachButton}
              onPress={handleAttachDocument}
              disabled={disabled}
            >
              <Icon name="document-outline" size={24} color="#666" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.attachButton}
              onPress={handleRecordAudio}
              disabled={disabled}
            >
              <Icon name="mic-outline" size={24} color="#666" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.attachButton}
              onPress={handleLocation}
              disabled={disabled}
            >
              <Icon name="location-outline" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
        
        <TouchableOpacity
          style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!canSend}
        >
          <Icon 
            name="send" 
            size={20} 
            color={canSend ? "#fff" : "#ccc"} 
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 4,
    maxHeight: 80,
  },
  attachmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachButton: {
    padding: 4,
    marginLeft: 4,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
});
