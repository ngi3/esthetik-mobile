import { useAuth } from '@/hooks/useAuth';
import bookingService from '@/services/booking.service';
import favoriteService, { FavoriteProfessional } from '@/services/favorite.service';
import reviewService from '@/services/review.service';
import { userService } from '@/services/user.service';
import { toast } from '@/utils/toast';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Types
interface Reservation {
  id: string;
  name: string;
  service: string;
  date: string;
  time: string;
  location: string;
  price: string;
  status: string;
  statusColor: string;
  professionalId: string;
  reviewed?: boolean;
}

interface Favorite {
  id: string;
  name: string;
  profession: string;
  rating: number;
}

// Helpers
const getBookingStatusLabel = (status?: string) => {
  const s = (status || '').toLowerCase();
  if (['confirmé', 'confirmed', 'approved', 'accepted'].includes(s)) return 'Confirmé';
  if (['en attente', 'pending', 'awaiting', 'waiting'].includes(s)) return 'En Attente';
  if (['terminé', 'completed', 'finished'].includes(s)) return 'Terminé';
  if (['annulé', 'cancelled', 'canceled'].includes(s)) return 'Annulé';
  return 'En Attente'; // Par défaut, considérer comme en attente plutôt qu'annulé
};
const getBookingStatusColor = (status?: string) => {
  const s = (status || '').toLowerCase();
  if (['confirmé', 'confirmed', 'approved', 'accepted'].includes(s)) return '#4CAF50';
  if (['en attente', 'pending', 'awaiting', 'waiting'].includes(s)) return '#FF9800';
  if (['terminé', 'completed', 'finished'].includes(s)) return '#2196F3';
  if (['annulé', 'cancelled', 'canceled'].includes(s)) return '#F44336';
  return '#FF9800'; // Par défaut, couleur orange pour en attente
};
const formatDate = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const formatTime = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};


