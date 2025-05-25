import { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { Mail, User, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useStore } from '@/store';
import { authenticatedFetch, debugNetworkIssues, testSupabaseConnection } from '@/lib/supabase';
import NetInfo from '@react-native-community/netinfo';

export default function Register() {
  const { register, isLoading } = useStore((state) => state);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  // Monitor network state
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });

    // Check network on mount
    NetInfo.fetch().then(state => {
      setIsConnected(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'Nome é obrigatório';
    if (!formData.email) newErrors.email = 'Email é obrigatório';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email inválido';
    
    if (!formData.password) newErrors.password = 'Senha é obrigatória';
    else if (formData.password.length < 6) newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Confirme sua senha';
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Senhas não coincidem';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    // Check network connectivity first
    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      Alert.alert(
        'Sem Conexão',
        'Verifique sua conexão com a internet e tente novamente.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    setIsSubmitting(true);
    setErrors({});
    
    // Test Supabase connectivity specifically before attempting registration
    const connectionTest = await testSupabaseConnection();
    if (!connectionTest.success) {
      setIsSubmitting(false);
      Alert.alert(
        'Erro de Conexão com o Servidor',
        'Não foi possível conectar ao servidor. ' + connectionTest.message,
        [{ text: 'OK' }]
      );
      return;
    }
    
    try {
      // Create a simpler registration object first to avoid complex objects that might cause serialization issues
      const registrationData = {
        email: formData.email.trim(),
        password: formData.password,
        name: formData.name.trim()
      };
      
      // Use our enhanced fetch with retry logic
      const result = await authenticatedFetch(
        () => register(
          registrationData.email,
          registrationData.password,
          registrationData.name
        ),
        'register'
      );
      
      if (result.error) {
        console.error('Registration error:', result.error);
        
        // Handle specific error types
        if (typeof result.error.message === 'string') {
          if (result.error.message.includes('email')) {
            setErrors({ email: 'Este email já está em uso' });
          } else if (result.error.message.includes('network') || result.error.message.includes('failed')) {
            Alert.alert(
              'Erro de Conexão',
              'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
              [{ text: 'OK' }]
            );
          } else {
            // For other errors, show a more helpful message
            setErrors({ form: result.error.message || 'Erro ao criar conta' });
          }
        } else {
          setErrors({ form: 'Erro desconhecido ao criar conta' });
        }
        return;
      }
      
      if (result.user) {
        // Registration successful
        Alert.alert(
          'Cadastro Realizado',
          'Sua conta foi criada com sucesso!',
          [
            { 
              text: 'Continuar', 
              onPress: () => router.replace('/vehicle-registration') 
            }
          ]
        );
      }
    } catch (err: any) {
      console.error('Unhandled registration error:', err);
      
      // Show a user-friendly error based on the error type
      let errorMessage = 'Ocorreu um erro ao criar sua conta';
      
      if (err.message && typeof err.message === 'string') {
        if (err.message.includes('network') || err.message.includes('connection') || err.message.includes('failed')) {
          errorMessage = 'Falha na conexão. Verifique sua internet e tente novamente.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setErrors({ form: errorMessage });
      
      Alert.alert(
        'Erro no Cadastro',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading while checking auth status
  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Cadastro ValdirCar</Text>
      
      {/* Network status indicator */}
      {isConnected === false && (
        <View style={styles.networkWarning}>
          <Text style={styles.networkWarningText}>
            Sem conexão com a internet. Conecte-se para continuar.
          </Text>
        </View>
      )}
      
      <View style={styles.inputContainer}>
        <View style={styles.inputGroup}>
          <User size={20} color="#666" />
          <TextInput
            style={styles.input}
            placeholder="Nome completo"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            editable={!isSubmitting}
          />
        </View>
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

        <View style={styles.inputGroup}>
          <Mail size={20} color="#666" />
          <TextInput
            style={styles.input}
            placeholder="Email"
            keyboardType="email-address"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            autoCapitalize="none"
            editable={!isSubmitting}
          />
        </View>
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

        <View style={styles.inputGroup}>
          <Lock size={20} color="#666" />
          <TextInput
            style={styles.input}
            placeholder="Senha"
            secureTextEntry={!showPassword}
            value={formData.password}
            onChangeText={(text) => setFormData({ ...formData, password: text })}
            editable={!isSubmitting}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} disabled={isSubmitting}>
            {showPassword ? (
              <EyeOff size={20} color="#666" />
            ) : (
              <Eye size={20} color="#666" />
            )}
          </TouchableOpacity>
        </View>
        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

        <View style={styles.inputGroup}>
          <Lock size={20} color="#666" />
          <TextInput
            style={styles.input}
            placeholder="Confirmar senha"
            secureTextEntry={!showConfirmPassword}
            value={formData.confirmPassword}
            onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
            editable={!isSubmitting}
          />
          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} disabled={isSubmitting}>
            {showConfirmPassword ? (
              <EyeOff size={20} color="#666" />
            ) : (
              <Eye size={20} color="#666" />
            )}
          </TouchableOpacity>
        </View>
        {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
        
        {errors.form && <Text style={styles.errorText}>{errors.form}</Text>}
      </View>

      <TouchableOpacity 
        style={[styles.button, isSubmitting && styles.disabledButton, isConnected === false && styles.disabledButton]} 
        onPress={handleSubmit}
        disabled={isSubmitting || isConnected === false}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Continuar</Text>
        )}
      </TouchableOpacity>
      
      <View style={styles.loginContainer}>
        <Text style={styles.loginText}>Já possui uma conta?</Text>
        <TouchableOpacity onPress={() => router.replace('/login')} disabled={isSubmitting}>
          <Text style={styles.loginLink}>Faça login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    marginBottom: 30,
    marginTop: 40,
    textAlign: 'center',
    color: '#1a1a1a',
  },
  networkWarning: {
    backgroundColor: '#FFF3CD',
    borderColor: '#FFEEBA',
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  networkWarningText: {
    color: '#856404',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 10,
    fontFamily: 'Inter-Regular',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginBottom: 10,
    fontFamily: 'Inter-Regular',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    height: 56,
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  loginText: {
    color: '#666',
    fontFamily: 'Inter-Regular',
  },
  loginLink: {
    color: '#007AFF',
    fontFamily: 'Inter-SemiBold',
    marginLeft: 5,
  },
});