import React, { useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity, Text, View, StyleSheet, ScrollView } from 'react-native';
import { Menu, X, Home, Calendar, FileText, User, Settings, LogOut } from 'lucide-react-native';
import { useStore } from '@/store';

export default function TabLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const { user, logout } = useStore((state) => state);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleNavigate = (path: string) => {
    router.push(path);
    setMenuOpen(false);
  };

  return (
    <View style={styles.container}>
      <Stack screenOptions={{ headerShown: false }} />

      {/* Side Menu */}
      {menuOpen && (
        <View style={styles.sideMenu}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'Usuário'}</Text>
            <Text style={styles.userRole}>Cliente</Text>
          </View>

          <ScrollView style={styles.menuItems}>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => handleNavigate('/')}
            >
              <Home size={22} color="#333" />
              <Text style={styles.menuItemText}>Início</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => handleNavigate('/appointments')}
            >
              <Calendar size={22} color="#333" />
              <Text style={styles.menuItemText}>Agendamentos</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => handleNavigate('/services')}
            >
              <FileText size={22} color="#333" />
              <Text style={styles.menuItemText}>Serviços</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => handleNavigate('/profile')}
            >
              <User size={22} color="#333" />
              <Text style={styles.menuItemText}>Perfil</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => handleNavigate('/settings')}
            >
              <Settings size={22} color="#333" />
              <Text style={styles.menuItemText}>Configurações</Text>
            </TouchableOpacity>
          </ScrollView>

          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={async () => {
              await logout();
              router.replace('/(auth)/login');
            }}
          >
            <LogOut size={22} color="#FF3B30" />
            <Text style={styles.logoutText}>Sair</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  sideMenu: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 250,
    backgroundColor: '#fff',
    zIndex: 100,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    borderRightWidth: 1,
    borderRightColor: '#eee',
    flexDirection: 'column',
  },
  userInfo: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f0f7ff',
    marginTop: 50, // Espaço para o cabeçalho do sistema
  },
  userName: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
  },
  userRole: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666',
    marginTop: 4,
  },
  menuItems: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  menuItemText: {
    marginLeft: 15,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#333',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  logoutText: {
    marginLeft: 15,
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FF3B30',
  },
});