import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, Modal } from 'react-native';
import { useStore } from '@/store';
import { Bell, MapPin, PenTool as Tool, ShoppingBag, Calendar, Shield, ChevronRight, X } from 'lucide-react-native';

const categories = [
  { 
    id: 'parts', 
    name: 'Peças', 
    icon: Tool,
    color: '#FF6B6B',
    description: 'Peças originais',
  },
  { 
    id: 'accessories', 
    name: 'Acessórios', 
    icon: ShoppingBag,
    color: '#4ECDC4',
    description: 'Personalize seu carro',
  },
  { 
    id: 'services', 
    name: 'Serviços', 
    icon: Calendar,
    color: '#45B7D1',
    description: 'Agendamento fácil',
  },
  { 
    id: 'plans', 
    name: 'Planos', 
    icon: Shield,
    color: '#96CEB4',
    description: 'Proteção completa',
  },
];

export default function HomeScreen() {
  const user = useStore((state) => state.user);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleCategoryPress = (category) => {
    setSelectedCategory(category);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedCategory(null);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Olá, {user?.carModel?.split(' ')[0]}</Text>
            <View style={styles.locationContainer}>
              <MapPin size={16} color="#fff" />
              <Text style={styles.location}>{user?.location}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Bell size={24} color="#fff" />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>
        <View style={styles.carInfo}>
          <View style={styles.carDetails}>
            <Image 
              source={{ uri: 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg' }}
              style={styles.carImage}
            />
            <View style={styles.carText}>
              <Text style={styles.carInfoText}>
                {user?.carModel} • {user?.carYear}
              </Text>
              <Text style={styles.licensePlate}>{user?.licensePlate}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.categoriesContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categorias</Text>
        </View>
        <View style={styles.categoriesGrid}>
          {categories.map((category) => (
            <TouchableOpacity 
              key={category.id} 
              style={styles.categoryCard}
              onPress={() => handleCategoryPress(category)}
            >
              <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                {<category.icon size={24} color="#fff" />}
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={styles.categoryDescription}>{category.description}</Text>
              <ChevronRight size={16} color="#666" style={styles.categoryArrow} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedCategory?.name}</Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDescription}>
              Content for {selectedCategory?.name} will be displayed here.
            </Text>
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
  header: {
    backgroundColor: '#007AFF',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 28,
    color: '#fff',
    fontFamily: 'Poppins-Bold',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    color: '#fff',
    opacity: 0.9,
    marginLeft: 4,
    fontFamily: 'Inter-Regular',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  carInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
  },
  carDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  carImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  carText: {
    flex: 1,
  },
  carInfoText: {
    color: '#fff',
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
  licensePlate: {
    color: '#fff',
    opacity: 0.9,
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    marginTop: 2,
  },
  categoriesContainer: {
    padding: 20,
  },
  sectionHeader: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    color: '#1a1a1a',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: '47%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#666',
  },
  categoryArrow: {
    position: 'absolute',
    right: 16,
    top: 16,
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
  closeButton: {
    padding: 8,
  },
  modalDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#666',
  },
});