// app/(pro)/portfolio.tsx
import { getFullImageUrl } from '@/utils/image';
import { toast } from '@/utils/toast';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
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
import portfolioService from '../../services/portfolio.service';
import { PortfolioItem } from '../../types/portfolio.types';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 2; // 2 colonnes, padding 16

export default function PortfolioScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({ headerTitle: 'Portfolio' });
  }, [navigation]);

  useEffect(() => {
    loadPortfolio();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPortfolio();
    }, [])
  );

  const loadPortfolio = async () => {
    try {
      setLoading(true);
      const data = await portfolioService.getMyPortfolio();
      setPortfolioItems(data);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Impossible de charger le portfolio');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPortfolio();
    setRefreshing(false);
  };

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      toast.error('Nous avons besoin de la permission pour accéder à vos photos');
      return false;
    }
    return true;
  };

  const handleAddPhoto = async () => {
    // Vérifier la limite de 20 photos
    if (portfolioItems.length >= 20) {
      toast.info('Vous avez atteint la limite de 20 photos dans votre portfolio. Supprimez une photo avant d\'en ajouter une nouvelle.');
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0] && user?.id) {
        setPendingImageUri(result.assets[0].uri);
        setNewTitle('');
        setNewDescription('');
        setShowAddModal(true);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Impossible d'ajouter la photo");
    } finally {
      // uploading est géré lors de la confirmation
    }
  };

  const handleConfirmAdd = async () => {
    if (!pendingImageUri || !user?.id) {
      setShowAddModal(false);
      return;
    }
    if (!newTitle.trim()) {
      toast.error('Veuillez saisir un titre pour votre photo.');
      return;
    }
    try {
      setUploading(true);
      // Upload d'abord l'image
      const uploadResponse = await portfolioService.uploadImage(pendingImageUri, user.id);
      // Puis crée l'item avec les champs saisis
      await portfolioService.createPortfolioItem({
        imageUrl: uploadResponse.url,
        professionalId: user.id,
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
      });
      setShowAddModal(false);
      setPendingImageUri(null);
      setNewTitle('');
      setNewDescription('');
      toast.success('Photo ajoutée au portfolio !');
      await loadPortfolio();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Impossible d'ajouter la photo");
    } finally {
      setUploading(false);
    }
  };

  const handleCancelAdd = () => {
    setShowAddModal(false);
    setPendingImageUri(null);
    setNewTitle('');
    setNewDescription('');
  };

  const handleDelete = (item: PortfolioItem) => {
    Alert.alert(
      'Confirmation',
      'Voulez-vous vraiment supprimer cette photo ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await portfolioService.deletePortfolioItem(item.id);
              toast.success('Photo supprimée');
              await loadPortfolio();
            } catch (error: any) {
              toast.error(error?.response?.data?.message || 'Impossible de supprimer la photo');
            }
          },
        },
      ]
    );
  };

  if (loading && portfolioItems.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E64A19" />
        <Text style={styles.loadingText}>Chargement du portfolio...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
    <ScrollView
      style={styles.scrollView}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#E64A19']} />
      }
    >
      <View style={styles.headerContainer}>
        <Text style={styles.photoCount}>
          {portfolioItems.length}/20 photos
        </Text>
        <TouchableOpacity
          style={[styles.addButton, (uploading || portfolioItems.length >= 20) && styles.addButtonDisabled]}
          onPress={handleAddPhoto}
          disabled={uploading || portfolioItems.length >= 20}
        >
          {uploading ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.addButtonText}>Upload...</Text>
            </>
          ) : (
            <>
              <Ionicons name="camera-outline" size={18} color="#fff" />
              <Text style={styles.addButtonText}>Ajouter Photo</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {portfolioItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="images-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Aucune photo</Text>
          <Text style={styles.emptySubtext}>Ajoutez vos premières créations</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {portfolioItems.map((item) => (
            <View key={item.id} style={styles.gridItem}>
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: getFullImageUrl(item.imageUrl) || item.imageUrl }}
                  style={styles.portfolioImage}
                />

                {item.likes && item.likes > 0 ? (
                  <View style={styles.likesOverlay}>
                    <Ionicons name="heart" size={16} color="#fff" />
                    <Text style={styles.likesCount}>{item.likes}</Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={styles.deleteBadge}
                  onPress={() => handleDelete(item)}
                >
                  <Ionicons name="trash-outline" size={16} color="#fff" />
                </TouchableOpacity>
              </View>

              <View>
                {item.title ? (
                  <Text style={styles.itemTitle}>{item.title}</Text>
                ) : null}
                {item.description ? (
                  <Text style={styles.itemDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>

    <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={handleCancelAdd}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Ajouter au portfolio</Text>

          {pendingImageUri ? (
            <Image source={{ uri: pendingImageUri }} style={styles.modalPreview} />
          ) : null}

          <Text style={styles.inputLabel}>Titre</Text>
          <TextInput
            value={newTitle}
            onChangeText={setNewTitle}
            placeholder="Ex: Manucure rouge glossy"
            style={styles.input}
            placeholderTextColor="#999"
          />

          <Text style={styles.inputLabel}>Description (optionnel)</Text>
          <TextInput
            value={newDescription}
            onChangeText={setNewDescription}
            placeholder="Détails, techniques, produits utilisés..."
            style={[styles.input, styles.textarea]}
            multiline
            numberOfLines={3}
            placeholderTextColor="#999"
          />

          <View style={styles.modalActions}>
            <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={handleCancelAdd} disabled={uploading}>
              <Text style={styles.modalButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={handleConfirmAdd} disabled={uploading}>
              {uploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={[styles.modalButtonText, styles.confirmButtonText]}>Enregistrer</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
    </View>
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
    paddingTop: 60,
    backgroundColor: '#fdf8f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  photoCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  addButton: {
    backgroundColor: '#E64A19',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
    elevation: 2,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: ITEM_WIDTH,
    marginBottom: 20,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: ITEM_WIDTH,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 8,
  },
  portfolioImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  likesOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  likesCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  deleteBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#E53935',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    fontWeight: '600',
  },
  itemDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fafafa',
  },
  textarea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#eee',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  cancelButton: {
    backgroundColor: '#eee',
  },
  confirmButton: {
    backgroundColor: '#E64A19',
  },
  confirmButtonText: {
    color: '#fff',
  },
});
