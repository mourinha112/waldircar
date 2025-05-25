import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, Modal, ActivityIndicator } from 'react-native';
import { useStore } from '@/store';
import { 
  Bell, 
  MapPin, 
  FileText, 
  Calendar, 
  ShieldCheck, 
  ChevronRight, 
  X,
  Clock,
  Wrench as Tool,
  Star,
  Car,
  Home,
  User,
  Menu
} from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Card {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
}

interface ServiceOrder {
  id: string;
  user_id: string;
  title: string;
  description: string;
  date: string;
  created_at: string;
  [key: string]: any;
}

interface VehicleData {
  carBrand?: string;
  carModel?: string;
  carColor?: string;
  carYear?: string;
  licensePlate?: string;
  carPhoto?: string;
  address?: string;
}

const homeCards: Card[] = [
  { 
    id: 'service-orders', 
    title: 'Ordens de Serviço', 
    icon: FileText,
    color: '#FF6B6B',
    description: 'Relatórios e histórico de manutenções do seu veículo',
  },
  { 
    id: 'scheduling', 
    title: 'Agendar', 
    icon: Calendar,
    color: '#45B7D1',
    description: 'Agende sua próxima visita à oficina',
  },
  { 
    id: 'plans', 
    title: 'Planos', 
    icon: ShieldCheck,
    color: '#96CEB4',
    description: 'Conheça nossos planos de manutenção',
  },
];

