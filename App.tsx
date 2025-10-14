/**
 * Gup Supp - Main App Component
 * A production-ready messaging app built with React Native and TypeScript
 */

import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { store, persistor } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { LoadingScreen } from './src/components/common/LoadingScreen';

const App = (): React.JSX.Element => {
  console.log('🚀 Gup Supp App starting...');
  console.log('📱 React Native version:', require('react-native/package.json').version);
  console.log('🔧 Development mode:', __DEV__);
  
  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingScreen />} persistor={persistor}>
        <SafeAreaProvider>
          <GestureHandlerRootView style={styles.container}>
            <StatusBar
              barStyle="light-content"
              backgroundColor="#075E54"
              translucent={false}
            />
                <View style={styles.container}>
                  <AppNavigator />
                </View>
          </GestureHandlerRootView>
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default App;