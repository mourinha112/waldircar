import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useStore } from '@/store';
import { supabase } from '@/lib/supabase';
import {
  Calendar,
  Users,
  FileText,
  Car,
  Clock,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react-native';

interface DashboardStats {
  totalUsers: number;
  totalAppointments: number;
  pendingAppointments: number;
  completedOrders: number;
  pendingOrders: number;
}

interface RecentActivity {
  id: string;
  type: string;
  title: string;
  date: string;
  status: string;
}

export default function AdminDashboard() {
  const { user } = useStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchUserRole();
      fetchDashboardData();
    }
  }, [user]);

  const fetchUserRole = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
      } else if (data) {
        setUserRole(data.role);
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch stats
      const statsPromises = [
        fetchTotalUsers(),
        fetchAppointmentsData(),
        fetchServiceOrdersData(),
      ];

      // Fetch recent activities
      const activitiesPromises = [
        fetchRecentAppointments(),
        fetchRecentServiceOrders(),
      ];

      await Promise.all(statsPromises);
      const recentActivities = await Promise.all(activitiesPromises);
      
      // Combine and sort activities
      const combinedActivities = [...recentActivities[0], ...recentActivities[1]]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);

      setActivities(combinedActivities);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTotalUsers = async () => {
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error fetching users count:', error);
    } else {
      setStats(prev => ({ ...prev || {} as DashboardStats, totalUsers: count || 0 }));
    }
  };

  const fetchAppointmentsData = async () => {
    const { data: allAppointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('*');

    const { data: pendingAppointments, error: pendingError } = await supabase
      .from('appointments')
      .select('*')
      .in('status', ['scheduled', 'confirmed']);

    if (appointmentsError || pendingError) {
      console.error('Error fetching appointments:', appointmentsError || pendingError);
    } else {
      setStats(prev => ({ 
        ...prev || {} as DashboardStats, 
        totalAppointments: allAppointments?.length || 0,
        pendingAppointments: pendingAppointments?.length || 0
      }));
    }
  };

  const fetchServiceOrdersData = async () => {
    const { data: completedOrders, error: completedError } = await supabase
      .from('service_orders')
      .select('*')
      .eq('status', 'completed');

    const { data: pendingOrders, error: pendingError } = await supabase
      .from('service_orders')
      .select('*')
      .eq('status', 'in_progress');

    if (completedError || pendingError) {
      console.error('Error fetching service orders:', completedError || pendingError);
    } else {
      setStats(prev => ({ 
        ...prev || {} as DashboardStats, 
        completedOrders: completedOrders?.length || 0,
        pendingOrders: pendingOrders?.length || 0
      }));
    }
  };

  const fetchRecentAppointments = async (): Promise<RecentActivity[]> => {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        appointment_time,
        status,
        service_type,
        profiles(name)
      `)
      .order('appointment_date', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching recent appointments:', error);
      return [];
    }

    return data.map(item => ({
      id: item.id,
      type: 'appointment',
      title: `${item.profiles?.name || 'Cliente'} - ${item.service_type}`,
      date: `${item.appointment_date} ${item.appointment_time}`,
      status: item.status
    }));
  };

  const fetchRecentServiceOrders = async (): Promise<RecentActivity[]> => {
    const { data, error } = await supabase
      .from('service_orders')
      .select(`
        id,
        created_at,
        status,
        profiles(name)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching recent service orders:', error);
      return [];
    }

    return data.map(item => ({
      id: item.id,
      type: 'service_order',
      title: `Ordem de Serviço - ${item.profiles?.name || 'Cliente'}`,
      date: new Date(item.created_at).toLocaleString('pt-BR'),
      status: item.status
    }));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Carregando dados...</Text>
      </View>
    );
  }

  const isAdmin = userRole === 'admin';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Text style={styles.headerSubtitle}>
          Bem-vindo ao painel {isAdmin ? 'administrativo' : 'do mecânico'}
        </Text>
      </View>

      {/* Stats Section */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#4CAF50' }]}>
              <Users size={24} color="#fff" />
            </View>
            <Text style={styles.statTitle}>Total de Clientes</Text>
            <Text style={styles.statValue}>{stats?.totalUsers || 0}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#2196F3' }]}>
              <Calendar size={24} color="#fff" />
            </View>
            <Text style={styles.statTitle}>Agendamentos</Text>
            <Text style={styles.statValue}>{stats?.totalAppointments || 0}</Text>
            <Text style={styles.statSubvalue}>
              {stats?.pendingAppointments || 0} pendentes
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#FF9800' }]}>
              <FileText size={24} color="#fff" />
            </View>
            <Text style={styles.statTitle}>Ordens de Serviço</Text>
            <Text style={styles.statValue}>
              {(stats?.completedOrders || 0) + (stats?.pendingOrders || 0)}
            </Text>
            <Text style={styles.statSubvalue}>
              {stats?.pendingOrders || 0} em andamento
            </Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#673AB7' }]}>
              <TrendingUp size={24} color="#fff" />
            </View>
            <Text style={styles.statTitle}>Taxa de Conclusão</Text>
            <Text style={styles.statValue}>
              {stats?.completedOrders && (stats?.completedOrders + stats?.pendingOrders) > 0
                ? Math.round((stats.completedOrders / (stats.completedOrders + stats.pendingOrders)) * 100)
                : 0}%
            </Text>
          </View>
        </View>
      </View>

      {/* Recent Activity Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Atividades Recentes</Text>

        {activities.length === 0 ? (
          <View style={styles.emptyState}>
            <AlertCircle size={40} color="#ccc" />
            <Text style={styles.emptyStateText}>Nenhuma atividade recente</Text>
          </View>
        ) : (
          activities.map((activity) => (
            <TouchableOpacity key={activity.id} style={styles.activityItem}>
              <View style={styles.activityIconContainer}>
                {activity.type === 'appointment' ? (
                  <Calendar size={20} color="#2196F3" />
                ) : (
                  <FileText size={20} color="#FF9800" />
                )}
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityDate}>{activity.date}</Text>
                <View style={[
                  styles.activityStatus,
                  activity.status === 'completed' ? styles.statusCompleted :
                  activity.status === 'scheduled' ? styles.statusScheduled :
                  activity.status === 'confirmed' ? styles.statusConfirmed :
                  activity.status === 'in_progress' ? styles.statusInProgress :
                  activity.status === 'cancelled' ? styles.statusCancelled :
                  styles.statusDefault
                ]}>
                  <Text style={styles.activityStatusText}>
                    {activity.status === 'completed' ? 'Concluído' :
                     activity.status === 'scheduled' ? 'Agendado' :
                     activity.status === 'confirmed' ? 'Confirmado' :
                     activity.status === 'in_progress' ? 'Em andamento' :
                     activity.status === 'cancelled' ? 'Cancelado' :
                     activity.status}
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color="#ccc" />
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
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
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: '#333',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#666',
  },
  statsContainer: {
    padding: 15,
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    width: '48%',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: '#333',
  },
  statSubvalue: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#999',
    marginTop: 3,
  },
  sectionContainer: {
    backgroundColor: '#fff',
    margin: 15,
    marginTop: 0,
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#333',
  },
  activityDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#999',
    marginVertical: 3,
  },
  activityStatus: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  activityStatusText: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
  },
  statusCompleted: {
    backgroundColor: '#4CAF50',
  },
  statusScheduled: {
    backgroundColor: '#2196F3',
  },
  statusConfirmed: {
    backgroundColor: '#3F51B5',
  },
  statusInProgress: {
    backgroundColor: '#FF9800',
  },
  statusCancelled: {
    backgroundColor: '#F44336',
  },
  statusDefault: {
    backgroundColor: '#9E9E9E',
  },
  emptyState: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#999',
    marginTop: 10,
  },
}); 