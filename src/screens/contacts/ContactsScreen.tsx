import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types/ui';
import Icon from 'react-native-vector-icons/Ionicons';

import { RootState, AppDispatch } from '../../store';
import { loadContacts, syncContacts, blockContact, unblockContact } from '../../store/slices/contactSlice';
import { Contact } from '../../types/api';

const ContactsScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const dispatch = useAppDispatch();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  
  const { contacts, blockedContacts, isLoading } = useAppSelector((state) => state.contacts);

  useEffect(() => {
    dispatch(loadContacts());
  }, [dispatch]);

  const handleRefresh = useCallback(() => {
    dispatch(loadContacts());
  }, [dispatch]);

  const handleSyncContacts = useCallback(() => {
    // TODO: Get phone numbers from device contacts
    const phoneNumbers: string[] = [];
    dispatch(syncContacts(phoneNumbers));
  }, [dispatch]);

  const handleContactPress = useCallback((contact: Contact) => {
    if (contact.isBlocked) {
      Alert.alert(
        'Blocked Contact',
        'This contact is blocked. Would you like to unblock them?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Unblock', onPress: () => handleUnblockContact(contact.id) },
        ]
      );
    } else {
      // Navigate to chat with this contact
      navigation.navigate('Chat', { 
        chatId: `contact-${contact.id}`, 
        chatName: contact.name 
      });
    }
  }, [navigation]);

  const handleBlockContact = useCallback((contactId: string) => {
    Alert.alert(
      'Block Contact',
      'Are you sure you want to block this contact?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Block', style: 'destructive', onPress: () => dispatch(blockContact(contactId)) },
      ]
    );
  }, [dispatch]);

  const handleUnblockContact = useCallback((contactId: string) => {
    dispatch(unblockContact(contactId));
  }, [dispatch]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setIsSearching(query.length > 0);
    // TODO: Implement search functionality
  }, []);

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phoneNumber.includes(searchQuery)
  );

  const renderContactItem = useCallback(({ item }: { item: Contact }) => (
    <TouchableOpacity
      style={styles.contactItem}
      onPress={() => handleContactPress(item)}
      onLongPress={() => handleBlockContact(item.id)}
    >
      <View style={styles.avatarContainer}>
        <View style={[styles.avatar, item.isBlocked && styles.blockedAvatar]}>
          <Text style={[styles.avatarText, item.isBlocked && styles.blockedAvatarText]}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        {item.isOnline && <View style={styles.onlineIndicator} />}
      </View>
      
      <View style={styles.contactContent}>
        <View style={styles.contactHeader}>
          <Text style={[styles.contactName, item.isBlocked && styles.blockedText]}>
            {item.name}
          </Text>
          {item.isBlocked && (
            <Icon name="ban" size={16} color="#ff4444" />
          )}
        </View>
        
        <Text style={[styles.phoneNumber, item.isBlocked && styles.blockedText]}>
          {item.phoneNumber}
        </Text>
        
        {item.lastSeen && !item.isBlocked && (
          <Text style={styles.lastSeen}>
            Last seen {formatLastSeen(item.lastSeen)}
          </Text>
        )}
      </View>
      
      <TouchableOpacity
        style={styles.moreButton}
        onPress={() => handleBlockContact(item.id)}
      >
        <Icon name="ellipsis-vertical" size={20} color="#666" />
      </TouchableOpacity>
    </TouchableOpacity>
  ), [handleContactPress, handleBlockContact]);

  const formatLastSeen = (lastSeen: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - new Date(lastSeen).getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'recently';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else {
      return `${Math.floor(diffInHours / 24)} days ago`;
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="people-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No Contacts</Text>
      <Text style={styles.emptySubtitle}>
        Sync your phone contacts to get started
      </Text>
      <TouchableOpacity style={styles.syncButton} onPress={handleSyncContacts}>
        <Text style={styles.syncButtonText}>Sync Contacts</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Contacts</Text>
        <TouchableOpacity style={styles.syncButton} onPress={handleSyncContacts}>
          <Icon name="sync-outline" size={24} color="#25D366" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search-outline" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={handleSearch}
          placeholder="Search contacts..."
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Icon name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredContacts}
        keyExtractor={(item) => item.id}
        renderItem={renderContactItem}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            colors={['#25D366']}
            tintColor="#25D366"
          />
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={filteredContacts.length === 0 ? styles.emptyContainer : undefined}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#075E54',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  syncButton: {
    padding: 8,
  },
  syncButtonText: {
    color: '#25D366',
    fontSize: 16,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blockedAvatar: {
    backgroundColor: '#ccc',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  blockedAvatarText: {
    color: '#666',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#25D366',
    borderWidth: 2,
    borderColor: '#fff',
  },
  contactContent: {
    flex: 1,
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  blockedText: {
    color: '#999',
  },
  phoneNumber: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  lastSeen: {
    fontSize: 12,
    color: '#999',
  },
  moreButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
});

export default ContactsScreen;
