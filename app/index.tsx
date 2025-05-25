import { Redirect, router } from 'expo-router';
import { useStore } from '@/store';
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const { user } = useStore((state) => state);

  // If no user, redirect to login
  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  // Check for vehicle data
  useEffect(() => {
    const checkVehicleData = async () => {
      try {
        // Check if user has vehicle info in the user object
        if (user?.carBrand && user?.carModel) {
          router.replace('/(tabs)');
          return;
        }

        // Check AsyncStorage for vehicle data
        if (user?.id) {
          const vehicleStorageKey = `@vehicle_${user.id}`;
          const storedVehicleData = await AsyncStorage.getItem(vehicleStorageKey);
          
          if (storedVehicleData) {
            const vehicleData = JSON.parse(storedVehicleData);
            if (vehicleData?.carBrand && vehicleData?.carModel) {
              // Vehicle data exists in AsyncStorage
              router.replace('/(tabs)');
              return;
            }
          }
        }
        
        // No vehicle data found, go to registration
        router.replace('/vehicle-registration');
      } catch (error) {
        console.error('[INDEX] Error checking vehicle data:', error);
        router.replace('/vehicle-registration');
      }
    };

    checkVehicleData();
  }, [user]);

  // Return a loading state while we check
  return null;
}