const ReservationsScreen = () => {
  const { user } = useAuth();
  const [data, setData] = useState<Reservation[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Reservation | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadBookings = async () => {
    try {
      const [bookings, myReviews] = await Promise.all([
        bookingService.getMyBookings(),
        reviewService.getMyReviews().catch(() => [] as any[]),
      ]);

      const reviewedBookingIds = new Set(
        (myReviews as any[])
          .map((r: any) => r?.booking?.id)
          .filter((id: any) => typeof id === 'string' && id.length > 0)
      );

      const mapped: Reservation[] = bookings.map((b: any) => {
        const professional = b.professional || {};
        const service = b.service || {};
        // Support multi-services
        const servicesArray = Array.isArray(b.services)
          ? b.services
          : (b.service ? [b.service] : []);
        const serviceLabel = servicesArray.length
          ? servicesArray.map((s: any) => s.name).filter(Boolean).join(' + ')
          : (service.name || b.serviceName || '');
        const computedTotal = servicesArray.reduce((sum: number, s: any) => sum + (Number(s.price) || 0), 0);
        return {
          id: b.id,
          name: professional.salon || `${professional.firstName || ''} ${professional.lastName || ''}`.trim() || 'Professionnel',
          service: serviceLabel,
          date: formatDate(b.appointmentDate || b.dateTime),
          time: formatTime(b.appointmentDate || b.dateTime),
          location: professional.location || b.location || 'Non spécifié',
          price: computedTotal
            ? `${computedTotal.toLocaleString('fr-FR')} XOF`
            : (service.price ? `${service.price.toLocaleString('fr-FR')} XOF` : (b.price ? `${b.price.toLocaleString('fr-FR')} XOF` : '')),
          status: getBookingStatusLabel(b.status as string),
          statusColor: getBookingStatusColor(b.status as string),
          professionalId: professional.id || b.professionalId || '',
          reviewed: reviewedBookingIds.has(b.id),
        };
      });
      setData(mapped);
    } catch (e) {
      console.error('Error loading bookings', e);
    }
  };

  const handleOpenReviewModal = (booking: Reservation) => {
    setSelectedBooking(booking);
    setRating(5);
    setComment('');
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedBooking) return;

    if (!comment.trim()) {
      toast.info('Veuillez saisir un commentaire pour votre avis.');
      return;
    }

    if (!user?.id) {
      toast.error('Vous devez être authentifié pour publier un avis.');
      return;
    }

      try {
      setSubmitting(true);
      await reviewService.createReview({
        professionalId: selectedBooking.professionalId,
        rating,
          comment: comment.trim(),
          bookingId: selectedBooking.id,
          authorId: user?.id as string,
      });
  toast.success('Votre avis a été publié avec succès.');
        // Marquer cette réservation comme déjà notée localement
        setData((prev) => prev.map((b) => b.id === selectedBooking.id ? { ...b, reviewed: true } : b));
        setShowReviewModal(false);
        setSelectedBooking(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Impossible de publier l\'avis');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleCancelClientBooking = async (id: string) => {
    Alert.alert(
      'Annuler la réservation',
      'Êtes-vous sûr de vouloir annuler cette réservation ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            try {
              await bookingService.updateBookingStatus(id, 'annulé');
              toast.success('Votre réservation a été annulée');
              loadBookings(); // Recharger la liste
            } catch (error) {
              console.error('Erreur lors de l\'annulation:', error);
              toast.error('Impossible d\'annuler la réservation');
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: Reservation }) => (
    <View style={styles.reservationItem}>
      <View style={styles.reservationHeader}>
        <View style={styles.avatarContainer}>
          <Ionicons name="business" size={32} color="#E64A19" />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.professionalName}>{item.name}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color="#E64A19" />
            <Text style={styles.locationText}>{item.location}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.statusColor }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.reservationBody}>
        <View style={styles.infoRow}>
          <Ionicons name="cut" size={18} color="#666" />
          <Text style={styles.infoLabel}>Service:</Text>
          <Text style={styles.infoValue}>{item.service}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="calendar" size={18} color="#666" />
          <Text style={styles.infoLabel}>Date:</Text>
          <Text style={styles.infoValue}>{item.date}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="time" size={18} color="#666" />
          <Text style={styles.infoLabel}>Heure:</Text>
          <Text style={styles.infoValue}>{item.time}</Text>
        </View>
        {item.price && (
          <View style={styles.infoRow}>
            <Ionicons name="cash" size={18} color="#E64A19" />
            <Text style={styles.infoLabel}>Prix:</Text>
            <Text style={[styles.infoValue, styles.priceText]}>{item.price}</Text>
          </View>
        )}
      </View>

      <View style={styles.divider} />

      <View style={styles.reservationFooter}>
        {item.status === 'Confirmé' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButtonClient]}
            onPress={() => handleCancelClientBooking(item.id)}
          >
            <Ionicons name="close-circle-outline" size={18} color="#fff" />
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
        )}
        {item.status === 'Terminé' && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              item.reviewed ? styles.reviewButtonDisabled : styles.reviewButtonClient,
            ]}
            disabled={item.reviewed}
            onPress={() => handleOpenReviewModal(item)}
          >
            <Ionicons name="star-outline" size={18} color={item.reviewed ? '#fff' : '#fff'} />
            <Text style={item.reviewed ? styles.reviewButtonTextDisabled : styles.reviewButtonText}>
              {item.reviewed ? 'Avis envoyé' : 'Laisser un avis'}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={18} color="#E64A19" />
          <Text style={styles.actionButtonText}>Contacter</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="person-outline" size={18} color="#E64A19" />
          <Text style={styles.actionButtonText}>Voir Profil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={(
          <View>
            <Text style={styles.sectionTitle}>Historique des Réservations</Text>
            <Text style={styles.sectionSubtitle}>Consultez l&apos;état de toutes vos réservations</Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <Modal visible={showReviewModal} transparent animationType="fade" onRequestClose={() => setShowReviewModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Laisser un avis</Text>
            {selectedBooking && (
              <Text style={styles.modalSubtitle}>{selectedBooking.name} - {selectedBooking.service}</Text>
            )}

            <Text style={styles.ratingLabel}>Note</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <FontAwesome
                    name={star <= rating ? 'star' : 'star-o'}
                    size={32}
                    color="#FFC107"
                    style={styles.star}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.commentLabel}>Commentaire</Text>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Partagez votre expérience..."
              style={styles.commentInput}
              multiline
              numberOfLines={4}
              placeholderTextColor="#999"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => setShowReviewModal(false)}
                disabled={submitting}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitModalButton]}
                onPress={handleSubmitReview}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[styles.modalButtonText, styles.submitModalButtonText]}>Publier</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const FavoritesScreen = () => {
  const [data, setData] = useState<Favorite[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const favs = await favoriteService.getMyFavorites();
        const mapped: Favorite[] = favs.map((f: FavoriteProfessional | any) => {
          const rawRating = f?.rating ?? f?.avgRating ?? f?.averageRating ?? 0;
          const ratingNum = typeof rawRating === 'number' ? rawRating : parseFloat(String(rawRating));
          return {
            id: f.id,
            name: f.name,
            profession: f.profession || f.salon || '',
            rating: Number.isFinite(ratingNum) ? ratingNum : 0,
          };
        });
        setData(mapped);
      } catch (e) {
        console.error('Error loading favorites', e);
      }
    };
    load();
  }, []);

  const renderItem = ({ item }: { item: Favorite }) => (
    <View style={styles.favoriteItem}>
      <View style={styles.avatarContainer}>
        <Ionicons name="heart" size={28} color="#E64A19" />
      </View>
      <View style={styles.favoriteInfo}>
        <Text style={styles.professionalName}>{item.name}</Text>
        <Text style={styles.profession}>{item.profession}</Text>
        <View style={styles.ratingRow}>
          <FontAwesome name="star" size={14} color="#FFC107" />
          <Text style={styles.rating}>{typeof item.rating === 'number' ? item.rating.toFixed(1) : '0.0'}</Text>
        </View>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={async () => {
            try {
              const user = await userService.getUserById(item.id);
              router.push({
                pathname: '/profile',
                params: {
                  id: user.id,
                  name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                  salon: user.salon || '',
                  location: user.location || '',
                  rating: String(user.rating || 0),
                  reviews: String(user.reviews || 0),
                  specialities: (user.specialities || []).join(','),
                  phone: user.phone || '',
                  email: user.email || '',
                  status: (user.status === 'online' || user.status === 'busy' || user.status === 'available') ? user.status : 'available',
                  verified: String(user.verified || false),
                  image: user.bannerImageUrl || '',
                },
              });
            } catch (e) {
              console.error('Open favorite profile failed', e);
            }
          }}
        >
          <Text style={styles.viewButtonText}>Voir</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.reserveButton}
          onPress={async () => {
            try {
              const user = await userService.getUserById(item.id);
              router.push({
                pathname: '/booking',
                params: {
                  id: user.id,
                  name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                  salon: user.salon || '',
                  phone: user.phone || '',
                  email: user.email || '',
                  image: user.bannerImageUrl || '',
                },
              });
            } catch (e) {
              console.error('Open booking from favorite failed', e);
            }
          }}
        >
          <Text style={styles.reserveButtonText}>Réserver</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Mes Professionnels Favoris</Text>
      <Text style={styles.sectionSubtitle}>Retrouvez rapidement vos professionnels préférés</Text>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

