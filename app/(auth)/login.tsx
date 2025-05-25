import { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Mail, Lock } from 'lucide-react-native';
import { useStore } from '@/store';
import { authenticatedFetch, debugNetworkIssues } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, user, isLoading } = useStore((state) => state);

  // If user is already logged in, redirect to home
  useEffect(() => {
    if (user) {
      checkVehicleRegistration();
    }
  }, [user]);

  // Debug network on component mount
  useEffect(() => {
    debugNetworkIssues();
  }, []);

  // If still checking authentication status, show loading
  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  const checkVehicleRegistration = async () => {
    try {
      // Check if user has vehicle information either in user object or in AsyncStorage
      const hasVehicleInfoInUserObject = user?.carBrand && user?.carModel;
      
      if (hasVehicleInfoInUserObject) {
        router.replace('/(tabs)');
        return;
      }
      
      // Check AsyncStorage as a fallback
      if (user?.id) {
        const vehicleStorageKey = `@vehicle_${user.id}`;
        const storedVehicleData = await AsyncStorage.getItem(vehicleStorageKey);
        
        if (storedVehicleData) {
          const vehicleData = JSON.parse(storedVehicleData);
          if (vehicleData.carBrand && vehicleData.carModel) {
            // Vehicle data exists in AsyncStorage
            console.log('[LOGIN] Found vehicle data in AsyncStorage');
            router.replace('/(tabs)');
            return;
          }
        }
      }
      
      // No vehicle info found, redirect to registration
      console.log('[LOGIN] No vehicle information found, redirecting to registration');
      router.replace('/vehicle-registration');
      
    } catch (error) {
      console.error('[LOGIN] Error checking vehicle data:', error);
      router.replace('/vehicle-registration');
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    setError('');
    setIsSubmitting(true);
    
    try {
      // Test connection before attempting login
      debugNetworkIssues();
      
      // Use the authenticated fetch utility
      const { error: loginError } = await authenticatedFetch(
        () => login(email, password),
        'login'
      );
      
      if (loginError) {
        console.error('Login error:', loginError);
        setError(loginError.message || 'Erro ao fazer login. Verifique suas credenciais.');
      }
    } catch (err: any) {
      setError('Ocorreu um erro ao tentar fazer login. ' + (err.message || ''));
      console.error('Login error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{ uri: 'https://images.pexels.com/photos/3807386/pexels-photo-3807386.jpeg' }}
          style={styles.backgroundImage}
        />
        <View style={styles.overlay} />
        <Text style={styles.title}>ValdirCar</Text>
        <Text style={styles.subtitle}>Sua oficina de confiança</Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <View style={styles.inputGroup}>
            <Mail size={20} color="#666" />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.inputGroup}>
            <Lock size={20} color="#666" />
            <TextInput
              style={styles.input}
              placeholder="Senha"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isSubmitting}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Esqueceu sua senha?</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.loginButton, isSubmitting && styles.disabledButton]} 
            onPress={handleLogin}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Entrar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.registerButton} 
            onPress={() => router.push('/(auth)/register')}
            disabled={isSubmitting}
          >
            <Text style={styles.registerButtonText}>Criar uma conta</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    fontFamily: 'Inter-Regular',
  },
  header: {
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 122, 255, 0.8)',
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 42,
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: -30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
  },
  inputContainer: {
    marginTop: 30,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 56,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginBottom: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  forgotPassword: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#007AFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#007AFF',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  disabledButton: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  registerButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  registerButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});