import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useAppDispatch } from '../../store/hooks';
import Icon from 'react-native-vector-icons/Ionicons';

import { logout } from '../../store/slices/authSlice';

const SettingsScreen: React.FC = () => {
  const dispatch = useAppDispatch();

  const handleLogout = () => {
    dispatch(logout());
  };

  const settingsItems = [
    { icon: 'person-outline', title: 'Account', subtitle: 'Privacy, security, change number' },
    { icon: 'chatbubbles-outline', title: 'Chats', subtitle: 'Theme, wallpapers, chat history' },
    { icon: 'notifications-outline', title: 'Notifications', subtitle: 'Message, group & call tones' },
    { icon: 'cloud-outline', title: 'Storage and data', subtitle: 'Network usage, auto-download' },
    { icon: 'help-circle-outline', title: 'Help', subtitle: 'Help center, contact us, privacy policy' },
  ];

  const renderSettingsItem = (item: any, index: number) => (
    <TouchableOpacity key={index} style={styles.settingsItem}>
      <View style={styles.settingsItemLeft}>
        <View style={styles.iconContainer}>
          <Icon name={item.icon} size={24} color="#25D366" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.settingsTitle}>{item.title}</Text>
          <Text style={styles.settingsSubtitle}>{item.subtitle}</Text>
        </View>
      </View>
      <Icon name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>U</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>User Name</Text>
            <Text style={styles.profileStatus}>Hey there! I am using WhatsApp Clone</Text>
          </View>
        </View>

        <View style={styles.settingsSection}>
          {settingsItems.map(renderSettingsItem)}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#075E54',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#f8f8f8',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  profileStatus: {
    fontSize: 14,
    color: '#666',
  },
  settingsSection: {
    backgroundColor: '#fff',
    marginTop: 8,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  settingsSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  logoutButton: {
    margin: 16,
    paddingVertical: 16,
    backgroundColor: '#ff4444',
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettingsScreen;
