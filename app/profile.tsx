import favoriteService from '@/services/favorite.service';
import portfolioService from '@/services/portfolio.service';
import profileViewService from '@/services/profile-view.service';
import reviewService from '@/services/review.service';
import serviceService from '@/services/service.service';
import { userService } from '@/services/user.service';
import { getFullImageUrl, getImageSource } from '@/utils/image';
import { toast } from '@/utils/toast';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

const Tab = createBottomTabNavigator();

const ServicesScreen = () => {
  const { services, servicesLoading } = useProfileData();

  if (servicesLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <ActivityIndicator size="large" color="#E64A19" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionHeader}>Services Proposés</Text>
      {services.length > 0 ? (
        services.map((item, index) => (
          <View key={index} style={styles.serviceCard}>
            <View style={styles.serviceIconContainer}>
              <Ionicons name="cut" size={28} color="#E64A19" />
            </View>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>{item.name}</Text>
              {item.description && <Text style={styles.serviceDescription}>{item.description}</Text>}
              <View style={styles.serviceMetaRow}>
                <View style={styles.serviceMeta}>
                  <Ionicons name="time-outline" size={16} color="#666" />
                  <Text style={styles.serviceMetaText}>{item.duration || 'Non spécifié'}</Text>
                </View>
                <View style={styles.servicePriceContainer}>
                  <Text style={styles.servicePrice}>{item.price?.toLocaleString('fr-FR')} XOF</Text>
                </View>
              </View>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="briefcase-outline" size={60} color="#ccc" />
          <Text style={styles.placeholderText}>Aucun service disponible</Text>
        </View>
      )}
    </ScrollView>
  );
};

const PortfolioScreen = () => {
  const { portfolio, portfolioLoading } = useProfileData();
  const [portfolioItems, setPortfolioItems] = useState(portfolio);
  const [liking, setLiking] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    setPortfolioItems(portfolio);
  }, [portfolio]);

  const handleLike = async (item: any) => {
    if (liking[item.id]) return; // Éviter les clics multiples

    try {
      setLiking(prev => ({ ...prev, [item.id]: true }));
      const updatedItem = await portfolioService.likePortfolioItem(item.id);

      // Mettre à jour localement
      setPortfolioItems(prev =>
        prev.map(p => p.id === item.id ? updatedItem : p)
      );
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Impossible de liker la photo');
    } finally {
      setLiking(prev => ({ ...prev, [item.id]: false }));
    }
  };

  if (portfolioLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <ActivityIndicator size="large" color="#E64A19" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionHeader}>Galerie Photos</Text>
      {portfolioItems.length > 0 ? (
        <View style={styles.portfolioGrid}>
          {portfolioItems.map((item, index) => (
            <View key={index} style={styles.portfolioCard}>
              <Image
                source={
                  item.imageUrl
                    ? { uri: getFullImageUrl(item.imageUrl) || item.imageUrl }
                    : require('../assets/images/salon1.png')
                }
                style={styles.portfolioImage}
              />

              {/* Bouton de like en haut à droite */}
              <TouchableOpacity
                style={styles.likeButton}
                onPress={() => handleLike(item)}
                disabled={liking[item.id]}
              >
                {liking[item.id] ? (
                  <ActivityIndicator size="small" color="#E64A19" />
                ) : (
                  <>
                    <Ionicons name="heart" size={20} color="#E64A19" />
                    <Text style={styles.likeCount}>{item.likes || 0}</Text>
                  </>
                )}
              </TouchableOpacity>

              {(item.title || item.description) && (
                <View style={styles.portfolioOverlay}>
                  <Text style={styles.portfolioText} numberOfLines={2}>{item.title || item.description}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="images-outline" size={60} color="#ccc" />
          <Text style={styles.placeholderText}>Aucun portfolio disponible</Text>
        </View>
      )}
    </ScrollView>
  );
};

const ReviewsScreen = () => {
  const { reviewsData, reviewsLoading } = useProfileData();

  if (reviewsLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <ActivityIndicator size="large" color="#E64A19" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionHeader}>Avis Clients</Text>
      {reviewsData.length > 0 ? (
        reviewsData.map((item, index) => (
          <View key={index} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <View style={styles.reviewAvatar}>
                <Ionicons name="person" size={24} color="#E64A19" />
              </View>
              <View style={styles.reviewHeaderInfo}>
                <Text style={styles.reviewName}>
                  {item.client ? `${item.client.firstName} ${item.client.lastName}` : 'Client'}
                </Text>
                <Text style={styles.reviewDate}>
                  {new Date(item.createdAt).toLocaleDateString('fr-FR')}
                </Text>
              </View>
              <View style={styles.reviewRatingContainer}>
                {[...Array(5)].map((_, i) => (
                  <Ionicons
                    key={i}
                    name={i < (item.rating || 0) ? 'star' : 'star-outline'}
                    size={18}
                    color="#FFC107"
                  />
                ))}
              </View>
            </View>
            <Text style={styles.reviewComment}>{item.comment}</Text>
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={60} color="#ccc" />
          <Text style={styles.placeholderText}>Aucun avis disponible</Text>
        </View>
      )}
    </ScrollView>
  );
};

const AboutScreen = () => {
  const { about } = useProfileData();

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionHeader}>À Propos</Text>
      {about ? (
        <>
          {about.presentation && (
            <View style={styles.aboutSection}>
              <View style={styles.aboutSectionHeader}>
                <Ionicons name="information-circle" size={22} color="#E64A19" />
                <Text style={styles.subTitle}>Présentation</Text>
              </View>
              <Text style={styles.aboutText}>{about.presentation}</Text>
            </View>
          )}

          {about.hours && Object.keys(about.hours).length > 0 && (
            <View style={styles.aboutSection}>
              <View style={styles.aboutSectionHeader}>
                <Ionicons name="time" size={22} color="#E64A19" />
                <Text style={styles.subTitle}>Horaires d&apos;ouverture</Text>
              </View>
              {Object.entries(about.hours).map(([day, hours]: [string, any]) => (
                <View key={day} style={styles.hoursRow}>
                  <Text style={styles.hoursDay}>{day}</Text>
                  <Text style={styles.hoursText}>{hours || 'Fermé'}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.aboutSection}>
            <View style={styles.aboutSectionHeader}>
              <Ionicons name="call" size={22} color="#E64A19" />
              <Text style={styles.subTitle}>Contact</Text>
            </View>
            <View style={styles.contactRow}>
              <Ionicons name="call-outline" size={18} color="#666" />
              <Text style={styles.contactText}>{about.contact.phone || 'Non renseigné'}</Text>
            </View>
            <View style={styles.contactRow}>
              <Ionicons name="mail-outline" size={18} color="#666" />
              <Text style={styles.contactText}>{about.contact.email || 'Non renseigné'}</Text>
            </View>
            <View style={styles.contactRow}>
              <Ionicons name="location-outline" size={18} color="#666" />
              <Text style={styles.contactText}>{about.contact.location || 'Non renseigné'}</Text>
            </View>
          </View>
        </>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={60} color="#ccc" />
          <Text style={styles.placeholderText}>Aucune information disponible</Text>
        </View>
      )}
    </ScrollView>
  );
};

// Hook personnalisé pour partager les données entre onglets
function useProfileData() {
  const { id, name, salon, location, rating, reviews, specialities, phone, email, status, verified, image } = useLocalSearchParams<{
    id: string;
    name: string;
    salon: string;
    location: string;
    rating: string;
    reviews: string;
    specialities: string;
    phone: string;
    email: string;
    status: string;
    verified: string;
    image: string;
  }>();

  const parsedRating = parseFloat(rating || '0');
  const parsedReviews = parseInt(reviews || '0');
  const parsedVerified = verified === 'true';
  const parsedSpecialities = specialities ? specialities.split(',') : [];

  // États pour les données dynamiques
  const [services, setServices] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [reviewsData, setReviewsData] = useState<any[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [portfolioLoading, setPortfolioLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  // Track profile view when component mounts
  useEffect(() => {
    if (id) {
      profileViewService.trackView(id).catch(err => {
        console.log('Profile view tracking failed (non-critical):', err);
      });
    }
  }, [id]);

  // Charger les services
  useEffect(() => {
    const fetchServices = async () => {
      if (!id) return;
      try {
        const data = await serviceService.getServicesByProfessionalId(id);
        setServices(data);
      } catch (error) {
        console.error('Error loading services:', error);
      } finally {
        setServicesLoading(false);
      }
    };
    fetchServices();
  }, [id, phone, email, location]);

  // Charger le portfolio
  useEffect(() => {
    const fetchPortfolio = async () => {
      if (!id) return;
      try {
        const data = await portfolioService.getPortfolioByProfessionalId(id);
        setPortfolio(data);
      } catch (error) {
        console.error('Error loading portfolio:', error);
      } finally {
        setPortfolioLoading(false);
      }
    };
    fetchPortfolio();
  }, [id]);

  // Charger les avis
  useEffect(() => {
    const fetchReviews = async () => {
      if (!id) return;
      try {
        const data = await reviewService.getReviewsByProfessionalId(id);
        setReviewsData(data);
      } catch (error) {
        console.error('Error loading reviews:', error);
      } finally {
        setReviewsLoading(false);
      }
    };
    fetchReviews();
  }, [id]);

  // Charger les informations "À propos" depuis le backend
  const [aboutData, setAboutData] = useState<any>(null);
  const [aboutLoading, setAboutLoading] = useState(true);

  useEffect(() => {
    const fetchAbout = async () => {
      if (!id) return;
      try {
        const userData = await userService.getUserById(id);
        setAboutData({
          presentation: userData.presentation || '',
          hours: userData.openingHours || {},
          contact: {
            phone: userData.phone || phone || '',
            email: userData.email || email || '',
            location: userData.location || location || '',
          },
        });
      } catch (error) {
        console.error('Error loading about:', error);
      } finally {
        setAboutLoading(false);
      }
    };
    fetchAbout();
  }, [id, phone, email, location]);

  const about = aboutData;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#4CAF50';
      case 'busy': return '#FF9800';
      case 'available': return '#2196F3';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'En ligne';
      case 'busy': return 'Occupée';
      case 'available': return 'Disponible';
      default: return 'Hors ligne';
    }
  };

  return {
    id,
    name,
    salon,
    location,
    rating: parsedRating,
    reviews: parsedReviews,
    specialities: parsedSpecialities,
    phone,
    email,
    status,
    verified: parsedVerified,
    image,
    services,
    portfolio,
    reviewsData,
    servicesLoading,
    portfolioLoading,
    reviewsLoading,
  aboutLoading,
    about,
    getStatusColor,
    getStatusText,
  };
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    id, name, salon, location, rating, reviews, verified, image, status, phone, email, getStatusColor, getStatusText,
  } = useProfileData();
  const [isFavorite, setIsFavorite] = useState(false);

  // Load initial favorite state on mount
  useEffect(() => {
    const checkFavorite = async () => {
      if (!id) return;
      try {
        const favorites = await favoriteService.getMyFavorites();
        const inFavorites = favorites.some((f) => f.id === id);
        setIsFavorite(inFavorites);
      } catch (e) {
        console.error('Error checking favorite status', e);
      }
    };
    checkFavorite();
  }, [id]);

  const handleBook = () => {
    if (!id) return;
    const params = [
      `id=${encodeURIComponent(id ?? '')}`,
      `name=${encodeURIComponent(name ?? '')}`,
      `salon=${encodeURIComponent(salon ?? '')}`,
      `phone=${encodeURIComponent(phone ?? '')}`,
      `email=${encodeURIComponent(email ?? '')}`,
      `image=${encodeURIComponent(image ?? '')}`
    ].join('&');
  router.push(`/booking?${params}`);
  };
  const handleToggleFavorite = async () => {
    try {
      if (!id) return;
      if (isFavorite) {
        await favoriteService.removeFavorite(id);
        setIsFavorite(false);
      } else {
        await favoriteService.addFavorite(id);
        setIsFavorite(true);
      }
    } catch (e: any) {
      console.error('Favorite toggle failed', e?.response?.data || e?.message);
    }
  };

  const { specialities } = useProfileData();

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        {/* En-tête fixe avec image de fond */}
        <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
          {/* Image de fond avec overlay */}
          <Image
            source={getImageSource(image)}
            style={styles.headerBackgroundImage}
            blurRadius={3}
            defaultSource={require('../assets/images/salon1.png')}
          />
          <View style={styles.headerOverlay} />

          {/* Contenu de l'en-tête */}
          <View style={styles.headerContent}>
            {/* Bouton retour */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.push('/(tabs)/home')}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>

            {/* Image de profil */}
            <View style={styles.profileImageContainer}>
              <Image
                source={getImageSource(image)}
                style={styles.profileImage}
                defaultSource={require('../assets/images/salon1.png')}
              />
              {verified && (
                <View style={styles.verifiedBadgeOnImage}>
                  <FontAwesome name="check-circle" size={24} color="#4CAF50" />
                </View>
              )}
            </View>

            {/* Informations principales */}
            <Text style={styles.name}>{name}</Text>
            {salon && <Text style={styles.salon}>{salon}</Text>}

            {/* Statut et localisation */}
            <View style={styles.metaRow}>
              <View style={styles.statusIndicator}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(status) }]} />
                <Text style={styles.statusText}>{getStatusText(status)}</Text>
              </View>
              {location && (
                <View style={styles.locationContainer}>
                  <Ionicons name="location" size={14} color="#fff" />
                  <Text style={styles.locationText}>{location}</Text>
                </View>
              )}
            </View>

            {/* Note */}
            <View style={styles.ratingContainer}>
              <FontAwesome name="star" size={18} color="#FFC107" />
              <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
              <Text style={styles.reviewsText}>({reviews} avis)</Text>
            </View>

            {/* Spécialités */}
            {specialities && specialities.length > 0 && (
              <View style={styles.specialitiesContainer}>
                {specialities.slice(0, 4).map((spec, index) => (
                  <View key={index} style={styles.specialityTag}>
                    <Text style={styles.specialityTagText}>{spec}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Navigation par onglets juste après l'en-tête */}
        <View style={styles.tabNavigator}>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarIcon: ({ focused, color, size }) => {
                let iconName;

                if (route.name === 'Services') iconName = focused ? 'list' : 'list-outline';
                else if (route.name === 'Portolio') iconName = focused ? 'images' : 'images-outline';
                else if (route.name === 'Avis') iconName = focused ? 'chatbox' : 'chatbox-outline';
                else if (route.name === 'À propos') iconName = focused ? 'information-circle' : 'information-circle-outline';

                return <Ionicons name={iconName as any} size={size} color={color} />;
              },
              tabBarActiveTintColor: '#E64A19',
              tabBarInactiveTintColor: '#666',
              tabBarStyle: styles.tabBar,
              tabBarLabelStyle: styles.tabLabel,
            })}
          >
            <Tab.Screen name="Services" component={ServicesScreen} />
            <Tab.Screen name="Portolio" component={PortfolioScreen} />
            <Tab.Screen name="Avis" component={ReviewsScreen} />
            <Tab.Screen name="À propos" component={AboutScreen} />
          </Tab.Navigator>
        </View>

        {/* Actions en bas */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(tabs)/home')}>
            <Ionicons name="arrow-back" size={20} color="#E64A19" />
            <Text style={styles.actionButtonText}>Retour</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButtonPrimary} onPress={handleBook}>
            <Ionicons name="calendar-outline" size={20} color="white" />
            <Text style={styles.actionButtonPrimaryText}>Réserver</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleToggleFavorite}>
            <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={20} color="#E64A19" />
            <Text style={styles.actionButtonText}>Favoris</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  headerContainer: {
    position: 'relative',
    height: 350,
    backgroundColor: '#000',
  },
  headerBackgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
    width: '100%',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  headerContent: {
    position: 'relative',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 5,
  },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: '#fff',
  },
  verifiedBadgeOnImage: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 2,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  salon: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 10,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  locationText: {
    fontSize: 12,
    color: '#fff',
    marginLeft: 4,
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  ratingText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 6,
    fontWeight: 'bold',
  },
  reviewsText: {
    fontSize: 13,
    color: '#fff',
    marginLeft: 4,
    opacity: 0.9,
  },
  specialitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 14,
  },
  specialityTag: {
    backgroundColor: 'rgba(230, 74, 25, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  specialityTagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    position: 'relative',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    bottom: 10,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 8,
    borderRadius: 12,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  verifiedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  infoContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabNavigator: {
    flex: 1, // Prend l'espace restant après l'en-tête
  },
  tabBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    height: 56,
    paddingBottom: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  tabContent: {
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#E64A19',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  serviceCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 17,
    color: '#333',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 10,
    lineHeight: 18,
  },
  serviceMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  serviceMetaText: {
    fontSize: 13,
    color: '#666',
  },
  servicePriceContainer: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  servicePrice: {
    fontSize: 16,
    color: '#E64A19',
    fontWeight: 'bold',
  },
  serviceDuration: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  portfolioCard: {
    width: '48%',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  portfolioImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  likeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  likeCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  portfolioOverlay: {
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  portfolioText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  reviewCard: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reviewHeaderInfo: {
    flex: 1,
  },
  reviewName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
  },
  reviewRatingContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewComment: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  aboutSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  aboutSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
  },
  subTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  hoursDay: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textTransform: 'capitalize',
  },
  hoursText: {
    fontSize: 14,
    color: '#666',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  contactText: {
    fontSize: 14,
    color: '#555',
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E64A19',
    marginHorizontal: 5,
    backgroundColor: '#fff',
  },
  actionButtonPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#E64A19',
    marginHorizontal: 5,
  },
  actionButtonText: {
    color: '#E64A19',
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '600',
  },
  actionButtonPrimaryText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '600',
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
});
