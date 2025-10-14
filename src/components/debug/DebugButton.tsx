import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useAppSelector } from '../../store/hooks';

const { width, height } = Dimensions.get('window');

export const DebugButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const authState = useAppSelector((state) => state.auth);
  const appState = useAppSelector((state) => state.app);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]);
  };

  const testAlert = () => {
    alert('Debug: App is working!');
    addLog('Alert test triggered');
  };

  const testConsole = () => {
    console.log('Debug: Console test from React Native');
    addLog('Console test triggered');
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('Logs cleared');
  };

  return (
    <>
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => {
          setIsVisible(true);
          addLog('Debug panel opened');
        }}
      >
        <Text style={styles.floatingButtonText}>🐛</Text>
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.title}>🐛 Debug Panel</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsVisible(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.content}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>App Status</Text>
                <Text style={styles.infoText}>Screen: {width}x{height}</Text>
                <Text style={styles.infoText}>Auth Loading: {authState.isLoading ? 'Yes' : 'No'}</Text>
                <Text style={styles.infoText}>User: {authState.user ? 'Logged in' : 'Not logged in'}</Text>
                <Text style={styles.infoText}>App Ready: {appState.isReady ? 'Yes' : 'No'}</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Test Actions</Text>
                <TouchableOpacity style={styles.testButton} onPress={testAlert}>
                  <Text style={styles.testButtonText}>Test Alert</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.testButton} onPress={testConsole}>
                  <Text style={styles.testButtonText}>Test Console</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.testButton} onPress={clearLogs}>
                  <Text style={styles.testButtonText}>Clear Logs</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Debug Logs</Text>
                {logs.map((log, index) => (
                  <Text key={index} style={styles.logText}>{log}</Text>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  floatingButtonText: {
    fontSize: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.9,
    height: height * 0.8,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#333',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoText: {
    color: '#ccc',
    fontSize: 12,
    marginBottom: 4,
  },
  testButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  testButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  logText: {
    color: '#0f0',
    fontSize: 10,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
});
