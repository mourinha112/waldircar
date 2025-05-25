import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { useStore } from '@/store';
import { 
  Camera, 
  Car, 
  Palette, 
  CalendarClock, 
  MapPin as LucideMapPin, 
  Phone,
  HandPlatter as LicensePlate, 
  ChevronDown,
  ImagePlus
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authenticatedFetch, retryOperation } from '@/lib/supabase';
import NetInfo from '@react-native-community/netinfo';

// Get Supabase URL and key from lib/supabase.ts
import { supabaseUrl, supabaseAnonKey } from '@/lib/supabase';

// Car brands with models data
const carBrands = [
  {
    name: 'Toyota',
    models: ['Corolla', 'Camry', 'RAV4', 'Hilux', 'Yaris', 'Etios']
  },
  {
    name: 'Volkswagen',
    models: ['Gol', 'Polo', 'T-Cross', 'Nivus', 'Amarok', 'Virtus', 'Jetta']
  },
  {
    name: 'Chevrolet',
    models: ['Onix', 'Prisma', 'Cruze', 'Tracker', 'S10', 'Spin', 'Cobalt']
  },
  {
    name: 'Honda',
    models: ['Civic', 'City', 'Fit', 'HR-V', 'CR-V', 'WR-V']
  },
  {
    name: 'Ford',
    models: ['Ka', 'Ecosport', 'Ranger', 'Fusion', 'Territory', 'Bronco']
  },
  {
    name: 'Hyundai',
    models: ['HB20', 'Creta', 'Tucson', 'i30', 'Santa Fe', 'Azera']
  },
  {
    name: 'Renault',
    models: ['Kwid', 'Sandero', 'Logan', 'Duster', 'Captur', 'Oroch']
  },
  {
    name: 'Fiat',
    models: ['Uno', 'Mobi', 'Argo', 'Cronos', 'Toro', 'Strada', 'Pulse']
  },
  {
    name: 'Nissan',
    models: ['Versa', 'Sentra', 'Kicks', 'March', 'Frontier']
  },
  {
    name: 'Mitsubishi',
    models: ['L200', 'Pajero', 'ASX', 'Eclipse Cross', 'Outlander']
  }
];

// Car colors
const carColors = [
  'Preto', 'Branco', 'Prata', 'Cinza', 'Vermelho', 
  'Azul', 'Verde', 'Amarelo', 'Marrom', 'Bege'
];

interface VehicleFormData {
  carBrand: string;
  carModel: string;
  carColor: string;
  carYear: string;
  licensePlate: string;
  address: string;
  phone: string;
  carPhoto: string | null;
}

