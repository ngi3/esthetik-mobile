// app/(pro)/validation.tsx
import { useAuth } from '@/hooks/useAuth';
import bookingService from '@/services/booking.service';
import { toast } from '@/utils/toast';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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

export default function ValidationScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useLayoutEffect(() => {
    navigation.setOptions({ headerTitle: 'Validation' });
  }, [navigation]);

  const loadPendingBookings = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const data = await bookingService.getBookingsByProfessional(user.id);
      // Filtrer uniquement les réservations en attente
      const pending = (data as any[]).filter(
        (b: any) => b.status.toLowerCase() === 'en attente' || b.status.toLowerCase() === 'pending'
      ).map((b: any) => {
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
      setBookings(pending);
    } catch (error) {
      console.error('Erreur lors du chargement des demandes:', error);
      toast.error('Impossible de charger les demandes de validation');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadPendingBookings();
  }, [loadPendingBookings]);

  const handleValidate = async (id: string) => {
    try {
      await bookingService.updateBookingStatus(id, 'confirmé');
      toast.success('Réservation validée avec succès');
      // Recharger immédiatement pour mettre à jour l'écran et les compteurs
      await loadPendingBookings();
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      toast.error('Impossible de valider la réservation');
    }
  };

  const handleRefuse = async (id: string) => {
    try {
      await bookingService.updateBookingStatus(id, 'refusé');
      toast.info('Réservation refusée');
      // Recharger immédiatement
      await loadPendingBookings();
    } catch (error) {
      console.error('Erreur lors du refus:', error);
      toast.error('Impossible de refuser la réservation');
    }
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E64A19" />
        <Text style={styles.loadingText}>Chargement des demandes...</Text>
      </View>
    );
  }

  if (bookings.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="checkmark-done-outline" size={60} color="#ccc" />
        <Text style={styles.emptyText}>Aucune demande en attente</Text>
        <Text style={styles.emptySubtext}>Les nouvelles demandes apparaîtront ici</Text>
      </View>
    );
  }

  return (
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Demandes de Réservation</Text>
          <Text style={styles.sectionSubtitle}>Validez ou refusez les demandes de vos clients</Text>
        </View>

        {bookings.map((booking) => (
          <View key={booking.id} style={styles.requestCard}>
            <View style={styles.cardHeader}>
              <View style={styles.leftSection}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={20} color="#E64A19" />
                </View>
                <View style={styles.info}>
                  <Text style={styles.name}>{`${booking.client.firstName} ${booking.client.lastName}`}</Text>
                  <Text style={styles.service} numberOfLines={2}>{booking.service.name}</Text>
                  <View style={styles.metaRow}>
                    <Ionicons name="calendar-outline" size={14} color="#999" />
                    <Text style={styles.metaText}>{formatDate(booking.appointmentDate)}</Text>
                  </View>
                  {booking.client.phone && (
                    <View style={styles.metaRow}>
                      <Ionicons name="call-outline" size={14} color="#999" />
                      <Text style={styles.metaText}>{booking.client.phone}</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.rightSection}>
                <Text style={styles.price}>{booking.service.price.toLocaleString()} XOF</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>En attente</Text>
                </View>
              </View>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.validateButton}
                onPress={() => handleValidate(booking.id)}
              >
                <Ionicons name="checkmark" size={18} color="#fff" />
                <Text style={styles.validateText}>Valider</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.refuseButton}
                onPress={() => handleRefuse(booking.id)}
              >
                <Ionicons name="close" size={18} color="#fff" />
                <Text style={styles.refuseText}>Refuser</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1, paddingHorizontal: 16, paddingTop: 16, backgroundColor: '#fdf8f5' },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#666' },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { marginTop: 12, fontSize: 16, color: '#999', fontWeight: '600' },
  emptySubtext: { marginTop: 4, fontSize: 14, color: '#ccc' },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  sectionSubtitle: { fontSize: 14, color: '#666', marginTop: 4 },

  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#fdf2f8',
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },

  leftSection: { flexDirection: 'row', flex: 1, marginRight: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FDF2F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  service: { fontSize: 14, color: '#666', marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  metaText: { fontSize: 12, color: '#999', marginLeft: 4 },

  rightSection: { alignItems: 'flex-end', minWidth: 100 },
  price: { fontSize: 15, fontWeight: 'bold', color: '#E64A19', marginBottom: 6 },
  statusBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: { fontSize: 11, color: '#666', fontWeight: '600' },

  actionRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 0,
  },
  validateButton: {
    backgroundColor: '#FFC107',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  validateText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  refuseButton: {
    backgroundColor: '#E53935',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  refuseText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
});
