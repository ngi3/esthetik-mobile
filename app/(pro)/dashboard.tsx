// app/(pro)/dashboard.tsx
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import bookingService from '../../services/booking.service';
import profileViewService from '../../services/profile-view.service';
import { userService } from '../../services/user.service';
import { toast } from '../../utils/toast';

const SPECIALITIES = [
  'Ongles', 'Coiffure', 'Soins visage', 'Maquillage',
  'Tresses', 'Extensions', 'Épilation', 'Massage', 'Nail Art',
];

interface Booking {
  id: string;
  client: {
    firstName: string;
    lastName: string;
  };
  service: {
    name: string;
    price: number;
  };
  appointmentDate: string;
  status: string;
}

export default function ProDashboard() {
  const [modalVisible, setModalVisible] = useState(false);
  const [clientName, setClientName] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePickerMode, setShowDatePickerMode] = useState<'date' | 'time' | 'datetime' | null>(null);
  const { user, setUser } = useAuth();
  const [selectedSpecialities, setSelectedSpecialities] = useState<string[]>(user?.specialities || []);
  const [savingSpecialities, setSavingSpecialities] = useState(false);
  const [salonName, setSalonName] = useState(user?.salon || '');
  const [savingSalon, setSavingSalon] = useState(false);

  // Stats professionnelles
  const [stats, setStats] = useState({
    profileViews: 0,
    totalBookings: 0,
    bookingsThisMonth: 0,
    averageRating: '0.0',
    totalRevenue: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Nouveaux états pour les RDV
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDateFilter, setShowDateFilter] = useState(false);

  const services = [
    { label: 'Manucure Classique', value: 'manucure' },
    { label: 'Nail Art', value: 'nailart' },
    { label: 'Pose de Vernis', value: 'vernis' },
    { label: 'Tresses Box Braids', value: 'tresses' },
    { label: 'Extension Cils', value: 'cils' },
  ];

  // Charger les RDV confirmés d'une date donnée
  const loadUpcomingBookings = useCallback(async (filterDate: Date) => {
    if (!user?.id) return;

    try {
      setLoadingBookings(true);
      const allBookings = await bookingService.getBookingsByProfessional(user.id);

      // Filtrer uniquement les RDV confirmés
      const confirmed = (allBookings as any[]).filter((b: any) =>
        b.status.toLowerCase() === 'confirmé' || b.status.toLowerCase() === 'confirmed'
      );

      // Filtrer par date sélectionnée (même jour)
      const filtered = confirmed.filter((b: any) => {
        const rdvDate = new Date(b.appointmentDate);
        return (
          rdvDate.getDate() === filterDate.getDate() &&
          rdvDate.getMonth() === filterDate.getMonth() &&
          rdvDate.getFullYear() === filterDate.getFullYear()
        );
      }).map((b: any) => {
        // Support multi-services
        const servicesArray = Array.isArray(b.services) ? b.services : (b.service ? [b.service] : []);
        const serviceLabel = servicesArray.length
          ? servicesArray.map((s: any) => s.name).filter(Boolean).join(' + ')
          : (b.service?.name || '');
        const computedTotal = servicesArray.reduce((sum: number, s: any) => sum + (Number(s.price) || 0), 0);

        return {
          ...b,
          service: {
            ...b.service,
            name: serviceLabel,
            price: computedTotal || b.service?.price || 0,
          },
        };
      });

      // Trier par heure
      filtered.sort((a: any, b: any) =>
        new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime()
      );

      setUpcomingBookings(filtered);
    } catch (error) {
      console.error('Erreur chargement RDV:', error);
    } finally {
      setLoadingBookings(false);
    }
  }, [user?.id]);

  // Charger les stats professionnelles
  const loadStats = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoadingStats(true);
      const data = await userService.getProStats();

      // Load profile view stats
      try {
        const viewStats = await profileViewService.getMyViews();
        setStats({
          ...data,
          profileViews: viewStats.total,
        });
      } catch (viewError) {
        console.log('Profile views not available:', viewError);
        setStats(data);
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    } finally {
      setLoadingStats(false);
    }
  }, [user?.id]);

  // Charger au montage et quand la date change
  useFocusEffect(
    useCallback(() => {
      loadUpcomingBookings(selectedDate);
      loadStats();
    }, [selectedDate, loadUpcomingBookings, loadStats])
  );

  // Ensure list refreshes immediately when the date changes (especially on iOS inline picker)
  useEffect(() => {
    loadUpcomingBookings(selectedDate);
  }, [selectedDate, loadUpcomingBookings]);

  const handleCreateRdv = () => {
    if (!clientName || !selectedService) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    const serviceLabel = services.find(s => s.value === selectedService)?.label || '';
    const formattedDate = date.toLocaleDateString('fr-FR');
    const formattedTime = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    toast.success(`${clientName} • ${serviceLabel} • ${formattedDate} ${formattedTime}`, { title: 'RDV créé' });
    setModalVisible(false);

    setClientName('');
    setSelectedService('');
    setDate(new Date());
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      if (!showDatePickerMode) return;
      if (event?.type === 'dismissed') {
        setShowDatePickerMode(null);
        return;
      }
      const picked = selectedDate || date;
      if (showDatePickerMode === 'date') {
        const newDate = new Date(date);
        newDate.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
        setDate(newDate);
        setShowDatePickerMode('time');
      } else if (showDatePickerMode === 'time') {
        const newDate = new Date(date);
        newDate.setHours(picked.getHours(), picked.getMinutes());
        setDate(newDate);
        setShowDatePickerMode(null);
      }
    } else {
      // iOS: mise à jour immédiate lors du changement
      if (selectedDate) {
        const picked = selectedDate;
        if (showDatePickerMode === 'date') {
          const newDate = new Date(date);
          newDate.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
          setDate(newDate);
        } else if (showDatePickerMode === 'time') {
          const newDate = new Date(date);
          newDate.setHours(picked.getHours(), picked.getMinutes());
          setDate(newDate);
        }
      }
      // Ne pas fermer automatiquement, l'utilisateur cliquera sur "Terminé"
    }
  };

  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: 'Tableau de bord',
      headerTitleAlign: Platform.OS === 'ios' ? 'left' : 'center',
      headerTitleStyle: { fontSize: 16 },
      headerBackTitleVisible: false,
      headerRightContainerStyle: { paddingRight: 8 },
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={{
            backgroundColor: '#E64A19',
            paddingHorizontal: Platform.OS === 'ios' ? 10 : 12,
            paddingVertical: Platform.OS === 'ios' ? 6 : 6,
            borderRadius: 14,
            flexDirection: 'row',
            alignItems: 'center',
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="add" size={16} color="#fff" style={{ marginRight: 4 }} />
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>
            {Platform.OS === 'ios' ? 'Nouveau' : 'Nouveau RDV'}
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  // Gestion sélection/déselection spécialité
  const toggleSpeciality = (spec: string) => {
    setSelectedSpecialities((prev) =>
      prev.includes(spec)
        ? prev.filter((s) => s !== spec)
        : [...prev, spec]
    );
  };

  // Sauvegarde côté backend
  const handleSaveSpecialities = async () => {
    setSavingSpecialities(true);
    try {
      const updated = await userService.updateMe({ specialities: selectedSpecialities });
      setUser(updated);
      toast.success('Vos spécialités ont été mises à jour !');
    } catch (e) {
      void e;
      toast.error("Impossible d'enregistrer les spécialités");
    } finally {
      setSavingSpecialities(false);
    }
  };

  // Sauvegarde nom du salon
  const handleSaveSalon = async () => {
    setSavingSalon(true);
    try {
      const updated = await userService.updateMe({ salon: salonName });
      setUser(updated);
      toast.success('Le nom de votre salon a été mis à jour !');
    } catch (e) {
      void e;
      toast.error("Impossible d'enregistrer le nom du salon");
    } finally {
      setSavingSalon(false);
    }
  };

  return (
    <>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Stats */}
        {loadingStats ? (
          <View style={styles.statsLoadingContainer}>
            <ActivityIndicator size="large" color="#E64A19" />
            <Text style={styles.statsLoadingText}>Chargement des statistiques...</Text>
          </View>
        ) : (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <Text style={styles.statLabel}>Vues du Profil</Text>
                <Ionicons name="eye-outline" size={20} color="#E64A19" />
              </View>
              <Text style={styles.statValue}>{stats.profileViews.toLocaleString()}</Text>
              <Text style={styles.statSubtext}>Total vues</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <Text style={styles.statLabel}>Réservations</Text>
                <FontAwesome5 name="calendar-check" size={18} color="#4CAF50" />
              </View>
              <Text style={styles.statValue}>{stats.totalBookings}</Text>
              <Text style={[styles.statChange, styles.positive]}>
                {stats.bookingsThisMonth} ce mois
              </Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <Text style={styles.statLabel}>Note Moyenne</Text>
                <Ionicons name="star" size={20} color="#FFC107" />
              </View>
              <Text style={styles.statValue}>{stats.averageRating}</Text>
              <Text style={styles.statSubtext}>
                {parseFloat(stats.averageRating) >= 4.5 ? 'Excellent !' : parseFloat(stats.averageRating) >= 4 ? 'Très bien' : 'Bien'}
              </Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <Text style={styles.statLabel}>Revenus (XOF)</Text>
                <MaterialIcons name="trending-up" size={20} color="#E64A19" />
              </View>
              <Text style={styles.statValue}>{stats.totalRevenue.toLocaleString()}</Text>
              <Text style={styles.statSubtext}>Total revenus</Text>
            </View>
          </View>
        )}

        {/* Prochains RDV */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-outline" size={22} color="#E64A19" />
            <Text style={styles.sectionTitle}>Prochains RDV</Text>
            <TouchableOpacity
              style={styles.dateFilterButton}
              onPress={() => setShowDateFilter(!showDateFilter)}
            >
              <Ionicons name="filter" size={20} color="#E64A19" />
              <Text style={styles.dateFilterText}>
                {selectedDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              </Text>
            </TouchableOpacity>
          </View>

          {showDateFilter && (
            <View style={styles.dateFilterContainer}>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={(event, date) => {
                  if (date) {
                    setSelectedDate(date);
                    if (Platform.OS === 'ios') {
                      // Auto-close inline picker on iOS after selection
                      setTimeout(() => setShowDateFilter(false), 0);
                    } else {
                      setShowDateFilter(false);
                    }
                  } else if ((event as any)?.type === 'dismissed') {
                    setShowDateFilter(false);
                  }
                }}
                minimumDate={new Date()}
              />
            </View>
          )}

          {loadingBookings ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#E64A19" />
              <Text style={styles.loadingText}>Chargement...</Text>
            </View>
          ) : upcomingBookings.length === 0 ? (
            <View style={styles.emptyRdvContainer}>
              <Ionicons name="calendar-outline" size={40} color="#ccc" />
              <Text style={styles.emptyRdvText}>Aucun RDV confirmé ce jour</Text>
            </View>
          ) : (
            upcomingBookings.map((booking) => (
              <View key={booking.id} style={styles.rdvCard}>
                <View>
                  <Text style={styles.rdvName}>
                    {`${booking.client.firstName} ${booking.client.lastName}`}
                  </Text>
                  <Text style={styles.rdvService}>{booking.service.name}</Text>
                  <Text style={styles.rdvDate}>
                    {new Date(booking.appointmentDate).toLocaleString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
                <View style={styles.rdvRight}>
                  <Text style={styles.rdvPrice}>
                    {booking.service.price.toLocaleString()} XOF
                  </Text>
                  <View style={[styles.statusBadge, styles.confirmed]}>
                    <Text style={[styles.statusText, styles.confirmedText]}>
                      Confirmé
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Performance */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="bar-chart" size={22} color="#4CAF50" />
            <Text style={styles.sectionTitle}>Performance</Text>
          </View>
          <View style={styles.chartPlaceholder}>
            <MaterialIcons name="bar-chart" size={50} color="#ccc" />
            <Text style={styles.chartText}>Graphique des performances</Text>
            <Text style={styles.chartSubtext}>Bientôt disponible</Text>
          </View>
        </View>

        {/* Gestion du Profil */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="settings-outline" size={22} color="#9C27B0" />
            <Text style={styles.sectionTitle}>Gestion du Profil</Text>
          </View>

          {/* Nom du salon */}
          <View style={styles.specialitiesBox}>
            <Text style={styles.specialitiesLabel}>Nom de votre salon</Text>
            <TextInput
              style={styles.salonInput}
              placeholder="Ex: Beauty Salon Paris"
              placeholderTextColor="#999"
              value={salonName}
              onChangeText={setSalonName}
              autoCapitalize="words"
            />
            <TouchableOpacity
              style={[styles.saveButton, savingSalon && styles.saveButtonDisabled]}
              onPress={handleSaveSalon}
              disabled={savingSalon}
            >
              {savingSalon ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Enregistrer le nom du salon</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Sélection des spécialités */}
          <View style={styles.specialitiesBox}>
            <Text style={styles.specialitiesLabel}>Vos spécialités</Text>
            <View style={styles.specialitiesList}>
              {SPECIALITIES.map((spec) => (
                <TouchableOpacity
                  key={spec}
                  style={[
                    styles.specialityTag,
                    selectedSpecialities.includes(spec) && styles.specialityTagSelected,
                  ]}
                  onPress={() => toggleSpeciality(spec)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.specialityText,
                      selectedSpecialities.includes(spec) && styles.specialityTextSelected,
                    ]}
                  >
                    {spec}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.saveButton, savingSpecialities && styles.saveButtonDisabled]}
              onPress={handleSaveSpecialities}
              disabled={savingSpecialities}
            >
              {savingSpecialities ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Enregistrer mes spécialités</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Action bannière existante... */}
          <TouchableOpacity
            style={styles.profileActionCard}
            onPress={() => router.push('/(pro)/banner')}
          >
            <View style={styles.profileActionLeft}>
              <Ionicons name="image-outline" size={24} color="#E64A19" />
              <View style={styles.profileActionText}>
                <Text style={styles.profileActionTitle}>Photo de Bannière</Text>
                <Text style={styles.profileActionSubtitle}>Personnalisez votre profil avec une bannière</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>

          {/* Action "À propos" */}
          <TouchableOpacity
            style={styles.profileActionCard}
            onPress={() => router.push('/(pro)/about')}
          >
            <View style={styles.profileActionLeft}>
              <Ionicons name="information-circle-outline" size={24} color="#2196F3" />
              <View style={styles.profileActionText}>
                <Text style={styles.profileActionTitle}>À propos</Text>
                <Text style={styles.profileActionSubtitle}>Présentation et horaires d&apos;ouverture</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal RDV */}
      <Modal animationType="fade" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouveau Rendez-vous</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>Créez un nouveau rendez-vous manuellement</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Nom du client"
              placeholderTextColor="#999"
              value={clientName}
              onChangeText={setClientName}
              autoCapitalize="words"
            />

            <View style={styles.pickerWrapper}>
              <Picker selectedValue={selectedService} onValueChange={setSelectedService} style={styles.picker}>
                <Picker.Item label="Sélectionner un service" value="" color="#999" />
                {services.map(s => <Picker.Item key={s.value} label={s.label} value={s.value} />)}
              </Picker>
            </View>

            <View style={styles.dateContainer}>
              <Text style={styles.label}>Date</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowDatePickerMode('date')}
              >
                <Text style={styles.dateText}>
                  {date.toLocaleDateString('fr-FR')}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#E64A19" />
              </TouchableOpacity>

              {showDatePickerMode === 'date' && (
                <View style={styles.pickerContainer}>
                  <DateTimePicker
                    value={date}
                    mode="date"
                    is24Hour
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                    minimumDate={new Date()}
                  />
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity
                      style={styles.doneButton}
                      onPress={() => setShowDatePickerMode(null)}
                    >
                      <Text style={styles.doneButtonText}>Terminé</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            <View style={styles.dateContainer}>
              <Text style={styles.label}>Heure</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowDatePickerMode('time')}
              >
                <Text style={styles.dateText}>
                  {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Ionicons name="time-outline" size={20} color="#E64A19" />
              </TouchableOpacity>

              {showDatePickerMode === 'time' && (
                <View style={styles.pickerContainer}>
                  <DateTimePicker
                    value={date}
                    mode="time"
                    is24Hour
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                  />
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity
                      style={styles.doneButton}
                      onPress={() => setShowDatePickerMode(null)}
                    >
                      <Text style={styles.doneButtonText}>Terminé</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.createButton, (!clientName || !selectedService) && styles.createButtonDisabled]}
              onPress={handleCreateRdv}
              disabled={!clientName || !selectedService}
            >
              <Text style={styles.createButtonText}>Créer le RDV</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  statsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  statCard: { backgroundColor: '#fff', padding: 16, borderRadius: 16, width: '48%', marginBottom: 12, elevation: 2 },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statLabel: { fontSize: 13, color: '#666' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  statChange: { fontSize: 12, marginTop: 4 },
  positive: { color: '#4CAF50' },
  statSubtext: { fontSize: 12, color: '#4CAF50', marginTop: 4, fontWeight: '600' },

  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginLeft: 8, flex: 1 },
  dateFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  dateFilterText: {
    fontSize: 13,
    color: '#E64A19',
    fontWeight: '600',
  },
  dateFilterContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 8,
    elevation: 2,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
  },
  emptyRdvContainer: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyRdvText: {
    marginTop: 12,
    color: '#999',
    fontSize: 14,
  },

  rdvCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 1 },
  rdvName: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  rdvService: { fontSize: 13, color: '#666', marginTop: 2 },
  rdvDate: { fontSize: 12, color: '#999', marginTop: 2 },
  rdvRight: { alignItems: 'flex-end' },
  rdvPrice: { fontSize: 14, fontWeight: 'bold', color: '#E64A19', marginBottom: 6 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  confirmed: { backgroundColor: '#E64A19' },
  pending: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd' },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  confirmedText: { color: '#fff' },
  pendingText: { color: '#666' },

  chartPlaceholder: { backgroundColor: '#fff', padding: 30, borderRadius: 12, alignItems: 'center', justifyContent: 'center', height: 200, elevation: 1 },
  chartText: { fontSize: 16, color: '#666', marginTop: 12 },
  chartSubtext: { fontSize: 13, color: '#999', marginTop: 4 },

  profileActionCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 1,
    marginBottom: 10,
  },
  profileActionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileActionText: {
    marginLeft: 12,
    flex: 1,
  },
  profileActionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  profileActionSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fdf8f5', borderRadius: 16, padding: 20, width: '100%', maxWidth: 400, elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  closeButton: { padding: 4 },
  modalSubtitle: { fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' },
  modalInput: { borderWidth: 2, borderColor: '#2196F3', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, backgroundColor: '#fff', marginBottom: 16 },
  pickerWrapper: { borderWidth: 2, borderColor: '#2196F3', borderRadius: 12, marginBottom: 16, overflow: 'hidden' },
  picker: { height: 50, backgroundColor: '#fff' },
  dateContainer: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  dateInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 2, borderColor: '#2196F3', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff' },
  dateText: { fontSize: 16, color: '#333' },
  createButton: { backgroundColor: '#E64A19', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  createButtonDisabled: { backgroundColor: '#ccc' },
  createButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  specialitiesBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 18,
    elevation: 1,
  },
  specialitiesLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#E64A19',
    marginBottom: 10,
  },
  salonInput: {
    borderWidth: 2,
    borderColor: '#2196F3',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 12,
    color: '#333',
  },
  specialitiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  specialityTag: {
    backgroundColor: '#eee',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  specialityTagSelected: {
    backgroundColor: '#E64A19',
  },
  specialityText: {
    color: '#666',
    fontWeight: '500',
  },
  specialityTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#E64A19',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  statsLoadingContainer: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    elevation: 1,
  },
  statsLoadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 14,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    marginTop: 8,
    elevation: 2,
  },
  doneButton: {
    backgroundColor: '#E64A19',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
