import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { SplashScreen } from 'expo-router';
import { useStore } from '@/store';
import { View, Text, StyleSheet, AppState, AppStateStatus, Platform, TouchableOpacity } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { ErrorBoundaryProps } from 'expo-router';

export function ErrorBoundary(props: ErrorBoundaryProps) {
  try {
    // More defensive error handling
    const error = props.error || {} as Record<string, any>;
    const errorMessage = error.message || 'Ocorreu um erro desconhecido';
  
  // Check if it's a context provider error
  const isContextError = 
      typeof errorMessage === 'string' && (
    errorMessage.includes('Context.Provider') ||
        errorMessage.includes('LogBoxStateSubscription')
      );
  
  const handleReset = async () => {
    if (isContextError) {
      try {
        // Force logout for auth errors
        const { logout } = useStore.getState();
        await logout();
      } catch (err) {
        console.error("Error during logout:", err);
      }
    }
    props.retry();
  };
  
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Algo deu errado</Text>
      
      {isContextError ? (
        <>
          <Text style={styles.errorMessage}>
            Ocorreu um erro de autenticação. Por favor, faça login novamente.
          </Text>
          <TouchableOpacity 
            style={styles.errorButton}
            onPress={handleReset}
          >
            <Text style={styles.errorButtonText}>Voltar para o login</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.errorMessage}>{errorMessage}</Text>
          <TouchableOpacity style={styles.errorButton} onPress={props.retry}>
            <Text style={styles.errorButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
  } catch (fallbackError) {
    // Last resort fallback if our error handling itself fails
    console.error('Error in error fallback:', fallbackError);
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Erro crítico</Text>
        <Text style={styles.errorMessage}>
          Um erro ocorreu durante o tratamento de outro erro.
        </Text>
        <TouchableOpacity style={styles.errorButton} onPress={props.retry}>
          <Text style={styles.errorButtonText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

export default function RootLayout() {
  useFrameworkReady();
  
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    'Poppins-Medium': Poppins_500Medium,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
  });

  // Monitor network state
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [connectionInfo, setConnectionInfo] = useState<string>('');
  const [lastError, setLastError] = useState<string>('');

  // Setup network monitoring
  useEffect(() => {
    // Handle network changes
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsConnected(state.isConnected);
      
      const details = [
        `Type: ${state.type}`,
        `Connected: ${state.isConnected}`,
        `Reachable: ${state.isInternetReachable}`
      ].join(', ');
      
      setConnectionInfo(details);
      console.log('[NETWORK] State changed:', details);
    });

    // Check network on start
    NetInfo.fetch().then((state: NetInfoState) => {
      setIsConnected(state.isConnected);
      const details = [
        `Type: ${state.type}`,
        `Connected: ${state.isConnected}`,
        `Reachable: ${state.isInternetReachable}`
      ].join(', ');
      setConnectionInfo(details);
      console.log('[NETWORK] Initial state:', details);
    });

    // Monitor app state to check network when app comes to foreground
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        console.log('[APP] App has come to the foreground, checking network...');
        NetInfo.fetch().then((state: NetInfoState) => {
          setIsConnected(state.isConnected);
          console.log('[NETWORK] Status after resume:', state.isConnected);
        });
      }
    });

    // Setup global error handler
    const errorHandler = (error: ErrorEvent) => {
      console.error('[GLOBAL ERROR]', error.message);
      setLastError(error.message);
    };

    // Add error listener for Web
    if (Platform.OS === 'web') {
      window.addEventListener('error', errorHandler);
    }

    return () => {
      unsubscribe();
      subscription.remove();
      if (Platform.OS === 'web') {
        window.removeEventListener('error', errorHandler);
      }
    };
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/register" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="vehicle-registration" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
      </Stack>
      <StatusBar style="auto" />
      
      {/* Debug Network Status - Only visible in development */}
      {__DEV__ && lastError ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>Error: {lastError}</Text>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  errorBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
    padding: 5,
  },
  errorText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  errorTitle: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: '#333',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});