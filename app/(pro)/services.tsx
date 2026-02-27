// app/(pro)/services.tsx
import { toast } from '@/utils/toast';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import serviceService from '../../services/service.service';
import { Service } from '../../types/service.types';

const durationOptions = [
  { label: '30 min', value: 30 },
  { label: '60 min', value: 60 },
  { label: '90 min', value: 90 },
  { label: '120 min', value: 120 },
  { label: '150 min', value: 150 },
  { label: '180 min', value: 180 },
];

export default function ServicesScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // Form fields
  const [serviceName, setServiceName] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState(60);
  const [description, setDescription] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({ headerTitle: 'Services' });
  }, [navigation]);

  // Charger les services au montage et après chaque modification
  useEffect(() => {
    loadServices();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadServices();
    }, [])
  );

  const loadServices = async () => {
    try {
      setLoading(true);
      const data = await serviceService.getMyServices();
      setServices(data);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Impossible de charger les services');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadServices();
    setRefreshing(false);
  };

  const openAddModal = () => {
    setEditMode(false);
    setSelectedService(null);
    resetForm();
    setModalVisible(true);
  };

  // Convertir une durée string du backend (ex: "60 min") en nombre de minutes
  const parseDuration = (durationStr: string): number => {
    const match = durationStr.match(/(\d+)/);
    return match ? parseInt(match[1]) : 60;
  };

  // Convertir un nombre de minutes en string pour le backend (ex: 60 -> "60 min")
  const formatDurationForBackend = (minutes: number): string => {
    return `${minutes} min`;
  };

  const openEditModal = (service: Service) => {
    setEditMode(true);
    setSelectedService(service);
    setServiceName(service.name);
    setDescription(service.description);
    setPrice(service.price.toString());
    setDuration(parseDuration(service.duration));
    setModalVisible(true);
  };

  const resetForm = () => {
    setServiceName('');
    setPrice('');
    setDuration(60);
    setDescription('');
  };

  const handleSaveService = async () => {
    if (!serviceName || !price || !description) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error('Le prix doit être un nombre valide');
      return;
    }

    if (!user?.id) {
      toast.error('Utilisateur non connecté');
      return;
    }

    try {
      const durationStr = formatDurationForBackend(duration);

      if (editMode && selectedService) {
        // Modification
        await serviceService.updateService(selectedService.id, {
          name: serviceName,
          description,
          price: priceNum,
          duration: durationStr,
        });
        toast.success('Service modifié avec succès !');
      } else {
        // Création
        await serviceService.createService({
          name: serviceName,
          description,
          price: priceNum,
          duration: durationStr,
          professionalId: user.id,
        });
        toast.success('Service créé avec succès !');
      }

      setModalVisible(false);
      resetForm();
      await loadServices();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Impossible de sauvegarder le service');
    }
  };

  const handleDelete = (service: Service) => {
    Alert.alert(
      'Confirmation',
      `Voulez-vous vraiment supprimer "${service.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await serviceService.deleteService(service.id);
              toast.success('Service supprimé');
              await loadServices();
            } catch (error: any) {
              toast.error(error?.response?.data?.message || 'Impossible de supprimer le service');
            }
          },
        },
      ]
    );
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString('fr-FR')} XOF`;
  };

  // Pour l'affichage : accepte soit un nombre de minutes soit une string du backend
  const formatDuration = (duration: number | string) => {
    const minutes = typeof duration === 'string' ? parseDuration(duration) : duration;
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h${mins}` : `${hours}h`;
  };

  if (loading && services.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E64A19" />
        <Text style={styles.loadingText}>Chargement des services...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#E64A19']} />
        }
      >
        {/* Bouton Nouveau Service */}
        <TouchableOpacity
          style={styles.newServiceButton}
          onPress={openAddModal}
        >
          <Text style={styles.newServiceText}>+ Nouveau Service</Text>
        </TouchableOpacity>

        {services.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cut-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Aucun service créé</Text>
            <Text style={styles.emptySubtext}>Ajoutez votre premier service pour commencer</Text>
          </View>
        ) : (
          /* Liste des services */
          services.map((service) => (
            <View key={service.id} style={styles.serviceCard}>
              <View style={styles.leftSection}>
                <View style={styles.iconWrapper}>
                  <Ionicons name="cut-outline" size={22} color="#E64A19" />
                </View>
                <View style={styles.info}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.serviceDesc}>{service.description}</Text>
                  <View style={styles.priceDuration}>
                    <Text style={styles.price}>{formatPrice(service.price)}</Text>
                    <Text style={styles.duration}> • {formatDuration(service.duration)}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => openEditModal(service)}
                >
                  <Ionicons name="pencil" size={18} color="#E64A19" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(service)}
                >
                  <Ionicons name="trash-outline" size={18} color="#E53935" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
  </ScrollView>

      {/* MODAL AJOUT SERVICE */}
      <Modal
        animationType="fade"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editMode ? 'Modifier le Service' : 'Ajouter un Service'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.inputName}
              placeholder="Nom du service"
              placeholderTextColor="#999"
              value={serviceName}
              onChangeText={setServiceName}
            />

            <TextInput
              style={styles.input}
              placeholder="Prix (XOF)"
              placeholderTextColor="#999"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />

            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={duration}
                onValueChange={(itemValue) => setDuration(itemValue)}
                style={styles.picker}
                dropdownIconColor="#666"
              >
                {durationOptions.map((opt) => (
                  <Picker.Item
                    key={opt.value}
                    label={opt.label}
                    value={opt.value}
                  />
                ))}
              </Picker>
            </View>

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description"
              placeholderTextColor="#999"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              style={[
                styles.addButton,
                (!serviceName || !price || !description) && styles.addButtonDisabled,
              ]}
              onPress={handleSaveService}
              disabled={!serviceName || !price || !description}
            >
              <Text style={styles.addButtonText}>{editMode ? 'Modifier' : 'Ajouter'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: '#fdf8f5',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fdf8f5',
    paddingVertical: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 8,
    textAlign: 'center',
  },

  newServiceButton: {
    backgroundColor: '#E64A19',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    alignSelf: 'flex-end',
    marginBottom: 24,
    elevation: 2,
  },
  newServiceText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },

  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },

  leftSection: { flexDirection: 'row', flex: 1 },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  info: { flex: 1 },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  serviceDesc: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  priceDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  price: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#E64A19',
  },
  duration: {
    fontSize: 13,
    color: '#999',
  },

  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E64A19',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E53935',
  },

  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fdf8f5',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },

  inputName: {
    borderWidth: 2,
    borderColor: '#2196F3',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },

  addButton: {
    backgroundColor: '#E64A19',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonDisabled: {
    backgroundColor: '#ccc',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
