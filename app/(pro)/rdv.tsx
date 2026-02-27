// app/(pro)/rdv.tsx
import { useAuth } from '@/hooks/useAuth';
import bookingService from '@/services/booking.service';
import { toast } from '@/utils/toast';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Booking {
  id: string;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  service: {
    id: string;
    name: string;
    price: number;
  };
  appointmentDate: string;
  status: string;
}

export default function RdvList() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useLayoutEffect(() => {
    navigation.setOptions({ headerTitle: 'Gestion des Rendez-vous' });
  }, [navigation]);

  const loadBookings = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const data = await bookingService.getBookingsByProfessional(user.id);
      console.log('=== DEBUG RDV ===');
      console.log('Total bookings:', data.length);

      // Support multi-services
      const mapped = (data as any[]).map((b: any, index: number) => {
        console.log(`\nBooking ${index + 1}:`, {
          id: b.id,
          hasServices: !!b.services,
          servicesIsArray: Array.isArray(b.services),
          servicesLength: Array.isArray(b.services) ? b.services.length : 0,
          hasService: !!b.service,
          serviceName: b.service?.name,
        });

        const servicesArray = Array.isArray(b.services) ? b.services : (b.service ? [b.service] : []);
        const serviceLabel = servicesArray.length
          ? servicesArray.map((s: any) => s.name).filter(Boolean).join(' + ')
          : (b.service?.name || '');
        const computedTotal = servicesArray.reduce((sum: number, s: any) => sum + (Number(s.price) || 0), 0);

        console.log('Computed:', { serviceLabel, servicesCount: servicesArray.length, total: computedTotal });

        return {
          ...b,
          service: {
            ...b.service,
            name: serviceLabel,
            price: computedTotal || b.service?.price || 0,
          },
        };
      });
      setBookings(mapped);
    } catch (error) {
      console.error('Erreur lors du chargement des RDV:', error);
      toast.error('Impossible de charger les rendez-vous');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadBookings();
    }, [loadBookings])
  );

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      'confirmé': 'Confirmé',
      'confirmed': 'Confirmé',
      'en attente': 'En attente',
      'pending': 'En attente',
      'terminé': 'Terminé',
      'completed': 'Terminé',
      'annulé': 'Annulé',
      'cancelled': 'Annulé',
    };
    return statusMap[status.toLowerCase()] || 'En attente';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCancelBooking = async (id: string) => {
    Alert.alert(
      'Annuler le rendez-vous',
      'Êtes-vous sûr de vouloir annuler ce rendez-vous ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            try {
              await bookingService.updateBookingStatus(id, 'annulé');
              toast.success('Le rendez-vous a été annulé');
              loadBookings();
            } catch (error) {
              console.error('Erreur lors de l\'annulation:', error);
              toast.error('Impossible d\'annuler le rendez-vous');
            }
          }
        }
      ]
    );
  };

  const handleCompleteBooking = async (id: string, appointmentDate: string) => {
    const now = new Date();
    const rdvDate = new Date(appointmentDate);

    // Vérifier si la date du rendez-vous est passée
    if (rdvDate > now) {
      toast.info('Vous ne pouvez pas terminer un rendez-vous avant la date et l\'heure prévues.');
      return;
    }

    Alert.alert(
      'Terminer le rendez-vous',
      'Confirmez-vous que la prestation a été effectuée ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, terminer',
          onPress: async () => {
            try {
              await bookingService.updateBookingStatus(id, 'terminé');
              toast.success('Le rendez-vous a été marqué comme terminé');
              loadBookings();
            } catch (error) {
              console.error('Erreur lors de la finalisation:', error);
              toast.error('Impossible de terminer le rendez-vous');
            }
          }
        }
      ]
    );
  };

  const canCompleteBooking = (appointmentDate: string) => {
    const now = new Date();
    const rdvDate = new Date(appointmentDate);
    return rdvDate <= now;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E64A19" />
        <Text style={styles.loadingText}>Chargement des rendez-vous...</Text>
      </View>
    );
  }

  if (bookings.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="calendar-outline" size={60} color="#ccc" />
        <Text style={styles.emptyText}>Aucun rendez-vous</Text>
      </View>
    );
  }

  // Trier les réservations : confirmé > en attente > terminé > annulé
  const sortedBookings = [...bookings].sort((a, b) => {
    const statusOrder: Record<string, number> = {
      'confirmé': 1,
      'confirmed': 1,
      'en attente': 2,
      'pending': 2,
      'terminé': 3,
      'completed': 3,
      'annulé': 4,
      'cancelled': 4,
    };

    const orderA = statusOrder[a.status.toLowerCase()] || 5;
    const orderB = statusOrder[b.status.toLowerCase()] || 5;

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    // Si même statut, trier par date (plus proche en premier)
    return new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime();
  });

  return (
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {sortedBookings.map(booking => {
          const isConfirmed = booking.status.toLowerCase() === 'confirmé' || booking.status.toLowerCase() === 'confirmed';
          const isCompleted = booking.status.toLowerCase() === 'terminé' || booking.status.toLowerCase() === 'completed';
          const isCancelled = booking.status.toLowerCase() === 'annulé' || booking.status.toLowerCase() === 'cancelled';

          return (
            <View key={booking.id} style={styles.rdvCard}>
              {/* Section principale */}
              <View style={styles.mainSection}>
                <View style={styles.leftSection}>
                  <View style={styles.avatar}>
                    <Ionicons name="person" size={20} color="#E64A19" />
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.name}>{`${booking.client.firstName} ${booking.client.lastName}`}</Text>
                    <Text style={styles.service}>{booking.service.name}</Text>
                    <View style={styles.dateRow}>
                      <Ionicons name="calendar-outline" size={14} color="#999" />
                      <Text style={styles.date}>{formatDate(booking.appointmentDate)}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.rightSection}>
                  <Text style={styles.price}>{booking.service.price.toLocaleString()} XOF</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      isConfirmed ? styles.confirmed :
                      isCompleted ? styles.completed :
                      isCancelled ? styles.cancelled :
                      styles.pending,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        (isConfirmed || isCompleted) ? styles.confirmedText : styles.pendingText,
                      ]}
                    >
                      {getStatusLabel(booking.status)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Boutons d'action - uniquement si confirmé ou en attente */}
              {(isConfirmed || (!isCancelled && !isCompleted)) && (
                <View style={styles.actionsSection}>
                  {isConfirmed && (
                    <>
                      <TouchableOpacity
                        style={[
                          styles.completeButton,
                          !canCompleteBooking(booking.appointmentDate) && styles.disabledButton
                        ]}
                        onPress={() => handleCompleteBooking(booking.id, booking.appointmentDate)}
                      >
                        <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                        <Text style={styles.buttonText}>Terminer</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => handleCancelBooking(booking.id)}
                      >
                        <Ionicons name="close-circle-outline" size={18} color="#fff" />
                        <Text style={styles.buttonText}>Annuler</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  {booking.client.phone && (
                    <TouchableOpacity style={styles.iconButton}>
                      <Ionicons name="call-outline" size={20} color="#E64A19" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.iconButton}>
                    <Ionicons name="chatbubble-outline" size={20} color="#E64A19" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#666' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { marginTop: 12, fontSize: 16, color: '#999' },
  rdvCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  mainSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  leftSection: { flexDirection: 'row', flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF5F5', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  info: { flex: 1, paddingRight: 8 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  service: { fontSize: 15, color: '#E64A19', marginTop: 3, fontWeight: '600', flexWrap: 'wrap' },
  dateRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  date: { fontSize: 13, color: '#333', marginLeft: 4, fontWeight: '500' },
  rightSection: { alignItems: 'flex-end' },
  price: { fontSize: 15, fontWeight: 'bold', color: '#E64A19', marginBottom: 8 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  confirmed: { backgroundColor: '#4CAF50' },
  completed: { backgroundColor: '#2196F3' },
  cancelled: { backgroundColor: '#F44336' },
  pending: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#FF9800' },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  confirmedText: { color: '#fff' },
  pendingText: { color: '#FF9800' },
  actionsSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  completeButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  disabledButton: {
    backgroundColor: '#999',
    opacity: 0.5,
  },
  cancelButton: {
    backgroundColor: '#F44336',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
