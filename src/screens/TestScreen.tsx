import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ScrollView,
  Platform,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export const TestScreen: React.FC = () => {
  const [counter, setCounter] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]);
  };

  useEffect(() => {
    addLog('TestScreen mounted');
    addLog(`Screen size: ${width}x${height}`);
    addLog('React Native is working!');
  }, []);

  const handlePress = () => {
    setCounter(prev => prev + 1);
    addLog(`Button pressed! Counter: ${counter + 1}`);
  };

  const showAlert = () => {
    Alert.alert('Test Alert', 'This confirms the app is working!');
    addLog('Alert shown');
  };

  const testConsole = () => {
    console.log('Test console log from React Native');
    addLog('Console log sent');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎉 Gup Supp Test Screen</Text>
        <Text style={styles.subtitle}>App is working!</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>App Information</Text>
          <Text style={styles.infoText}>Screen Size: {width} x {height}</Text>
          <Text style={styles.infoText}>Platform: {Platform.OS}</Text>
          <Text style={styles.infoText}>Development Mode: {__DEV__ ? 'Yes' : 'No'}</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={handlePress}>
            <Text style={styles.buttonText}>Press Me! ({counter})</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.alertButton]} onPress={showAlert}>
            <Text style={styles.buttonText}>Show Alert</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.consoleButton]} onPress={testConsole}>
            <Text style={styles.buttonText}>Test Console</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.logsContainer}>
          <Text style={styles.logsTitle}>Debug Logs:</Text>
          {logs.map((log, index) => (
            <Text key={index} style={styles.logText}>{log}</Text>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#075E54',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#128C7E',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#E0F2F1',
  },
  content: {
    padding: 20,
  },
  infoBox: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#666',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#25D366',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  alertButton: {
    backgroundColor: '#FF6B6B',
  },
  consoleButton: {
    backgroundColor: '#4ECDC4',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logsContainer: {
    backgroundColor: '#000',
    padding: 12,
    borderRadius: 8,
    maxHeight: 200,
  },
  logsTitle: {
    color: '#0f0',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  logText: {
    color: '#0f0',
    fontSize: 10,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
});
