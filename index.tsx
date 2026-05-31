import './src/__create/startup-logger';
import 'react-native-url-polyfill/auto';
import './src/__create/polyfills';
global.Buffer = require('buffer').Buffer;

import '@expo/metro-runtime';
import { renderRootComponent } from 'expo-router/build/renderRootComponent';
import { LogBox } from 'react-native';
import App from './entrypoint';

if (__DEV__ || process.env.EXPO_PUBLIC_CREATE_ENV === 'DEVELOPMENT') {
  LogBox.ignoreAllLogs();
  LogBox.uninstall();
}

renderRootComponent(App);