const ProfileScreen = () => {
  const [user, setUser] = useState<{ firstName: string; lastName: string; email: string; phone: string; location: string; bio?: string } | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', location: '', bio: '' });

  useEffect(() => {
    const load = async () => {
      try {
        const u = await userService.getMe();
        setUser({
          firstName: u.firstName || '',
          lastName: u.lastName || '',
          email: u.email,
          phone: u.phone || '',
          location: u.location || '',
          bio: u.bio || u.presentation || '',
        });
        setForm({
          firstName: u.firstName || '',
          lastName: u.lastName || '',
          phone: u.phone || '',
          location: u.location || '',
          bio: (u.bio || u.presentation || '') as string,
        });
      } catch (e) {
        console.error('Error loading my profile', e);
      }
    };
    load();
  }, []);

  const save = async () => {
    try {
      setSaving(true);
      const updated = await userService.updateMe(form as any);
      setUser({
        firstName: updated.firstName || '',
        lastName: updated.lastName || '',
        email: updated.email,
        phone: updated.phone || '',
        location: updated.location || '',
        bio: updated.bio || updated.presentation || '',
      });
      setEditing(false);
    } catch (e) {
      console.error('Error saving profile', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Informations Personnelles</Text>
      <Text style={styles.sectionSubtitle}>Gérez vos informations de profil</Text>

      {editing ? (
        <>
          <View style={styles.profileItem}>
            <Ionicons name="person-outline" size={20} color="#666" />
            <Text style={styles.profileLabel}>Prénom</Text>
            <TextInput
              style={styles.input}
              value={form.firstName}
              onChangeText={(t) => setForm((f) => ({ ...f, firstName: t }))}
              placeholder="Prénom"
            />
          </View>
          <View style={styles.profileItem}>
            <Ionicons name="person-outline" size={20} color="#666" />
            <Text style={styles.profileLabel}>Nom</Text>
            <TextInput
              style={styles.input}
              value={form.lastName}
              onChangeText={(t) => setForm((f) => ({ ...f, lastName: t }))}
              placeholder="Nom"
            />
          </View>
          <View style={styles.profileItem}>
            <Ionicons name="call-outline" size={20} color="#666" />
            <Text style={styles.profileLabel}>Téléphone</Text>
            <TextInput
              style={styles.input}
              value={form.phone}
              onChangeText={(t) => setForm((f) => ({ ...f, phone: t }))}
              placeholder="Téléphone"
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.profileItem}>
            <Ionicons name="location-outline" size={20} color="#666" />
            <Text style={styles.profileLabel}>Localisation</Text>
            <TextInput
              style={styles.input}
              value={form.location}
              onChangeText={(t) => setForm((f) => ({ ...f, location: t }))}
              placeholder="Localisation"
            />
          </View>
          <View style={styles.profileItem}>
            <Ionicons name="person-outline" size={20} color="#666" />
            <Text style={styles.profileLabel}>Bio</Text>
            <TextInput
              style={[styles.input, { height: 80 }]}
              value={form.bio}
              onChangeText={(t) => setForm((f) => ({ ...f, bio: t }))}
              placeholder="Votre bio"
              multiline
            />
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={[styles.modifyButton, { backgroundColor: '#4CAF50', flex: 1 }]} onPress={save} disabled={saving}>
              <Text style={styles.modifyButtonText}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modifyButton, { backgroundColor: '#999', flex: 1 }]} onPress={() => setEditing(false)} disabled={saving}>
              <Text style={styles.modifyButtonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <View style={styles.profileItem}>
            <Ionicons name="person-outline" size={20} color="#666" />
            <Text style={styles.profileLabel}>Nom</Text>
            <Text style={styles.profileValue}>{user ? `${user.firstName} ${user.lastName}`.trim() : ''}</Text>
          </View>
          <View style={styles.profileItem}>
            <Ionicons name="mail-outline" size={20} color="#666" />
            <Text style={styles.profileLabel}>Email</Text>
            <Text style={styles.profileValue}>{user?.email || ''}</Text>
          </View>
          <View style={styles.profileItem}>
            <Ionicons name="call-outline" size={20} color="#666" />
            <Text style={styles.profileLabel}>Téléphone</Text>
            <Text style={styles.profileValue}>{user?.phone || ''}</Text>
          </View>
          <View style={styles.profileItem}>
            <Ionicons name="location-outline" size={20} color="#666" />
            <Text style={styles.profileLabel}>Localisation</Text>
            <Text style={styles.profileValue}>{user?.location || ''}</Text>
          </View>
          <View style={styles.profileItem}>
            <Ionicons name="person-outline" size={20} color="#666" />
            <Text style={styles.profileLabel}>Bio</Text>
            <Text style={styles.profileValue}>{user?.bio || ''}</Text>
          </View>
          <TouchableOpacity style={styles.modifyButton} onPress={() => setEditing(true)}>
            <Text style={styles.modifyButtonText}>Modifier</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

// Initialisation du Tab Navigator
const Tab = createBottomTabNavigator();

export default function ClientSpace() {
  const [stats, setStats] = useState<{ activeBookings: number; pendingBookings: number; favoritesCount: number } | null>(null);
  useEffect(() => {
    const load = async () => {
      try {
        const s = await userService.getStats();
        setStats(s);
      } catch (e) {
        console.error('Error loading stats', e);
      }
    };
    load();
  }, []);
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Mon Espace Client</Text>
      <Text style={styles.subtitle}>Gérez vos réservations et votre profil</Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Réservations Actives</Text>
          <Text style={styles.statValue}>{stats?.activeBookings ?? 0}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>En Attente</Text>
        <Text style={styles.statValue}>{stats?.pendingBookings ?? 0}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Favoris</Text>
        <Text style={styles.statValue}>{stats?.favoritesCount ?? 0}</Text>
        </View>
      </View>

      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: [styles.tabBar, { marginBottom: 0 }],
          tabBarLabelStyle: styles.tabLabel,
          tabBarActiveTintColor: '#E64A19',
          tabBarInactiveTintColor: '#666',
        }}
      >
        <Tab.Screen
          name="Mes Réservations"
          component={ReservationsScreen}
          options={{
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? 'calendar' : 'calendar-outline'}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Mes Favoris"
          component={FavoritesScreen}
          options={{
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? 'heart' : 'heart-outline'}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Mon Profil"
          component={ProfileScreen}
          options={{
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? 'person' : 'person-outline'}
                size={size}
                color={color}
              />
            ),
          }}
        />
      </Tab.Navigator>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#333', textAlign: 'center', paddingTop: 20, paddingBottom: 5, letterSpacing: 0.5 },
  subtitle: { fontSize: 13, color: '#999', textAlign: 'center', paddingBottom: 20, fontStyle: 'italic' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 10, marginBottom: 10 },
  statCard: { alignItems: 'center', backgroundColor: '#fff', paddingVertical: 16, paddingHorizontal: 18, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 3, elevation: 3, minWidth: 100, borderLeftWidth: 3, borderLeftColor: '#E64A19' },
  statLabel: { fontSize: 11, color: '#666', marginBottom: 6, textAlign: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#E64A19' },
  tabBar: { backgroundColor: '#fff', borderTopWidth: 0, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 4, paddingBottom: 0, height: 60 },
  tabLabel: { fontSize: 12, marginBottom: 5 },
  listContent: { padding: 10 },
  sectionContainer: { flex: 1, padding: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  sectionSubtitle: { fontSize: 12, color: '#666', marginBottom: 15 },
  favoriteItem: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2, alignItems: 'center' },
  favoriteInfo: { flex: 1, marginLeft: 12 },
  profession: { fontSize: 13, color: '#666', marginTop: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  rating: { fontSize: 14, color: '#333', fontWeight: '600' },
  buttonContainer: { flexDirection: 'column', alignItems: 'stretch', gap: 8 },
  viewButton: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E64A19', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, alignItems: 'center' },
  viewButtonText: { fontSize: 13, color: '#E64A19', fontWeight: '600' },
  reserveButton: { backgroundColor: '#E64A19', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, alignItems: 'center' },
  reserveButtonText: { fontSize: 13, color: '#fff', fontWeight: '600' },
  profileItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  profileLabel: { fontSize: 16, color: '#333', marginLeft: 10, flex: 1 },
  profileValue: { fontSize: 14, color: '#666', marginLeft: 5, flex: 2 },
  input: { flex: 2, borderWidth: 1, borderColor: '#ddd', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#fff' },
  modifyButton: { backgroundColor: '#E64A19', padding: 10, borderRadius: 5, alignItems: 'center', marginTop: 20 },
  modifyButtonText: { fontSize: 14, color: '#fff' },

  // Reservations list styles
  reservationItem: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 },
  reservationHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatarContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFF3E0', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  headerInfo: { flex: 1 },
  professionalName: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 13, color: '#666' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 11, color: '#fff', fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 12 },
  reservationBody: { gap: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoLabel: { fontSize: 14, fontWeight: '600', color: '#666', width: 70 },
  infoValue: { fontSize: 14, color: '#333', flex: 1 },
  priceText: { fontWeight: 'bold', color: '#E64A19', fontSize: 16 },
  reservationFooter: { flexDirection: 'row', justifyContent: 'space-around', gap: 10 },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E64A19', backgroundColor: '#FFF' },
  cancelButtonClient: { backgroundColor: '#F44336', borderColor: '#F44336' },
  cancelButtonText: { fontSize: 13, color: '#fff', fontWeight: '600' },
  actionButtonText: { fontSize: 13, color: '#E64A19', fontWeight: '600' },
  separator: { height: 1, backgroundColor: '#eee', marginVertical: 5 },
  emptyScreen: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#666' },

  // Review button
  reviewButtonClient: { backgroundColor: '#E64A19', borderColor: '#E64A19' },
  reviewButtonText: { fontSize: 13, color: '#fff', fontWeight: '600' },
  reviewButtonDisabled: { backgroundColor: '#BDBDBD', borderColor: '#BDBDBD' },
  reviewButtonTextDisabled: { fontSize: 13, color: '#fff', fontWeight: '600', opacity: 0.9 },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxWidth: 420, backgroundColor: '#fff', borderRadius: 16, padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 8, textAlign: 'center' },
  modalSubtitle: { fontSize: 14, color: '#666', marginBottom: 12, textAlign: 'center' },
  ratingLabel: { fontSize: 13, color: '#666', marginBottom: 6 },
  starsContainer: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 12 },
  star: { marginHorizontal: 4 },
  commentLabel: { fontSize: 13, color: '#666', marginBottom: 6 },
  commentInput: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#333', backgroundColor: '#fafafa', minHeight: 90, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  modalButton: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
  cancelModalButton: { backgroundColor: '#eee' },
  submitModalButton: { backgroundColor: '#E64A19' },
  modalButtonText: { fontSize: 14, fontWeight: '600', color: '#333' },
  submitModalButtonText: { color: '#fff' },
});
