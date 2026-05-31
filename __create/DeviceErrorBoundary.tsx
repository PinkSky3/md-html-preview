import { SplashScreen } from 'expo-router/build/exports';
import React, { type ReactNode, useCallback, useEffect } from 'react';
import { NativeModules, Platform, View } from 'react-native';
import { Button, SharedErrorBoundary } from './SharedErrorBoundary';

type ErrorBoundaryState = { hasError: boolean; error: unknown | null };

const DeviceErrorBoundary = ({
  errorMessage,
}: {
  errorMessage?: string;
}) => {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);
  const handleReload = useCallback(async () => {
    if (Platform.OS === 'web') {
      window.location.reload();
      return;
    }

    try {
      const DevSettings = NativeModules.DevSettings;
      if (DevSettings?.reload) {
        DevSettings.reload();
      }
    } catch {
      // No reload available in production build
    }
  }, []);
  return (
    <SharedErrorBoundary
      isOpen
      description={`${errorMessage ? `\n\n${errorMessage}` : 'It looks like an error occurred while trying to use your app.'}`}
    >
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button color="primary" onPress={handleReload}>
          Restart app
        </Button>
      </View>
    </SharedErrorBoundary>
  );
};

export class DeviceErrorBoundaryWrapper extends React.Component<
  {
    children: ReactNode;
  },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { hasError: true, error };
  }
  componentDidCatch(error: unknown, errorInfo: React.ErrorInfo): void {
    this.setState({ error });
  }

  render() {
    if (this.state.hasError) {
      const errMsg = this.state.error instanceof Error ? this.state.error.message : undefined;
      return <DeviceErrorBoundary errorMessage={errMsg} />;
    }
    return this.props.children;
  }
}
