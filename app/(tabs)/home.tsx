import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router'; // Importation de useRouter pour la redirection
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ProfessionalCard from '../../components/ProfessionalCard';
import { useAuth } from '../../hooks/useAuth'; // Importation de useAuth
import { userService } from '../../services/user.service';
import { styles } from '../../styles/AppStyles';
import { getImageSource } from '../../utils/image';

// Définition du type User
type User = {
  id: string;
  firstName?: string;
  lastName?: string;
  salon?: string;
  location?: string;
  rating?: number;
  reviews?: number;
  specialities?: string[];
  phone?: string;
  email?: string;
  status?: string;
  verified?: boolean;
  bannerImageUrl?: string;
};

// Liste dynamique des professionnels

const specialities = [
  'Tous', 'Ongles', 'Coiffure', 'Soins visage', 'Maquillage',
  'Tresses', 'Extensions', 'Épilation', 'Massage', 'Nail Art',
];

const HomeScreen: React.FC = () => {
  const [selectedSpeciality, setSelectedSpeciality] = useState('Tous');
  const [searchText, setSearchText] = useState('');
  const [professionals, setProfessionals] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchProfessionals = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await userService.getAllProfessionals();
        console.log('Professionals loaded:', data.length);
        if (data.length > 0) {
          console.log('First professional bannerImageUrl:', data[0].bannerImageUrl);
        }
        setProfessionals(data);
      } catch (err: any) {
        console.error('Erreur lors du chargement des professionnels:', err);
        setError("Erreur lors du chargement des professionnels");
      } finally {
        setLoading(false);
      }
    };
    fetchProfessionals();
  }, []);

  const filteredPros = professionals.filter((pro: any) => {
    const fullName = `${pro.firstName || ''} ${pro.lastName || ''}`.trim();
    const matchesSearch =
      (fullName.toLowerCase().includes(searchText.toLowerCase()) ||
        (pro.salon || '').toLowerCase().includes(searchText.toLowerCase()) ||
        (pro.location || '').toLowerCase().includes(searchText.toLowerCase()));
    const matchesSpeciality =
      selectedSpeciality === 'Tous' ||
      (pro.specialities && pro.specialities.includes(selectedSpeciality));
    return matchesSearch && matchesSpeciality;
  });
  // Fonction de déconnexion
  const handleLogout = () => {
    logout(); // Appelle la fonction logout de useAuth
    router.replace('/(auth)/login'); // Redirige vers la page de login
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f8f8' }}>
        <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#E64A19" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ flex: 1, backgroundColor: '#f8f8f8' }}>
        {/* Header avec bouton de déconnexion */}
        <View style={styles.header}>
          <Image source={require('../../assets/images/logo.jpeg')} style={styles.logo} />
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out" size={24} color="#E64A19" />
            <Text style={styles.logoutText}>Déconnexion</Text>
          </TouchableOpacity>
        </View>

        {/* Search Filters */}
        <ScrollView style={[styles.filters, { maxHeight: 150 }]}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#999" />
            <TextInput
              placeholder="Rechercher par nom, salon ou localisation..."
              value={searchText}
              onChangeText={setSearchText}
              style={styles.searchInput}
            />
          </View>

          <Text style={styles.specialityLabel}>Spécialités :</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.specialityScroll}>
            {specialities.map((spec) => (
              <TouchableOpacity
                key={spec}
                style={[
                  styles.specialityBtn,
                  selectedSpeciality === spec && styles.specialityBtnActive,
                ]}
                onPress={() => setSelectedSpeciality(spec)}
              >
                <Text
          style={[
            styles.specialityText,
            selectedSpeciality === spec && styles.specialityBtnTextActive,
          ]}
        >
          {spec}
        </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </ScrollView>

        {/* Error */}
        {error && (
          <View style={{ padding: 12, backgroundColor: '#fdecea', marginHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#f5c6cb' }}>
            <Text style={{ color: '#d32f2f' }}>{error}</Text>
          </View>
        )}

        {/* Results */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsText}>{filteredPros.length} professionnels trouvés</Text>
          <TouchableOpacity style={styles.mapBtn}>
            <Ionicons name="map-outline" size={18} color="#E64A19" />
            <Text style={styles.mapText}>Voir sur la carte</Text>
          </TouchableOpacity>
        </View>
        {/* List */}
        <FlatList
          data={filteredPros}
          renderItem={({ item }) => (
            <ProfessionalCard
              professional={{
                id: item.id,
                name: `${item.firstName || ''} ${item.lastName || ''}`.trim(),
                salon: item.salon || '',
                location: item.location || '',
                rating: item.rating || 0,
                reviews: item.reviews || 0,
                specialities: item.specialities || [],
                phone: item.phone || '',
                email: item.email || '',
                status: (item.status === 'online' || item.status === 'busy' || item.status === 'available') ? item.status : 'available',
                verified: item.verified || false,
                image: getImageSource(item.bannerImageUrl),
              }}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: 20 }]}
          style={{ flex: 1 }}
        />
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;