export default function VehicleRegistration() {
  const { user, updateUser, isLoading } = useStore((state) => state);
  const [formData, setFormData] = useState<VehicleFormData>({
    carBrand: user?.carBrand || '',
    carModel: user?.carModel || '',
    carColor: user?.carColor || '',
    carYear: user?.carYear || '',
    licensePlate: user?.licensePlate || '',
    address: user?.address || '',
    phone: user?.phone || '',
    carPhoto: user?.carPhoto || null
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // If no user is authenticated, redirect to login
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/(auth)/login');
    }
  }, [user, isLoading]);

  // Update available models when brand changes
  useEffect(() => {
    if (formData.carBrand) {
      const brand = carBrands.find(b => b.name === formData.carBrand);
      if (brand) {
        setAvailableModels(brand.models);
      } else {
        setAvailableModels([]);
      }
    } else {
      setAvailableModels([]);
    }
  }, [formData.carBrand]);

  // Show loading while checking auth status
  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  const pickImage = async () => {
    try {
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
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setUploadingImage(true);
        
        // Get the local URI of the selected image
        const localUri = result.assets[0].uri;
        
        try {
          console.log('[PHOTO] Using local image URI', localUri);
          
          // Store the local URI directly without trying to upload to Supabase
          // This avoids the RLS policy issues
          setFormData({ ...formData, carPhoto: localUri });
          
          // Also store the image URI in AsyncStorage as a backup
          if (user?.id) {
            const key = `@car_photo_${user.id}`;
            await AsyncStorage.setItem(key, localUri);
            console.log('[PHOTO] Saved image URI to AsyncStorage with key:', key);
          }
          
        } catch (error) {
          console.error('[PHOTO] Error processing image:', error);
          Alert.alert(
            'Erro',
            'Falha ao processar a imagem. Tente novamente.'
          );
        } finally {
          setUploadingImage(false);
        }
      }
    } catch (error) {
      console.error('[PHOTO] Image picker error:', error);
      Alert.alert('Erro', 'Falha ao selecionar imagem');
      setUploadingImage(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.carBrand) newErrors.carBrand = 'Marca do carro é obrigatória';
    if (!formData.carModel) newErrors.carModel = 'Modelo do carro é obrigatório';
    if (!formData.carColor) newErrors.carColor = 'Cor do carro é obrigatória';
    if (!formData.carYear) newErrors.carYear = 'Ano do carro é obrigatório';
    if (!formData.licensePlate) newErrors.licensePlate = 'Placa do carro é obrigatória';
    if (!formData.address) newErrors.address = 'Endereço é obrigatório';
    if (!formData.phone) newErrors.phone = 'Telefone é obrigatório';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      console.log('[VEHICLE] Attempting to update user profile with vehicle info');
      
      // First create a local user object with the new information
      // Map camelCase to snake_case for database compatibility
      const updatedUserData = {
        car_brand: formData.carBrand,      // snake_case for database
        car_model: formData.carModel,      // snake_case for database
        car_color: formData.carColor,      // snake_case for database
        car_year: formData.carYear,        // snake_case for database
        license_plate: formData.licensePlate, // snake_case for database
        address: formData.address,
        phone: formData.phone,
        car_photo: formData.carPhoto || undefined // snake_case for database
      };
      
      // Also keep local camelCase version for the app
      const vehicleData = {
        carBrand: formData.carBrand,
        carModel: formData.carModel,
        carColor: formData.carColor,
        carYear: formData.carYear,
        licensePlate: formData.licensePlate,
        carPhoto: formData.carPhoto
      };
      
      // Save vehicle data to AsyncStorage directly
      if (user?.id) {
        console.log('[VEHICLE] Saving vehicle data to AsyncStorage');
        const vehicleStorageKey = `@vehicle_${user.id}`;
        await AsyncStorage.setItem(vehicleStorageKey, JSON.stringify(vehicleData));
        console.log('[VEHICLE] Vehicle data saved to AsyncStorage');
      }
      
      // Try to update in Supabase
      try {
        await updateUser(updatedUserData);
        console.log('[VEHICLE] Successfully updated user profile in Supabase');
      } catch (updateError) {
        console.error('[VEHICLE] Error updating profile in Supabase:', updateError);
        
        // If Supabase update fails due to RLS, we'll update local storage only
        if (user) {
          const mergedUser = { 
            ...user, 
            // Use camelCase for local storage to match app conventions
            carBrand: formData.carBrand,
            carModel: formData.carModel,
            carColor: formData.carColor,
            carYear: formData.carYear,
            licensePlate: formData.licensePlate,
            address: formData.address,
            phone: formData.phone,
            carPhoto: formData.carPhoto
          };
          await AsyncStorage.setItem('user', JSON.stringify(mergedUser));
          console.log('[VEHICLE] Updated user in local storage as fallback');
        }
      }
      
      // Redirect to dashboard regardless
      router.replace('/(tabs)');
    } catch (error) {
      console.error('[VEHICLE] Error in vehicle registration:', error);
      Alert.alert('Erro', 'Falha ao salvar informações do veículo');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Cadastro de Veículo</Text>
      <Text style={styles.subtitle}>Complete suas informações para continuar</Text>
      
      <View style={styles.photoContainer}>
        {uploadingImage ? (
          <View style={styles.photoPlaceholder}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.photoPlaceholderText}>Carregando imagem...</Text>
          </View>
        ) : formData.carPhoto ? (
          <Image source={{ uri: formData.carPhoto }} style={styles.carPhotoPreview} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Camera size={40} color="#007AFF" />
            <Text style={styles.photoPlaceholderText}>Foto do veículo</Text>
          </View>
        )}
        <TouchableOpacity 
          style={[styles.uploadButton, (uploadingImage || isSubmitting) && styles.disabledButton]} 
          onPress={pickImage}
          disabled={uploadingImage || isSubmitting}
        >
          <ImagePlus size={20} color="#fff" />
          <Text style={styles.uploadButtonText}>Upload</Text>
        </TouchableOpacity>
        {errors.carPhoto && <Text style={styles.errorText}>{errors.carPhoto}</Text>}
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informações do Veículo</Text>
        
        {/* Brand Dropdown */}
        <TouchableOpacity 
          style={styles.dropdownButton} 
          onPress={() => {
            setShowBrandDropdown(!showBrandDropdown);
            setShowModelDropdown(false);
            setShowColorDropdown(false);
          }}
        >
          <Car size={20} color="#666" />
          <Text style={[styles.dropdownButtonText, formData.carBrand ? styles.activeInput : {}]}>
            {formData.carBrand || "Marca do veículo"}
          </Text>
          <ChevronDown size={20} color="#666" />
        </TouchableOpacity>
        {errors.carBrand && <Text style={styles.errorText}>{errors.carBrand}</Text>}
        
        {showBrandDropdown && (
          <View style={styles.dropdownMenu}>
            <ScrollView nestedScrollEnabled={true} style={styles.dropdownScrollView}>
              {carBrands.map((brand, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setFormData({ ...formData, carBrand: brand.name, carModel: '' });
                    setShowBrandDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{brand.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        
        {/* Model Dropdown */}
        <TouchableOpacity 
          style={[styles.dropdownButton, !formData.carBrand ? styles.disabledInput : {}]} 
          onPress={() => {
            if (!formData.carBrand) {
              Alert.alert('Selecione uma marca primeiro');
              return;
            }
            setShowModelDropdown(!showModelDropdown);
            setShowBrandDropdown(false);
            setShowColorDropdown(false);
          }}
          disabled={!formData.carBrand}
        >
          <Car size={20} color={!formData.carBrand ? "#999" : "#666"} />
          <Text style={[
            styles.dropdownButtonText, 
            formData.carModel ? styles.activeInput : {},
            !formData.carBrand ? styles.disabledText : {}
          ]}>
            {formData.carModel || "Modelo do veículo"}
          </Text>
          <ChevronDown size={20} color={!formData.carBrand ? "#999" : "#666"} />
        </TouchableOpacity>
        {errors.carModel && <Text style={styles.errorText}>{errors.carModel}</Text>}
        
        {showModelDropdown && (
          <View style={styles.dropdownMenu}>
            <ScrollView nestedScrollEnabled={true} style={styles.dropdownScrollView}>
              {availableModels.map((model, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setFormData({ ...formData, carModel: model });
                    setShowModelDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{model}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        
        {/* Color Dropdown */}
        <TouchableOpacity 
          style={styles.dropdownButton} 
          onPress={() => {
            setShowColorDropdown(!showColorDropdown);
            setShowBrandDropdown(false);
            setShowModelDropdown(false);
          }}
        >
          <Palette size={20} color="#666" />
          <Text style={[styles.dropdownButtonText, formData.carColor ? styles.activeInput : {}]}>
            {formData.carColor || "Cor do veículo"}
          </Text>
          <ChevronDown size={20} color="#666" />
        </TouchableOpacity>
        {errors.carColor && <Text style={styles.errorText}>{errors.carColor}</Text>}
        
        {showColorDropdown && (
          <View style={styles.dropdownMenu}>
            <ScrollView nestedScrollEnabled={true} style={styles.dropdownScrollView}>
              {carColors.map((color, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setFormData({ ...formData, carColor: color });
                    setShowColorDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{color}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        
        <View style={styles.inputGroup}>
          <CalendarClock size={20} color="#666" />
          <TextInput
            style={styles.input}
            placeholder="Ano do veículo"
            keyboardType="numeric"
            maxLength={4}
            value={formData.carYear}
            onChangeText={(text) => setFormData({ ...formData, carYear: text })}
          />
        </View>
        {errors.carYear && <Text style={styles.errorText}>{errors.carYear}</Text>}
        
        <View style={styles.inputGroup}>
          <LicensePlate size={20} color="#666" />
          <TextInput
            style={styles.input}
            placeholder="Placa do veículo"
            value={formData.licensePlate}
            autoCapitalize="characters"
            onChangeText={(text) => setFormData({ ...formData, licensePlate: text.toUpperCase() })}
          />
        </View>
        {errors.licensePlate && <Text style={styles.errorText}>{errors.licensePlate}</Text>}
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informações de Contato</Text>
        
        <View style={styles.inputGroup}>
          <LucideMapPin size={20} color="#666" />
          <TextInput
            style={styles.input}
            placeholder="Endereço completo"
            value={formData.address}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
          />
        </View>
        {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
        
        <View style={styles.inputGroup}>
          <Phone size={20} color="#666" />
          <TextInput
            style={styles.input}
            placeholder="Telefone"
            keyboardType="phone-pad"
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
          />
        </View>
        {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
      </View>
      
      <TouchableOpacity 
        style={[styles.button, isSubmitting && styles.disabledButton]} 
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Confirmar</Text>
        )}
      </TouchableOpacity>
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
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    fontFamily: 'Inter-Regular',
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    marginTop: 40,
    marginBottom: 8,
    color: '#1a1a1a',
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    marginBottom: 24,
    color: '#666',
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  photoPlaceholder: {
    width: 200,
    height: 150,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  photoPlaceholderText: {
    color: '#666',
    marginTop: 8,
    fontFamily: 'Inter-Regular',
  },
  carPhotoPreview: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: 12,
  },
  uploadButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontFamily: 'Inter-SemiBold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    marginBottom: 16,
    color: '#1a1a1a',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontFamily: 'Inter-Regular',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 16,
  },
  dropdownButtonText: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    color: '#1a1a1a',
  },
  dropdownPlaceholder: {
    color: '#999',
  },
  dropdownMenu: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: -5,
    marginBottom: 15,
    zIndex: 1000,
    maxHeight: 200,
  },
  dropdownScrollView: {
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontFamily: 'Inter-Regular',
    color: '#1a1a1a',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: -12,
    marginBottom: 16,
    fontFamily: 'Inter-Regular',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  disabledButton: {
    opacity: 0.7,
  },
  activeInput: {
    color: '#1a1a1a',
  },
  disabledInput: {
    backgroundColor: '#f8f9fa',
    borderColor: '#eee',
  },
  disabledText: {
    color: '#aaa',
  },
}); 