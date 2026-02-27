import { useAuth } from '@/hooks/useAuth';
import bookingService from '@/services/booking.service';
import serviceService from '@/services/service.service';
import { getImageSource } from '@/utils/image';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
// import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Type littéral pour les paramètres de la route
type BookingScreenParams = {
  id?: string;
  name?: string;
  salon?: string;
  phone?: string;
  email?: string;
  image?: string;
};

export default function BookingScreen() {
  // Cast explicite pour s'assurer que useLocalSearchParams accepte le type
  const params = useLocalSearchParams() as BookingScreenParams;
  const { id, name, salon, phone, email, image } = params;
  const router = useRouter();
  const { user } = useAuth();

  // États pour gérer les sélections
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingServices, setLoadingServices] = useState(true);
  const [services, setServices] = useState<{ id: string; name: string; price: number }[]>([]);

  // Charger les services du professionnel
  useEffect(() => {
    const load = async () => {
      try {
        if (!id) return;
  const data = await serviceService.getServicesByProfessionalId(id);
  setServices(data.map((s: any) => ({ id: s.id, name: s.name, price: Number(s.price) || 0 })));
      } catch (e) {
        console.error('Error loading services for booking:', e);
      } finally {
        setLoadingServices(false);
      }
    };
    load();
  }, [id]);

  // Utilisation minimale des variables pour éviter les avertissements ESLint
  console.log('ID:', id, 'Phone:', phone, 'Email:', email);

  const toggleService = (serviceId: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );
  };

  const totalPrice = selectedServiceIds.reduce((sum, sid) => {
    const svc = services.find((s) => s.id === sid);
    return sum + (svc?.price || 0);
  }, 0);

  const handleConfirm = async () => {
    if (!id || selectedServiceIds.length === 0 || !user?.id) return;
    try {
      setSubmitting(true);
      // Composer la date/heure en ISO
      const appointmentDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        time.getHours(),
        time.getMinutes(),
        0,
        0
      ).toISOString();

      await bookingService.createBooking({
        clientId: user.id,
        professionalId: id,
        // Pour compatibilité backend actuel: envoyer serviceId (premier service) + serviceIds
        serviceId: selectedServiceIds[0],
        serviceIds: selectedServiceIds,
        totalPrice,
        appointmentDate,
        comment,
      });

      alert('Réservation confirmée !');
      router.push('/(tabs)/clientspace');
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Erreur lors de la réservation');
    } finally {
      setSubmitting(false);
    }
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const onChangeTime = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      setTime(selectedTime);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#E64A19" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Réservation</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profileSection}>
        <Image
          source={getImageSource(image)}
          style={styles.profileImage}
          defaultSource={require('../assets/images/salon1.png')}
        />
        <Text style={styles.professionalName}>{name || 'Nom inconnu'}</Text>
        <Text style={styles.salonName}>{salon || 'Salon inconnu'}</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Services</Text>
        <View style={styles.serviceList}>
          {loadingServices ? (
            <Text style={{ color: '#666' }}>Chargement des services…</Text>
          ) : (
            services.map((service) => {
              const checked = selectedServiceIds.includes(service.id);
              return (
                <TouchableOpacity
                  key={service.id}
                  style={[styles.serviceItem, checked && styles.serviceItemSelected]}
                  onPress={() => toggleService(service.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                    {checked && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                  </View>
                  <Text style={styles.servicePrice}>{service.price.toLocaleString('fr-FR')} XOF</Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{totalPrice.toLocaleString('fr-FR')} XOF</Text>
        </View>

        <Text style={styles.label}>Date</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.inputText}>{date.toLocaleDateString('fr-FR')}</Text>
          <Ionicons name="calendar-outline" size={20} color="#E64A19" />
        </TouchableOpacity>
        {showDatePicker && (
          <View style={styles.datePickerContainer}>
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onChangeDate}
              minimumDate={new Date()}
            />
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.doneButtonText}>Terminé</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <Text style={styles.label}>Heure</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowTimePicker(true)}>
          <Text style={styles.inputText}>{time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</Text>
          <Ionicons name="time-outline" size={20} color="#E64A19" />
        </TouchableOpacity>
        {showTimePicker && (
          <View style={styles.datePickerContainer}>
            <DateTimePicker
              value={time}
              mode="time"
              is24Hour
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onChangeTime}
            />
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => setShowTimePicker(false)}
              >
                <Text style={styles.doneButtonText}>Terminé</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <Text style={styles.label}>Commentaires</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={comment}
          onChangeText={setComment}
          placeholder="Ajoutez un commentaire (optionnel)"
          placeholderTextColor="#999"
          multiline
        />

        <TouchableOpacity
          style={[styles.confirmButton, (selectedServiceIds.length === 0 || !date || !time || submitting) && styles.disabledButton]}
          onPress={handleConfirm}
          disabled={selectedServiceIds.length === 0 || !date || !time || submitting}
        >
          <Text style={styles.confirmButtonText}>{submitting ? 'En cours...' : 'Confirmer la réservation'}</Text>
        </TouchableOpacity>
      </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  profileSection: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#E64A19',
  },
  professionalName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#E64A19',
    marginTop: 10,
  },
  salonName: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  selectedServiceContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  selectedServiceText: {
    fontSize: 16,
    color: '#333',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#fff',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  picker: {
    height: 50,
    color: '#333',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
    backgroundColor: '#fff',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  inputText: {
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  confirmButton: {
    backgroundColor: '#E64A19',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Multi-service UI
  serviceList: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 6,
    marginBottom: 12,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  serviceItemSelected: {
    backgroundColor: '#FFF5F0',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E64A19',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#E64A19',
  },
  serviceName: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  servicePrice: {
    fontSize: 14,
    color: '#E64A19',
    fontWeight: '700',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E64A19',
  },
  datePickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  doneButton: {
    backgroundColor: '#E64A19',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
