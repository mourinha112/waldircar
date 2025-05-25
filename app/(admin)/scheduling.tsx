import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  TextInput,
  Modal,
  Switch,
  Alert,
  FlatList,
  Platform
} from 'react-native';
import { useStore } from '@/store';
import { supabase } from '@/lib/supabase';
import {
  Calendar,
  Clock,
  Plus,
  Edit2,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
  Check,
  User,
  Filter
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface AvailabilityItem {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  interval_minutes: number;
  max_appointments: number;
  is_active: boolean;
}

interface Appointment {
  id: string;
  user_id: string;
  appointment_date: string;
  appointment_time: string;
  service_type: string;
  status: string;
  userName?: string;
}

export default function SchedulingScreen() {
  const { user } = useStore();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [availabilities, setAvailabilities] = useState<AvailabilityItem[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isCreateModalVisible, setCreateModalVisible] = useState(false);
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  
  // Form state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date(new Date().setHours(new Date().getHours() + 8)));
  const [intervalMinutes, setIntervalMinutes] = useState('30');
  const [maxAppointments, setMaxAppointments] = useState('1');
  const [isActive, setIsActive] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [showFilterDatePicker, setShowFilterDatePicker] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchUserRole();
      fetchAvailabilities();
      fetchAppointments();
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

  const fetchAvailabilities = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('scheduling_availability')
        .select('*')
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching availabilities:', error);
      } else {
        setAvailabilities(data || []);
      }
    } catch (error) {
      console.error('Error fetching availabilities:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          profiles (name)
        `)
        .order('appointment_date', { ascending: true });

      if (error) {
        console.error('Error fetching appointments:', error);
      } else if (data) {
        const appointmentsWithNames = data.map(item => ({
          ...item,
          userName: item.profiles?.name || 'Cliente sem nome'
        }));
        setAppointments(appointmentsWithNames);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const handleCreateAvailability = async () => {
    if (!user?.id) return;

    try {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      const formattedStartTime = startTime.toTimeString().split(' ')[0].substring(0, 5);
      const formattedEndTime = endTime.toTimeString().split(' ')[0].substring(0, 5);

      const { data, error } = await supabase
        .from('scheduling_availability')
        .insert({
          date: formattedDate,
          start_time: formattedStartTime,
          end_time: formattedEndTime,
          interval_minutes: parseInt(intervalMinutes),
          max_appointments: parseInt(maxAppointments),
          created_by: user.id,
          is_active: isActive
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating availability:', error);
        Alert.alert('Erro', 'Não foi possível criar a disponibilidade.');
      } else {
        setAvailabilities([...availabilities, data]);
        setCreateModalVisible(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error creating availability:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao criar a disponibilidade.');
    }
  };

  const handleUpdateAvailability = async () => {
    if (!editingId || !user?.id) return;

    try {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      const formattedStartTime = startTime.toTimeString().split(' ')[0].substring(0, 5);
      const formattedEndTime = endTime.toTimeString().split(' ')[0].substring(0, 5);

      const { data, error } = await supabase
        .from('scheduling_availability')
        .update({
          date: formattedDate,
          start_time: formattedStartTime,
          end_time: formattedEndTime,
          interval_minutes: parseInt(intervalMinutes),
          max_appointments: parseInt(maxAppointments),
          is_active: isActive
        })
        .eq('id', editingId)
        .select()
        .single();

      if (error) {
        console.error('Error updating availability:', error);
        Alert.alert('Erro', 'Não foi possível atualizar a disponibilidade.');
      } else {
        setAvailabilities(availabilities.map(item => 
          item.id === editingId ? data : item
        ));
        setCreateModalVisible(false);
        setEditingId(null);
        resetForm();
      }
    } catch (error) {
      console.error('Error updating availability:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao atualizar a disponibilidade.');
    }
  };

  const handleDeleteAvailability = async (id: string) => {
    Alert.alert(
      'Confirmar exclusão',
      'Tem certeza que deseja excluir esta disponibilidade? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive', 
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('scheduling_availability')
                .delete()
                .eq('id', id);

              if (error) {
                console.error('Error deleting availability:', error);
                Alert.alert('Erro', 'Não foi possível excluir a disponibilidade.');
              } else {
                setAvailabilities(availabilities.filter(item => item.id !== id));
              }
            } catch (error) {
              console.error('Error deleting availability:', error);
              Alert.alert('Erro', 'Ocorreu um erro ao excluir a disponibilidade.');
            }
          }
        }
      ]
    );
  };

  const handleEditAvailability = (item: AvailabilityItem) => {
    // Set form with item data
    setSelectedDate(new Date(item.date));
    
    // Parse time strings
    const [startHour, startMinute] = item.start_time.split(':').map(Number);
    const [endHour, endMinute] = item.end_time.split(':').map(Number);
    
    const startTimeDate = new Date();
    startTimeDate.setHours(startHour, startMinute, 0);
    setStartTime(startTimeDate);
    
    const endTimeDate = new Date();
    endTimeDate.setHours(endHour, endMinute, 0);
    setEndTime(endTimeDate);
    
    setIntervalMinutes(item.interval_minutes.toString());
    setMaxAppointments(item.max_appointments.toString());
    setIsActive(item.is_active);
    setEditingId(item.id);
    setCreateModalVisible(true);
  };

  const resetForm = () => {
    setSelectedDate(new Date());
    setStartTime(new Date());
    setEndTime(new Date(new Date().setHours(new Date().getHours() + 8)));
    setIntervalMinutes('30');
    setMaxAppointments('1');
    setIsActive(true);
    setEditingId(null);
  };

  const toggleDatePicker = () => {
    setShowDatePicker(!showDatePicker);
  };

  const toggleStartTimePicker = () => {
    setShowStartTimePicker(!showStartTimePicker);
  };

  const toggleEndTimePicker = () => {
    setShowEndTimePicker(!showEndTimePicker);
  };

  const toggleFilterDatePicker = () => {
    setShowFilterDatePicker(!showFilterDatePicker);
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (date) {
      setSelectedDate(date);
    }
    setShowDatePicker(false);
  };

  const handleStartTimeChange = (event: any, time?: Date) => {
    if (time) {
      setStartTime(time);
    }
    setShowStartTimePicker(false);
  };

  const handleEndTimeChange = (event: any, time?: Date) => {
    if (time) {
      setEndTime(time);
    }
    setShowEndTimePicker(false);
  };

  const handleFilterDateChange = (event: any, date?: Date) => {
    setDateFilter(date || null);
    setShowFilterDatePicker(false);
  };

  const clearFilters = () => {
    setStatusFilter(null);
    setDateFilter(null);
  };

  // Filter appointments based on selected filters
  const filteredAppointments = appointments.filter(appointment => {
    let matchesStatus = true;
    let matchesDate = true;

    if (statusFilter) {
      matchesStatus = appointment.status === statusFilter;
    }

    if (dateFilter) {
      const appointmentDate = new Date(appointment.appointment_date);
      const filterDate = new Date(dateFilter);
      matchesDate = 
        appointmentDate.getDate() === filterDate.getDate() &&
        appointmentDate.getMonth() === filterDate.getMonth() &&
        appointmentDate.getFullYear() === filterDate.getFullYear();
    }

    return matchesStatus && matchesDate;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  const isAdmin = userRole === 'admin';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gerenciamento de Agendamentos</Text>
      </View>

      {/* Availabilities Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Dias Disponíveis</Text>
          {isAdmin && (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => {
                resetForm();
                setCreateModalVisible(true);
              }}
            >
              <Plus size={20} color="#fff" />
              <Text style={styles.addButtonText}>Adicionar</Text>
            </TouchableOpacity>
          )}
        </View>

        {availabilities.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              Nenhum dia disponível cadastrado
            </Text>
          </View>
        ) : (
          availabilities.map((item) => (
            <View key={item.id} style={styles.availabilityItem}>
              <View style={styles.availabilityInfo}>
                <View style={styles.availabilityDate}>
                  <Calendar size={18} color="#007AFF" />
                  <Text style={styles.availabilityDateText}>
                    {formatDate(item.date)}
                  </Text>
                </View>
                <View style={styles.availabilityTime}>
                  <Clock size={16} color="#666" />
                  <Text style={styles.availabilityTimeText}>
                    {item.start_time.substring(0, 5)} - {item.end_time.substring(0, 5)}
                  </Text>
                </View>
                <Text style={styles.availabilityDetails}>
                  A cada {item.interval_minutes} min • Máx: {item.max_appointments} agendamentos
                </Text>
                {!item.is_active && (
                  <View style={styles.inactiveTag}>
                    <Text style={styles.inactiveTagText}>Inativo</Text>
                  </View>
                )}
              </View>
              
              {isAdmin && (
                <View style={styles.availabilityActions}>
                  <TouchableOpacity 
                    style={styles.editButton}
                    onPress={() => handleEditAvailability(item)}
                  >
                    <Edit2 size={18} color="#007AFF" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => handleDeleteAvailability(item.id)}
                  >
                    <Trash2 size={18} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </View>

      {/* Appointments Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Agendamentos</Text>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setFilterModalVisible(true)}
          >
            <Filter size={18} color="#007AFF" />
            <Text style={styles.filterButtonText}>Filtrar</Text>
          </TouchableOpacity>
        </View>

        {filteredAppointments.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              Nenhum agendamento encontrado
            </Text>
          </View>
        ) : (
          filteredAppointments.map((appointment) => (
            <View key={appointment.id} style={styles.appointmentItem}>
              <View style={styles.appointmentInfo}>
                <View style={styles.appointmentHeader}>
                  <View style={styles.appointmentClient}>
                    <User size={16} color="#007AFF" />
                    <Text style={styles.appointmentClientText}>
                      {appointment.userName}
                    </Text>
                  </View>
                  <View style={[
                    styles.appointmentStatus,
                    appointment.status === 'completed' ? styles.statusCompleted :
                    appointment.status === 'scheduled' ? styles.statusScheduled :
                    appointment.status === 'confirmed' ? styles.statusConfirmed :
                    appointment.status === 'cancelled' ? styles.statusCancelled :
                    styles.statusDefault
                  ]}>
                    <Text style={styles.appointmentStatusText}>
                      {appointment.status === 'completed' ? 'Concluído' :
                       appointment.status === 'scheduled' ? 'Agendado' :
                       appointment.status === 'confirmed' ? 'Confirmado' :
                       appointment.status === 'cancelled' ? 'Cancelado' :
                       appointment.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.appointmentService}>
                  {appointment.service_type}
                </Text>
                <View style={styles.appointmentDateTime}>
                  <Calendar size={14} color="#666" />
                  <Text style={styles.appointmentDateTimeText}>
                    {formatDate(appointment.appointment_date)}
                  </Text>
                  <Clock size={14} color="#666" />
                  <Text style={styles.appointmentDateTimeText}>
                    {appointment.appointment_time.substring(0, 5)}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Create/Edit Availability Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isCreateModalVisible}
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingId ? 'Editar Disponibilidade' : 'Nova Disponibilidade'}
              </Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => {
                  setCreateModalVisible(false);
                  resetForm();
                }}
              >
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Data</Text>
              <TouchableOpacity 
                style={styles.datePickerButton}
                onPress={toggleDatePicker}
              >
                <Text style={styles.datePickerText}>
                  {selectedDate.toLocaleDateString('pt-BR')}
                </Text>
                <Calendar size={18} color="#666" />
              </TouchableOpacity>
                            {showDatePicker && (                Platform.OS === 'ios' ? (                  <DateTimePicker                    value={selectedDate}                    mode="date"                    display="spinner"                    onChange={handleDateChange}                    minimumDate={new Date()}                  />                ) : (                  <DateTimePicker                    value={selectedDate}                    mode="date"                    display="default"                    onChange={handleDateChange}                    minimumDate={new Date()}                  />                )              )}
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.formLabel}>Início</Text>
                <TouchableOpacity 
                  style={styles.datePickerButton}
                  onPress={toggleStartTimePicker}
                >
                  <Text style={styles.datePickerText}>
                    {startTime.toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: false
                    })}
                  </Text>
                  <Clock size={18} color="#666" />
                </TouchableOpacity>
                {showStartTimePicker && (
                  <DateTimePicker
                    value={startTime}
                    mode="time"
                    display="default"
                    onChange={handleStartTimeChange}
                  />
                )}
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Fim</Text>
                <TouchableOpacity 
                  style={styles.datePickerButton}
                  onPress={toggleEndTimePicker}
                >
                  <Text style={styles.datePickerText}>
                    {endTime.toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: false
                    })}
                  </Text>
                  <Clock size={18} color="#666" />
                </TouchableOpacity>
                {showEndTimePicker && (
                  <DateTimePicker
                    value={endTime}
                    mode="time"
                    display="default"
                    onChange={handleEndTimeChange}
                  />
                )}
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.formLabel}>Intervalo (min)</Text>
                <TextInput
                  style={styles.input}
                  value={intervalMinutes}
                  onChangeText={setIntervalMinutes}
                  keyboardType="number-pad"
                  placeholder="30"
                />
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Máx. Agendamentos</Text>
                <TextInput
                  style={styles.input}
                  value={maxAppointments}
                  onChangeText={setMaxAppointments}
                  keyboardType="number-pad"
                  placeholder="1"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <View style={styles.switchContainer}>
                <Text style={styles.formLabel}>Ativo</Text>
                <Switch
                  value={isActive}
                  onValueChange={setIsActive}
                  trackColor={{ false: '#ccc', true: '#007AFF' }}
                  thumbColor={isActive ? '#fff' : '#f4f3f4'}
                />
              </View>
            </View>

            <TouchableOpacity 
              style={styles.submitButton}
              onPress={editingId ? handleUpdateAvailability : handleCreateAvailability}
            >
              <Text style={styles.submitButtonText}>
                {editingId ? 'Atualizar' : 'Adicionar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Filter Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isFilterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { height: 'auto' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtrar Agendamentos</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setFilterModalVisible(false)}
              >
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Status</Text>
              <View style={styles.filterOptions}>
                {['scheduled', 'confirmed', 'completed', 'cancelled'].map((status) => (
                  <TouchableOpacity 
                    key={status}
                    style={[
                      styles.filterOption,
                      statusFilter === status && styles.filterOptionSelected
                    ]}
                    onPress={() => setStatusFilter(
                      statusFilter === status ? null : status
                    )}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      statusFilter === status && styles.filterOptionTextSelected
                    ]}>
                      {status === 'completed' ? 'Concluído' :
                       status === 'scheduled' ? 'Agendado' :
                       status === 'confirmed' ? 'Confirmado' :
                       status === 'cancelled' ? 'Cancelado' : status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Data</Text>
              <TouchableOpacity 
                style={styles.datePickerButton}
                onPress={toggleFilterDatePicker}
              >
                <Text style={styles.datePickerText}>
                  {dateFilter ? dateFilter.toLocaleDateString('pt-BR') : 'Selecionar data'}
                </Text>
                <Calendar size={18} color="#666" />
              </TouchableOpacity>
              {showFilterDatePicker && (
                <DateTimePicker
                  value={dateFilter || new Date()}
                  mode="date"
                  display="default"
                  onChange={handleFilterDateChange}
                />
              )}
            </View>

            <View style={styles.filterActions}>
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={clearFilters}
              >
                <Text style={styles.clearButtonText}>Limpar Filtros</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.applyButton}
                onPress={() => setFilterModalVisible(false)}
              >
                <Text style={styles.applyButtonText}>Aplicar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  },
  section: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 5,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f7ff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  filterButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 5,
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
  },
  availabilityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  availabilityInfo: {
    flex: 1,
  },
  availabilityDate: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  availabilityDateText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#333',
    marginLeft: 8,
  },
  availabilityTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  availabilityTimeText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666',
    marginLeft: 8,
  },
  availabilityDetails: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#999',
  },
  inactiveTag: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 5,
  },
  inactiveTagText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
  },
  availabilityActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
  },
  appointmentItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  appointmentInfo: {},
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  appointmentClient: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentClientText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#333',
    marginLeft: 8,
  },
  appointmentStatus: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  appointmentStatusText: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
  },
  appointmentService: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#333',
    marginBottom: 8,
  },
  appointmentDateTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentDateTimeText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#666',
    marginLeft: 5,
    marginRight: 10,
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
  statusCancelled: {
    backgroundColor: '#F44336',
  },
  statusDefault: {
    backgroundColor: '#9E9E9E',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  formGroup: {
    marginBottom: 15,
  },
  formLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
  },
  datePickerText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#333',
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 6,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  filterOption: {
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  filterOptionSelected: {
    backgroundColor: '#007AFF',
  },
  filterOptionText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666',
  },
  filterOptionTextSelected: {
    color: '#fff',
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  clearButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  applyButton: {
    backgroundColor: '#007AFF',
    borderRadius: 6,
    padding: 12,
    flex: 1,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
}); 