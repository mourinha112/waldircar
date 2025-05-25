import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Stack, useRouter, Redirect } from 'expo-router';
import { useStore } from '@/store';
import { supabase } from '@/lib/supabase';
import { 
  Home, 
  Calendar, 
  FileText, 
  Settings, 
  Users, 
  Package,
  LogOut,
  Menu,
  X
} from 'lucide-react-native';

export default function AdminLayout() {
  const { user, isLoading, logout } = useStore((state) => state);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check if user is admin or mechanic
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        if (!user?.id) {
          setRoleLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .in('role', ['admin', 'mechanic'])
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          setError(error.message);
          setUserRole(null);
        } else if (data) {
          setUserRole(data.role);
          setError(null);
        } else {
          setUserRole(null);
        }
      } catch (error: any) {
        console.error('Error checking user role:', error);
        setError(error.message);
        setUserRole(null);
      } finally {
        setRoleLoading(false);
      }
    };

    if (!isLoading) {
      if (!user) {
        router.replace('/(auth)/login');
      } else {
        checkUserRole();
      }
    }
  }, [user, isLoading, router]);

  // Show loading while checking auth status
  if (isLoading || roleLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  // Show error if there's an authentication issue
  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Erro de autenticação: {error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={async () => {
            await logout();
            router.replace('/(auth)/login');
          }}
        >
          <Text style={styles.retryButtonText}>Voltar para o login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Redirect if user is not admin or mechanic
  if (!userRole) {
    return <Redirect href="/(auth)/login" />;
  }

  const isAdmin = userRole === 'admin';

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleNavigate = (path: string) => {
    router.push(path);
    setMenuOpen(false);
  };

  return (
    <View style={styles.container}>
      <Stack screenOptions={{
        headerStyle: {
          backgroundColor: '#1a237e',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerLeft: () => (
          <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
            {menuOpen ? <X size={24} color="#fff" /> : <Menu size={24} color="#fff" />}
          </TouchableOpacity>
        ),
        headerTitle: () => (
          <Text style={styles.headerTitle}>
            Painel {isAdmin ? 'Administrativo' : 'do Mecânico'}
          </Text>
        ),
      }} />

      {/* Side Menu */}
      {menuOpen && (
        <View style={styles.sideMenu}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'Usuário'}</Text>
            <Text style={styles.userRole}>{isAdmin ? 'Administrador' : 'Mecânico'}</Text>
          </View>

          <ScrollView style={styles.menuItems}>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => handleNavigate('/admin')}
            >
              <Home size={22} color="#333" />
              <Text style={styles.menuItemText}>Dashboard</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => handleNavigate('/admin/scheduling')}
            >
              <Calendar size={22} color="#333" />
              <Text style={styles.menuItemText}>Agendamentos</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => handleNavigate('/admin/service-orders')}
            >
              <FileText size={22} color="#333" />
              <Text style={styles.menuItemText}>Ordens de Serviço</Text>
            </TouchableOpacity>

            {isAdmin && (
              <>
                <TouchableOpacity 
                  style={styles.menuItem} 
                  onPress={() => handleNavigate('/admin/plans')}
                >
                  <Package size={22} color="#333" />
                  <Text style={styles.menuItemText}>Planos</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.menuItem} 
                  onPress={() => handleNavigate('/admin/users')}
                >
                  <Users size={22} color="#333" />
                  <Text style={styles.menuItemText}>Usuários</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => handleNavigate('/admin/settings')}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    fontFamily: 'Inter-Regular',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
  },
  menuButton: {
    marginLeft: 15,
    padding: 5,
  },
  sideMenu: {
    position: 'absolute',
    top: 60,
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