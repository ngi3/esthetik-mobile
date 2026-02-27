// app/(pro)/avis.tsx
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import reviewService, { Review } from '../../services/review.service';

const StarRating = ({ rating }: { rating: number }) => {
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= rating ? 'star' : 'star-outline'}
          size={18}
          color="#FFC107"
        />
      ))}
    </View>
  );
};

export default function AvisScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useLayoutEffect(() => {
    navigation.setOptions({ headerTitle: 'Avis Clients' });
  }, [navigation]);

  const loadReviews = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const data = await reviewService.getReviewsByProfessionalId(user.id);
      setReviews(data);
    } catch (error) {
      console.error('Erreur chargement avis:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadReviews();
    }, [loadReviews])
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E64A19" />
        <Text style={styles.loadingText}>Chargement des avis...</Text>
      </View>
    );
  }

  if (reviews.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="star-outline" size={60} color="#ccc" />
        <Text style={styles.emptyText}>Aucun avis pour le moment</Text>
        <Text style={styles.emptySubtext}>Vos clients pourront laisser des avis après leurs réservations</Text>
      </View>
    );
  }

  return (
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {reviews.map((review) => {
          // Récupérer les services depuis le booking
          const booking = (review as any).booking;
          const servicesArray = booking?.services || [];
          const serviceNames = servicesArray.length > 0
            ? servicesArray.map((s: any) => s.name).filter(Boolean).join(' + ')
            : booking?.service?.name || 'Service non spécifié';

          return (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.header}>
                <View style={styles.clientInfo}>
                  <Text style={styles.name}>
                    {review.client ? `${review.client.firstName} ${review.client.lastName}` : 'Client'}
                  </Text>
                  <Text style={styles.service}>{serviceNames}</Text>
                </View>
                <StarRating rating={review.rating} />
              </View>

              <Text style={styles.comment}>{review.comment}</Text>

              <Text style={styles.date}>
                {new Date(review.createdAt).toLocaleDateString('fr-FR')}
              </Text>
            </View>
          );
        })}
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: '#fdf8f5',
  },

  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  clientInfo: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  service: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },

  stars: {
    flexDirection: 'row',
    gap: 2,
  },

  comment: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
    marginVertical: 8,
  },

  date: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});