export default function HomeScreen() {
  const { user, isLoading, logout } = useStore((state) => state);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // If no user is authenticated, redirect to login
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/(auth)/login');
    }
  }, [user, isLoading]);

  // Fetch user-specific data when component mounts
  useEffect(() => {
    if (user?.id) {
      console.log('[HOME] User data at mount:', JSON.stringify(user));
      fetchUserData();
      loadVehicleData();
    }
  }, [user?.id]);

  const loadVehicleData = async () => {
    try {
      console.log('[HOME] Loading vehicle data from storage');
      if (user?.id) {
        // First check if data is already in the user object
        const userHasVehicleData = user.carBrand && user.carModel;
        if (userHasVehicleData) {
          console.log('[HOME] Vehicle data already in user object:', JSON.stringify({
            carBrand: user.carBrand,
            carModel: user.carModel,
            carColor: user.carColor,
            carYear: user.carYear,
            licensePlate: user.licensePlate,
            carPhoto: user.carPhoto
          }));
          
          // If user object has data, use it
          setVehicleData({
            carBrand: user.carBrand,
            carModel: user.carModel,
            carColor: user.carColor,
            carYear: user.carYear,
            licensePlate: user.licensePlate,
            carPhoto: user.carPhoto
          });
          return;
        }
        
        // Then try to load from AsyncStorage as backup
        const vehicleStorageKey = `@vehicle_${user.id}`;
        const storedVehicleData = await AsyncStorage.getItem(vehicleStorageKey);
        
        if (storedVehicleData) {
          const parsedData = JSON.parse(storedVehicleData);
          console.log('[HOME] Vehicle data loaded from AsyncStorage:', parsedData);
          setVehicleData(parsedData);
        } else {
          console.log('[HOME] No vehicle data found in AsyncStorage');
        }
      }
    } catch (error) {
      console.error('[HOME] Error loading vehicle data:', error);
    }
  };

  const fetchUserData = async () => {
    setLoadingData(true);
    try {
      // Here you would fetch data from Supabase based on user ID
      // For example, fetch service orders
      const { data, error } = await supabase
        .from('service_orders')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        setServiceOrders(data);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleCardPress = (card: Card) => {
    setSelectedCard(card);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedCard(null);
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  // Show loading while checking auth status
  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }
  
  // Determine if we have vehicle data to display
  const hasVehicleData = vehicleData?.carBrand || (user?.carBrand && user?.carModel);

  const renderModalContent = () => {
    if (!selectedCard) return null;

    switch (selectedCard.id) {
      case 'service-orders':
        return (
          <>
            <Text style={styles.modalSubtitle}>Relatórios do Veículo</Text>
            {user?.carModel ? (
              <View style={styles.serviceOrderContainer}>
                <View style={styles.serviceOrderHeader}>
                  <Tool size={20} color="#007AFF" />
                  <Text style={styles.serviceOrderTitle}>Última Inspeção</Text>
                  <Text style={styles.serviceOrderDate}>10/07/2023</Text>
                </View>
                <View style={styles.serviceOrderContent}>
                  <Text style={styles.serviceOrderItem}>✓ Sistema de freios em bom estado</Text>
                  <Text style={styles.serviceOrderItem}>✓ Óleo trocado (próxima em 3000km)</Text>
                  <Text style={styles.serviceOrderItem}>✓ Filtros limpos</Text>
                  <Text style={styles.serviceOrderItem}>⚠️ Pneus com desgaste (verificar em 2 meses)</Text>
                </View>
                <TouchableOpacity style={styles.serviceOrderButton}>
                  <Text style={styles.serviceOrderButtonText}>Ver Relatório Completo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.emptyStateText}>
                Nenhum relatório disponível. Agende sua primeira vistoria.
              </Text>
            )}
          </>
        );
      
      case 'scheduling':
        return (
          <>
            <Text style={styles.modalSubtitle}>Agende sua Visita</Text>
            <View style={styles.schedulingContainer}>
              <View style={styles.calendarPlaceholder}>
                <Calendar size={30} color="#007AFF" />
                <Text style={styles.calendarPlaceholderText}>Selecione uma Data</Text>
              </View>
              <View style={styles.timeSlots}>
                <Text style={styles.timeSlotsTitle}>Horários Disponíveis:</Text>
                <View style={styles.timeSlotRow}>
                  <TouchableOpacity style={styles.timeSlot}>
                    <Clock size={16} color="#666" />
                    <Text style={styles.timeSlotText}>09:00</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.timeSlot}>
                    <Clock size={16} color="#666" />
                    <Text style={styles.timeSlotText}>10:30</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.timeSlot}>
                    <Clock size={16} color="#666" />
                    <Text style={styles.timeSlotText}>13:00</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.timeSlotRow}>
                  <TouchableOpacity style={styles.timeSlot}>
                    <Clock size={16} color="#666" />
                    <Text style={styles.timeSlotText}>14:30</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.timeSlot}>
                    <Clock size={16} color="#666" />
                    <Text style={styles.timeSlotText}>16:00</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.timeSlot}>
                    <Clock size={16} color="#666" />
                    <Text style={styles.timeSlotText}>17:30</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity style={styles.scheduleButton}>
                <Text style={styles.scheduleButtonText}>Agendar Visita</Text>
              </TouchableOpacity>
            </View>
          </>
        );
      
      case 'plans':
        return (
          <>
            <Text style={styles.modalSubtitle}>Nossos Planos</Text>
            <View style={styles.plansContainer}>
              <TouchableOpacity style={[styles.planCard, styles.planCardBasic]}>
                <View style={styles.planHeader}>
                  <Text style={styles.planName}>Básico</Text>
                  <Text style={styles.planPrice}>R$49,90/mês</Text>
                </View>
                <View style={styles.planFeatures}>
                  <Text style={styles.planFeature}>✓ Inspeção mensal</Text>
                  <Text style={styles.planFeature}>✓ Desconto em peças</Text>
                  <Text style={styles.planFeature}>✓ Suporte 24/7</Text>
                </View>
                <Text style={styles.planSelectText}>Selecionar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.planCard, styles.planCardPremium]}>
                <View style={styles.planHeaderPremium}>
                  <Star size={16} color="#fff" />
                  <Text style={styles.planNamePremium}>Premium</Text>
                  <Text style={styles.planPricePremium}>R$99,90/mês</Text>
                </View>
                <View style={styles.planFeatures}>
                  <Text style={styles.planFeature}>✓ Inspeção semanal</Text>
                  <Text style={styles.planFeature}>✓ Desconto em peças</Text>
                  <Text style={styles.planFeature}>✓ Suporte 24/7</Text>
                  <Text style={styles.planFeature}>✓ Guincho grátis</Text>
                  <Text style={styles.planFeature}>✓ Prioridade no agendamento</Text>
                </View>
                <Text style={styles.planSelectTextPremium}>Selecionar</Text>
              </TouchableOpacity>
            </View>
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.contentContainer} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Olá, {user?.name || 'Usuário'}</Text>
              <View style={styles.locationContainer}>
                <MapPin size={14} color="#FFFFFF" />
                <Text style={styles.location}>{user?.address || vehicleData?.address || 'Localização não definida'}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.notificationButton}>
              <Bell size={20} color="#FFFFFF" />
              <View style={styles.notificationBadge} />
            </TouchableOpacity>
          </View>
          
          {/* Vehicle information section */}
          <View style={styles.carInfo}>
            <Text style={styles.carInfoTitle}>Informações do seu veículo</Text>
            {hasVehicleData ? (
              <View style={styles.carDetails}>
                {(vehicleData?.carPhoto || user?.carPhoto) ? (
                  <Image 
                    source={{ uri: vehicleData?.carPhoto || user?.carPhoto }}
                    style={styles.carImage}
                  />
                ) : (
                  <View style={styles.carImagePlaceholder}>
                    <Car size={20} color="#007AFF" />
                  </View>
                )}
                <View style={styles.carText}>
                  <Text style={styles.carInfoText}>
                    {vehicleData?.carBrand || user?.carBrand || 'Marca'} {vehicleData?.carModel || user?.carModel || 'Modelo'} • {vehicleData?.carColor || user?.carColor || 'Cor'}
                  </Text>
                  <Text style={styles.carInfoText}>
                    {vehicleData?.carYear || user?.carYear || 'Ano'}
                  </Text>
                  <Text style={styles.licensePlate}>
                    {vehicleData?.licensePlate || user?.licensePlate || 'Placa'}
                  </Text>
                </View>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.addVehicleButton}
                onPress={() => router.push('/vehicle-registration')}
              >
                <Car size={20} color="#007AFF" />
                <Text style={styles.addVehicleText}>Adicionar Veículo</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {loadingData ? (
          <View style={styles.loadingDataContainer}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.loadingDataText}>Carregando dados...</Text>
          </View>
        ) : (
          <View style={styles.mainContent}>
            {/* Larger Test Banner */}
            <View style={styles.banner}>
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1493238792000-8113da705763?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80' }}
                style={styles.bannerImage}
              />
              <View style={styles.bannerOverlay}>
                <View style={styles.bannerContent}>
                  <Text style={styles.bannerTitle}>Oferta Especial</Text>
                  <Text style={styles.bannerText}>30% de desconto na próxima revisão</Text>
                </View>
                <TouchableOpacity style={styles.bannerButton}>
                  <Text style={styles.bannerButtonText}>Ver oferta</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <Text style={styles.contentTitle}>Acompanhe suas ordens de serviço e agendamentos aqui</Text>
            
            {/* Square service cards */}
            <View style={styles.serviceCardsContainer}>
              {homeCards.map((card) => (
                <TouchableOpacity 
                  key={card.id} 
                  style={styles.serviceCard}
                  onPress={() => handleCardPress(card)}
                >
                  <View style={[styles.serviceCardIcon, { backgroundColor: card.color }]}>
                    {<card.icon size={28} color="#fff" />}
                  </View>
                  <Text style={styles.serviceCardTitle}>{card.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity 
              style={styles.logoutButton} 
              onPress={async () => {
                await logout();
                router.replace('/(auth)/login');
              }}
            >
              <Text style={styles.logoutButtonText}>Sair</Text>
            </TouchableOpacity>
          </View>
        )}

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={closeModal}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedCard?.title}</Text>
                <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                  <X size={24} color="#666" />
                </TouchableOpacity>
              </View>
              {renderModalContent()}
            </View>
          </View>
        </Modal>
      </ScrollView>

      {/* Navigation Menu */}
      <View style={styles.navMenu}>
        <TouchableOpacity style={styles.navMenuItem} onPress={() => router.push('/')}>
          <Home size={22} color="#FFFFFF" />
          <Text style={styles.navMenuText}>Início</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navMenuItem} onPress={() => handleCardPress(homeCards.find(card => card.id === 'service-orders')!)}>
          <FileText size={22} color="#FFFFFF" />
          <Text style={styles.navMenuText}>Serviços</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navMenuItem} onPress={() => router.push('/profile')}>
          <User size={22} color="#FFFFFF" />
          <Text style={styles.navMenuText}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    paddingBottom: 70, // Space for bottom nav
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    fontFamily: 'Inter-Regular',
  },
  loadingDataContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 150,
  },
  loadingDataText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter-Regular',
  },
  header: {
    backgroundColor: '#007AFF',
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  greeting: {
    fontSize: 22,
    color: '#FFFFFF',
    fontFamily: 'Poppins-Bold',
    marginBottom: 2,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    color: '#FFFFFF',
    opacity: 0.9,
    marginLeft: 4,
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  notificationButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF3B30',
  },
  carInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  carInfoTitle: {
    color: '#FFFFFF',
    opacity: 0.8,
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  carDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  carImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  carText: {
    flex: 1,
  },
  carInfoText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
  licensePlate: {
    color: '#FFFFFF',
    opacity: 0.9,
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    marginTop: 2,
  },
  logoutButton: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  logoutButtonText: {
    color: '#FF3B30',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    minHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: '#1a1a1a',
  },
  modalSubtitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  closeButton: {
    padding: 8,
  },
  serviceOrderContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  serviceOrderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceOrderTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#1a1a1a',
    flex: 1,
    marginLeft: 8,
  },
  serviceOrderDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#666',
  },
  serviceOrderContent: {
    marginBottom: 16,
  },
  serviceOrderItem: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  serviceOrderButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  serviceOrderButtonText: {
    color: '#fff',
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  schedulingContainer: {
    marginBottom: 20,
  },
  calendarPlaceholder: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarPlaceholderText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#666',
    marginTop: 10,
  },
  timeSlots: {
    marginBottom: 20,
  },
  timeSlotsTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  timeSlotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timeSlot: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    width: '30%',
  },
  timeSlotText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#1a1a1a',
    marginLeft: 6,
  },
  scheduleButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  scheduleButtonText: {
    color: '#fff',
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
  plansContainer: {
    gap: 16,
  },
  planCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  planCardBasic: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  planCardPremium: {
    backgroundColor: '#f0f7ff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  planHeader: {
    marginBottom: 16,
  },
  planHeaderPremium: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  planName: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#1a1a1a',
  },
  planNamePremium: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#fff',
    marginLeft: 8,
  },
  planPrice: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#666',
  },
  planPricePremium: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#fff',
    position: 'absolute',
    right: 12,
  },
  planFeatures: {
    marginBottom: 16,
  },
  planFeature: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  planSelectText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#007AFF',
    textAlign: 'center',
  },
  planSelectTextPremium: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#007AFF',
    textAlign: 'center',
  },
  carImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addVehicleButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  addVehicleText: {
    color: '#007AFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    marginLeft: 8,
  },
  mainContent: {
    flex: 1,
    padding: 20,
  },
  mainContentPlaceholder: {
    backgroundColor: '#f0f7ff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    marginBottom: 20,
  },
  mainContentText: {
    fontSize: 14,
    color: '#007AFF',
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  },
  contentTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  serviceCardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  serviceCard: {
    width: '31%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    height: 110,
  },
  serviceCardIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  serviceCardTitle: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#333',
    textAlign: 'center',
  },
  navMenu: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    justifyContent: 'space-around',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  navMenuItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navMenuText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    marginTop: 4,
  },
  banner: {
    borderRadius: 12,
    marginBottom: 20,
    height: 140, // Increased height for photos and videos
    overflow: 'hidden',
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  bannerOverlay: {
    backgroundColor: 'rgba(0, 122, 255, 0.7)',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    marginBottom: 6,
  },
  bannerText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    opacity: 0.9,
  },
  bannerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  bannerButtonText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
});