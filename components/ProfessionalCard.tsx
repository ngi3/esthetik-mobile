import favoriteService from '@/services/favorite.service';
import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Image,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { styles } from '../styles/AppStyles';

interface Professional {
  id: string;
  name: string;
  salon: string;
  location: string;
  rating: number;
  reviews: number;
  specialities: string[];
  phone: string;
  email: string;
  status: 'online' | 'busy' | 'available';
  verified: boolean;
  image: any; // Peut être require(...) ou { uri: ... }
}

interface ProfessionalCardProps {
  professional: Professional;
}

export default function ProfessionalCard({ professional }: ProfessionalCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  // Load initial favorite state on mount
  React.useEffect(() => {
    const checkFavorite = async () => {
      try {
        const favorites = await favoriteService.getMyFavorites();
        const inFavorites = favorites.some((f) => f.id === professional.id);
        setIsFavorite(inFavorites);
      } catch (e) {
        console.error('Error checking favorite status', e);
      }
    };
    checkFavorite();
  }, [professional.id]);

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

  const handleViewProfile = () => {
    router.push({
      pathname: '/profile',
      params: {
        id: professional.id,
        name: professional.name,
        salon: professional.salon,
        location: professional.location,
        rating: professional.rating.toString(),
        reviews: professional.reviews.toString(),
        specialities: professional.specialities.join(','),
        phone: professional.phone,
        email: professional.email,
        status: professional.status,
        verified: professional.verified.toString(),
        image: professional.image.uri || (typeof professional.image === 'number' ? '' : professional.image),
      },
    });
  };

  const handleBook = () => {
    router.push({
      pathname: '/booking',
      params: {
        id: professional.id,
        name: professional.name,
        salon: professional.salon,
        phone: professional.phone,
        email: professional.email,
        image: professional.image.uri || (typeof professional.image === 'number' ? '' : professional.image),
      },
    });
  };

  const handleToggleFavorite = async () => {
    try {
      if (isFavorite) {
        await favoriteService.removeFavorite(professional.id);
        setIsFavorite(false);
      } else {
        await favoriteService.addFavorite(professional.id);
        setIsFavorite(true);
      }
    } catch (e: any) {
      console.error('Favorite toggle failed', e?.response?.data || e?.message);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        <Image
          source={professional.image}
          style={styles.image}
          defaultSource={require('../assets/images/salon1.png')}
        />
        <View style={styles.statusBadge}>
          {professional.verified && (
            <View style={styles.verifiedBadge}>
              <FontAwesome name="check-circle" size={16} color="#4CAF50" />
              <Text style={styles.verifiedText}>Vérifié</Text>
            </View>
          )}
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(professional.status) }]} />
          <Text style={styles.statusText}>{getStatusText(professional.status)}</Text>
        </View>
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{professional.name}</Text>
        <Text style={styles.salon}>{professional.salon}</Text>
        <Text style={styles.location}>
          <Ionicons name="location-outline" size={14} color="#666" /> {professional.location}
        </Text>
        <Text style={styles.rating}>
          <FontAwesome name="star" size={16} color="#FFC107" /> {professional.rating} ({professional.reviews} avis)
        </Text>

        <Text style={styles.specialityLabel}>Spécialités :</Text>
        <View style={styles.specialitiesContainer}>
          {professional.specialities.map((spec, i) => (
            <View key={i} style={styles.specialityTag}>
              <Text style={styles.specialityText}>{spec}</Text>
            </View>
          ))}
        </View>

        <View style={styles.contact}>
          <Text style={styles.phone}>
            <Ionicons name="call-outline" size={14} color="#666" /> {professional.phone}
          </Text>
          <Text style={styles.email}>
            <MaterialIcons name="email" size={14} color="#666" /> {professional.email}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.btnSecondary} onPress={handleViewProfile}>
            <Ionicons name="eye-outline" size={18} color="#E64A19" />
            <Text style={styles.btnSecondaryText}>Voir Profil</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnPrimary} onPress={handleBook}>
            <Ionicons name="calendar-outline" size={18} color="white" />
            <Text style={styles.btnPrimaryText}>Réserver</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleToggleFavorite}>
            <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={24} color="#E64A19" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
