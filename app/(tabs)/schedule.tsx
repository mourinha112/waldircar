import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar as CalendarIcon, Clock, PenTool as Tools, ChevronRight } from 'lucide-react-native';

const services = [
  {
    id: '1',
    name: 'Troca de Óleo',
    duration: '1h',
    price: 'R$ 150,00',
    description: 'Troca completa com filtro de óleo',
  },
  {
    id: '2',
    name: 'Revisão Geral',
    duration: '3h',
    price: 'R$ 350,00',
    description: '40 pontos de verificação',
  },
  {
    id: '3',
    name: 'Alinhamento',
    duration: '1h30',
    price: 'R$ 120,00',
    description: 'Alinhamento e balanceamento',
  },
  {
    id: '4',
    name: 'Freios',
    duration: '2h',
    price: 'R$ 250,00',
    description: 'Revisão completa do sistema de freios',
  },
];

const timeSlots = [
  '08:00', '09:00', '10:00', '11:00',
  '13:00', '14:00', '15:00', '16:00',
];

export default function ScheduleScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedService, setSelectedService] = useState('');

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Agendar Serviço</Text>
        <Text style={styles.subtitle}>Escolha o serviço, data e horário</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Serviços Disponíveis</Text>
        <View style={styles.servicesContainer}>
          {services.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={[
                styles.serviceCard,
                selectedService === service.id && styles.selectedService,
              ]}
              onPress={() => setSelectedService(service.id)}
            >
              <View style={styles.serviceHeader}>
                <Tools
                  size={20}
                  color={selectedService === service.id ? '#fff' : '#007AFF'}
                />
                <Text
                  style={[
                    styles.serviceName,
                    selectedService === service.id && styles.selectedText,
                  ]}
                >
                  {service.name}
                </Text>
              </View>
              <Text
                style={[
                  styles.serviceDescription,
                  selectedService === service.id && styles.selectedText,
                ]}
              >
                {service.description}
              </Text>
              <View style={styles.serviceFooter}>
                <View style={styles.serviceInfo}>
                  <Clock
                    size={16}
                    color={selectedService === service.id ? '#fff' : '#666'}
                  />
                  <Text
                    style={[
                      styles.serviceDuration,
                      selectedService === service.id && styles.selectedText,
                    ]}
                  >
                    {service.duration}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.servicePrice,
                    selectedService === service.id && styles.selectedText,
                  ]}
                >
                  {service.price}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Horários Disponíveis</Text>
        <View style={styles.timeSlotsContainer}>
          {timeSlots.map((time) => (
            <TouchableOpacity
              key={time}
              style={[
                styles.timeSlot,
                selectedTime === time && styles.selectedTimeSlot,
              ]}
              onPress={() => setSelectedTime(time)}
            >
              <Text
                style={[
                  styles.timeSlotText,
                  selectedTime === time && styles.selectedTimeSlotText,
                ]}
              >
                {time}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.scheduleButton}>
        <Text style={styles.scheduleButtonText}>Confirmar Agendamento</Text>
        <ChevronRight size={20} color="#fff" />
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
  title: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Inter-Regular',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 16,
  },
  servicesContainer: {
    gap: 12,
  },
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedService: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  serviceName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter-Regular',
    marginBottom: 12,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  serviceDuration: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter-Regular',
  },
  servicePrice: {
    fontSize: 16,
    color: '#007AFF',
    fontFamily: 'Poppins-SemiBold',
  },
  selectedText: {
    color: '#fff',
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeSlot: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedTimeSlot: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  timeSlotText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1a1a1a',
  },
  selectedTimeSlotText: {
    color: '#fff',
  },
  scheduleButton: {
    margin: 20,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    marginRight: 8,
  },
});