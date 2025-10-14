import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { useAppSelector } from '../../store/hooks';

const { width, height } = Dimensions.get('window');

export const DebugScreen: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  
  const authState = useAppSelector((state) => state.auth);
  const appState = useAppSelector((state) => state.app);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
  };

  useEffect(() => {
    addLog('DebugScreen mounted');
    addLog(`Screen dimensions: ${width}x${height}`);
    addLog(`Auth state: ${JSON.stringify(authState, null, 2)}`);
    addLog(`App state: ${JSON.stringify(appState, null, 2)}`);
  }, []);

  const testAlert = () => {
    Alert.alert('Debug Test', 'This alert confirms the app is working!');
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

  if (!isVisible) {
    return (
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setIsVisible(true)}
      >
        <Text style={styles.floatingButtonText}>🐛</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
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
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    zIndex: 9999,
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
    zIndex: 10000,
  },
  floatingButtonText: {
    fontSize: 20,
  },
});
