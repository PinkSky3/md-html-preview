import './src/__create/startup-logger';
import 'react-native-url-polyfill/auto';
import './src/__create/polyfills';
global.Buffer = require('buffer').Buffer;

import '@expo/metro-runtime';
import { renderRootComponent } from 'expo-router/build/renderRootComponent';
import { AppRegistry, LogBox, Platform } from 'react-native';
import { DeviceErrorBoundaryWrapper } from './__create/DeviceErrorBoundary';
import { initTestFlightLogger } from './__create/testflight-logger';
import App from './entrypoint';
import AnythingMenu from './src/__create/anything-menu';

initTestFlightLogger();

if (__DEV__ || process.env.EXPO_PUBLIC_CREATE_ENV === 'DEVELOPMENT') {
  LogBox.ignoreAllLogs();
  LogBox.uninstall();
}

AppRegistry.setWrapperComponentProvider(() => ({ children }) => {
  return (
    <>
      <DeviceErrorBoundaryWrapper>{children}</DeviceErrorBoundaryWrapper>
      {__DEV__ || process.env.EXPO_PUBLIC_CREATE_ENV === 'DEVELOPMENT' ? <AnythingMenu /> : null}
    </>
  );
});
renderRootComponent(App);
