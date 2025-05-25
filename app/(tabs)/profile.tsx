import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useStore } from '@/store';
import { Car, MapPin, CreditCard, Bell, Settings, LogOut, ChevronRight } from 'lucide-react-native';

const menuItems = [
  {
    icon: Car,
    title: 'Meus Veículos',
    subtitle: 'Gerenciar veículos cadastrados',
  },
  {
    icon: MapPin,
    title: 'Endereços',
    subtitle: 'Gerenciar endereços salvos',
  },
  {
    icon: CreditCard,
    title: 'Pagamento',
    subtitle: 'Métodos de pagamento',
  },
  {
    icon: Bell,
    title: 'Notificações',
    subtitle: 'Preferências de notificação',
  },
  {
    icon: Settings,
    title: 'Configurações',
    subtitle: 'Ajustes da conta',
  },
];

export default function ProfileScreen() {
  const { user, logout } = useStore();

  const handleLogout = () => {
    logout();
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <Image
            source={{ uri: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg' }}
            style={styles.profileImage}
          />
          <View>
            <Text style={styles.name}>Eder Souza</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.editButton}>
          <Text style={styles.editButtonText}>Editar Perfil</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.carInfo}>
        <View style={styles.carHeader}>
          <Text style={styles.carTitle}>Meu Veículo</Text>
          <TouchableOpacity>
            <ChevronRight size={20} color="#666" />
          </TouchableOpacity>
        </View>
        <View style={styles.carDetails}>
          <Car size={24} color="#007AFF" />
          <View style={styles.carText}>
            <Text style={styles.carModel}>{user?.carModel}</Text>
            <Text style={styles.carPlate}>{user?.licensePlate} • {user?.carYear}</Text>
          </View>
        </View>
      </View>

      <View style={styles.menuSection}>
        {menuItems.map((item, index) => (
          <TouchableOpacity key={index} style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <item.icon size={24} color="#666" />
              <View style={styles.menuItemText}>
                <Text style={styles.menuItemTitle}>{item.title}</Text>
                <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
              </View>
            </View>
            <ChevronRight size={20} color="#666" />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <LogOut size={24} color="#ff4444" />
        <Text style={styles.logoutText}>Sair da conta</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  name: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter-Regular',
  },
  editButton: {
    backgroundColor: '#f0f7ff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  editButtonText: {
    color: '#007AFF',
    fontFamily: 'Inter-SemiBold',
  },
  carInfo: {
    margin: 20,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  carHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  carTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
  },
  carDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  carText: {
    marginLeft: 12,
  },
  carModel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  carPlate: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter-Regular',
  },
  menuSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: 20,
    marginTop: 0,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    marginLeft: 12,
  },
  menuItemTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter-Regular',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 40,
  },
  logoutText: {
    marginLeft: 8,
    color: '#ff4444',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});