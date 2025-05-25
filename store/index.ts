import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserData {
  id?: string;
  // Account info
  email?: string;
  name?: string;
  
  // Vehicle info (camelCase for the app)
  carBrand?: string;
  carModel?: string;
  carColor?: string;
  carYear?: string;
  licensePlate?: string;
  carPhoto?: string;
  
  // Vehicle info (snake_case for the database)
  car_brand?: string;
  car_model?: string;
  car_color?: string;
  car_year?: string;
  license_plate?: string;
  car_photo?: string;
  
  // Contact info
  address?: string;
  phone?: string;
  location?: string;
  
  // Subscription
  selectedPlan?: string;
  
  // Timestamps
  created_at?: string;
  updated_at?: string;
  
  // Allow indexing with string
  [key: string]: any;
}

interface User extends UserData {}

interface State {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User) => void;
  updateUser: (userData: Partial<UserData>) => Promise<{ error: any | null }>;
  logout: () => Promise<{ error: any | null }>;
  login: (email: string, password: string) => Promise<{ error: any | null }>;
  register: (email: string, password: string, name: string) => Promise<{ error: any | null, user: User | null }>;
}

// Web fallback for SecureStore
const webStorage = {
  getItemAsync: (key: string): Promise<string | null> => {
    const item = localStorage.getItem(key);
    return Promise.resolve(item);
  },
  setItemAsync: (key: string, value: string): Promise<void> => {
    localStorage.setItem(key, value);
    return Promise.resolve();
  },
  deleteItemAsync: (key: string): Promise<void> => {
    localStorage.removeItem(key);
    return Promise.resolve();
  },
};

// Use SecureStore on native platforms, localStorage on web
const storage = Platform.OS === 'web' ? webStorage : SecureStore;

export const useStore = create<State>((set, get) => {
  // Initialize store
  const initializeStore = async () => {
    set({ isLoading: true });
    
    // Check for existing session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      // Get user profile from database
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (profile) {
        // Try to load vehicle data from AsyncStorage
        let vehicleData = {};
        try {
          // Sanitize user ID for SecureStore key
          const sanitizedUserId = session.user.id.replace(/[^a-zA-Z0-9._-]/g, '_');
          const vehicleStorageKey = `vehicle_${sanitizedUserId}`;
          const storedVehicleData = await storage.getItemAsync(vehicleStorageKey);
          
          if (storedVehicleData) {
            vehicleData = JSON.parse(storedVehicleData);
            console.log('[STORE] Loaded vehicle data from storage');
          } else if (profile.car_brand) {
            // If no AsyncStorage data but profile has vehicle data, convert from snake_case
            vehicleData = {
              carBrand: profile.car_brand,
              carModel: profile.car_model,
              carColor: profile.car_color,
              carYear: profile.car_year,
              licensePlate: profile.license_plate,
              carPhoto: profile.car_photo
            };
            console.log('[STORE] Converted vehicle data from database');
            
            // Save to AsyncStorage for future use
            await storage.setItemAsync(vehicleStorageKey, JSON.stringify(vehicleData));
          }
        } catch (e) {
          console.error('[STORE] Error loading vehicle data:', e);
        }
        
        set({
          user: {
            id: session.user.id,
            email: session.user.email,
            ...profile,
            ...vehicleData
          },
          isLoading: false
        });
      } else {
        // Try to load vehicle data from AsyncStorage even without profile
        let vehicleData = {};
        try {
          // Sanitize user ID for SecureStore key
          const sanitizedUserId = session.user.id.replace(/[^a-zA-Z0-9._-]/g, '_');
          const vehicleStorageKey = `vehicle_${sanitizedUserId}`;
          const storedVehicleData = await storage.getItemAsync(vehicleStorageKey);
          
          if (storedVehicleData) {
            vehicleData = JSON.parse(storedVehicleData);
            console.log('[STORE] Loaded vehicle data from storage');
          }
        } catch (e) {
          console.error('[STORE] Error loading vehicle data:', e);
        }
        
        set({
          user: {
            id: session.user.id,
            email: session.user.email,
            ...vehicleData
          },
          isLoading: false
        });
      }
    } else {
      set({ user: null, isLoading: false });
    }
  };

  // Call initialize once when creating the store
  initializeStore();

  return {
    user: null,
    isLoading: true,
    
    // Set full user object
    setUser: async (user) => {
      await storage.setItemAsync('user', JSON.stringify(user));
      set({ user });
    },
    
    // Update user profile
    updateUser: async (userData: Partial<UserData>) => {
      const currentUser = get().user;
      
      if (currentUser?.id) {
        try {
          console.log('[UPDATE_USER] Attempting to update profile in Supabase');
          
          // Preparar dados para atualização na tabela profiles
          const profileData: any = {};
          
          // Mapear todos os campos para a tabela profiles
          if (userData.name) profileData.name = userData.name;
          if (userData.email) profileData.email = userData.email;
          if (userData.phone) profileData.phone = userData.phone;
          if (userData.address) profileData.address = userData.address;
          if (userData.location) profileData.location = userData.location;
          if (userData.selectedPlan) profileData.selected_plan = userData.selectedPlan;
          
          // Dados do veículo
          if (userData.carBrand) profileData.car_brand = userData.carBrand;
          if (userData.carModel) profileData.car_model = userData.carModel;
          if (userData.carColor) profileData.car_color = userData.carColor;
          if (userData.carYear) profileData.car_year = userData.carYear;
          if (userData.licensePlate) profileData.license_plate = userData.licensePlate;
          if (userData.carPhoto) profileData.car_photo = userData.carPhoto;
          
          // Versões snake_case (se enviadas diretamente)
          if (userData.car_brand) profileData.car_brand = userData.car_brand;
          if (userData.car_model) profileData.car_model = userData.car_model;
          if (userData.car_color) profileData.car_color = userData.car_color;
          if (userData.car_year) profileData.car_year = userData.car_year;
          if (userData.license_plate) profileData.license_plate = userData.license_plate;
          if (userData.car_photo) profileData.car_photo = userData.car_photo;
          
          // Marcar o registro como completo se tiver dados do veículo
          if (userData.carBrand || userData.car_brand) {
            profileData.registration_complete = true;
          }
          
          console.log('[UPDATE_USER] Updating profile data:', profileData);
          
          // Usar método direto com fetch para atualizar o perfil
          // Isso contorna problemas com RLS e configurações do Supabase
          try {
            // Obter token de autenticação atual
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            
            if (!token) {
              throw new Error('No authentication token found');
            }
            
            // Verificar se o perfil já existe
            const checkResponse = await fetch(
              `https://jwiylwnwzifaenvdmnbq.supabase.co/rest/v1/profiles?id=eq.${encodeURIComponent(currentUser.id)}&select=id`,
              {
                method: 'GET',
                headers: {
                  'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3aXlsd253emlmYWVudmRtbmJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NzIyMDQsImV4cCI6MjA2MzQ0ODIwNH0.dNhfG_rgcIYxY6d7zqQ7Yhr8MKp4ZwPZ4Ajm2oMumF4',
                  'Authorization': `Bearer ${token}`
                }
              }
            );
            
            const profileExists = (await checkResponse.json()).length > 0;
            console.log('[UPDATE_USER] Profile exists:', profileExists);
            
            // Adicionar campos adicionais dependendo se é criação ou atualização
            if (!profileExists) {
              profileData.id = currentUser.id;
              profileData.created_at = new Date().toISOString();
            }
            
            profileData.updated_at = new Date().toISOString();
            
            // Fazer a requisição para criar ou atualizar o perfil
            const method = profileExists ? 'PATCH' : 'POST';
            const url = `https://jwiylwnwzifaenvdmnbq.supabase.co/rest/v1/profiles${profileExists ? `?id=eq.${encodeURIComponent(currentUser.id)}` : ''}`;
            
            console.log(`[UPDATE_USER] Sending ${method} request to ${url}`);
            
            const response = await fetch(url, {
              method: method,
              headers: {
                'Content-Type': 'application/json',
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3aXlsd253emlmYWVudmRtbmJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NzIyMDQsImV4cCI6MjA2MzQ0ODIwNH0.dNhfG_rgcIYxY6d7zqQ7Yhr8MKp4ZwPZ4Ajm2oMumF4',
                'Authorization': `Bearer ${token}`,
                'Prefer': 'return=minimal'
              },
              body: JSON.stringify(profileData)
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error(`[UPDATE_USER] Failed to ${profileExists ? 'update' : 'create'} profile:`, response.status, errorText);
              throw new Error(`Failed to ${profileExists ? 'update' : 'create'} profile: ${errorText}`);
            }
            
            console.log(`[UPDATE_USER] Successfully ${profileExists ? 'updated' : 'created'} profile`);
          } catch (fetchError) {
            console.error('[UPDATE_USER] Fetch error:', fetchError);
            
            // Mesmo com erro, continuamos para salvar localmente
            console.log('[UPDATE_USER] Continuing to save data locally despite server error');
          }
          
          // Store all user data locally regardless of server success
          const localUserData = {
            ...currentUser,
            ...userData,
            updated_at: new Date().toISOString()
          };
          
          await storage.setItemAsync('user', JSON.stringify(localUserData));
          set({ user: localUserData });
          
          return { error: null };
        } catch (error) {
          console.error('[UPDATE_USER] Unexpected error:', error);
          return { error };
        }
      } else {
        console.error('[UPDATE_USER] No current user found');
        return { error: new Error('No current user found') };
      }
    },
    
    // Logout user
    logout: async () => {
      try {
        // First clear local storage
        if (Platform.OS === 'web') {
          localStorage.clear();
        } else {
          const keys = await AsyncStorage.getAllKeys();
          await AsyncStorage.multiRemove(keys);
        }
        
        // Then sign out from Supabase
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error('[LOGOUT] Error signing out:', error);
          throw error;
        }
        
        set({ user: null });
        return { error: null };
      } catch (err) {
        console.error('[LOGOUT] Error during logout:', err);
        return { error: err };
      }
    },
    
    // Login user
    login: async (email, password) => {
      try {
        console.log('[LOGIN] Attempting to login user:', email);
        
        // Try to sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          console.error('[LOGIN] Authentication error:', error);
          return { error };
        }
        
        if (!data.user || !data.session) {
          console.error('[LOGIN] No user or session returned');
          return { error: new Error('Login failed: No user data returned') };
        }
        
        console.log('[LOGIN] User authenticated successfully');
        
        // Get user profile from database
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        if (profileError && !profileError.message.includes('No rows found')) {
          console.error('[LOGIN] Error fetching user profile:', profileError);
          // We continue even if profile fetch fails - will try to create it
        }
        
        // Check for admin/mechanic role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .eq('is_active', true)
          .single();
        
        // Try to load vehicle data from AsyncStorage
        let vehicleData = {};
        try {
          // Sanitize user ID for SecureStore key
          const sanitizedUserId = data.user.id.replace(/[^a-zA-Z0-9._-]/g, '_');
          const vehicleStorageKey = `vehicle_${sanitizedUserId}`;
          const storedVehicleData = await storage.getItemAsync(vehicleStorageKey);
          
          if (storedVehicleData) {
            vehicleData = JSON.parse(storedVehicleData);
            console.log('[LOGIN] Loaded vehicle data from storage');
          } else if (profile?.car_brand) {
            // If no AsyncStorage data but profile has vehicle data, convert from snake_case
            vehicleData = {
              carBrand: profile.car_brand,
              carModel: profile.car_model,
              carColor: profile.car_color,
              carYear: profile.car_year,
              licensePlate: profile.license_plate,
              carPhoto: profile.car_photo
            };
            console.log('[LOGIN] Converted vehicle data from database');
            
            // Save to AsyncStorage for future use
            await storage.setItemAsync(vehicleStorageKey, JSON.stringify(vehicleData));
          }
        } catch (e) {
          console.error('[LOGIN] Error loading vehicle data:', e);
        }
        
        // Set user in state
        const userData = {
          id: data.user.id,
          email: data.user.email,
          role: roleData?.role || null,
          ...profile,
          ...vehicleData
        };
        
        set({
          user: userData,
          isLoading: false
        });
        
        return { error: null };
      } catch (err) {
        console.error('[LOGIN] Unexpected error during login:', err);
        return { error: err };
      }
    },
    
    // Register user
    register: async (email, password, name) => {
      try {
        console.log('[REGISTER] Starting registration process for email:', email);
        
        // First, sign up the user
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name,
              email: email
            }
          }
        });
        
        console.log('[REGISTER] Auth response received', error ? 'with error' : 'successfully');
        
        if (error) {
          console.error('[REGISTER] Registration error:', error.message);
          return { error, user: null };
        }
        
        if (data.user) {
          console.log('[REGISTER] User created, ID:', data.user.id);
          
          // Criar o perfil do usuário usando fetch direto para evitar problemas com RLS
          try {
            // Obter token de autenticação atual
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            
            if (token) {
              const profileData = {
                id: data.user.id,
                email: email,
                name: name,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              
              console.log('[REGISTER] Creating profile with data:', profileData);
              
              const response = await fetch('https://jwiylwnwzifaenvdmnbq.supabase.co/rest/v1/profiles', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3aXlsd253emlmYWVudmRtbmJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NzIyMDQsImV4cCI6MjA2MzQ0ODIwNH0.dNhfG_rgcIYxY6d7zqQ7Yhr8MKp4ZwPZ4Ajm2oMumF4',
                  'Authorization': `Bearer ${token}`,
                  'Prefer': 'return=minimal'
                },
                body: JSON.stringify(profileData)
              });
              
              if (!response.ok) {
                console.error('[REGISTER] Failed to create profile:', await response.text());
              } else {
                console.log('[REGISTER] Profile created successfully');
              }
            } else {
              console.warn('[REGISTER] No token available to create profile');
            }
          } catch (profileError) {
            console.error('[REGISTER] Error creating profile:', profileError);
          }
          
          // Criar objeto de usuário local
          const user = {
            id: data.user.id,
            email: data.user.email,
            name
          };
          
          console.log('[REGISTER] Creating local user object:', JSON.stringify(user));
          await storage.setItemAsync('user', JSON.stringify(user));
          set({ user });
          
          return { error: null, user };
        }
        
        return { error: new Error('User registration failed'), user: null };
      } catch (err) {
        console.error('[REGISTER] Unexpected error during registration:', err);
        return { error: err, user: null };
      }
    },
  };
});