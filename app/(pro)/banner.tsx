// app/(pro)/banner.tsx
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { API_URL } from '../../config/api.config';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/user.service';
import { toast } from '../../utils/toast';

const toAbsoluteUrl = (url?: string | null) => {
  if (!url) return null;
  const base = API_URL.replace(/\/$/, '');
  try {
    // If it's already absolute
    if (/^https?:\/\//i.test(url)) {
      const u = new URL(url);
      // If it points to uploads but a different host, rewrite to API_URL host
      if (u.pathname.startsWith('/uploads/')) {
        const b = new URL(base);
        return `${b.origin}${u.pathname}`;
      }
      return url;
    }
  } catch {
    // Fallback to simple join below
  }
  // Relative URL: join with API_URL
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${base}${path}`;
};

export default function BannerScreen() {
  const { user, setUser } = useAuth();
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadBanner = useCallback(async () => {
    try {
      setLoading(true);
  const response = await userService.getBanner();
  setBannerUrl(toAbsoluteUrl(response.url));
    } catch (error) {
      console.error('Erreur chargement bannière:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBanner();
    }, [loadBanner])
  );

  const handlePickImage = async () => {
    // Demander la permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
       toast.error('Nous avons besoin d\'accéder à vos photos pour choisir une bannière.');
      return;
    }

    // Ouvrir le sélecteur d'images
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9], // Format bannière
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await handleUploadBanner(result.assets[0].uri);
    }
  };

  const handleUploadBanner = async (imageUri: string) => {
    try {
      setUploading(true);
  const response = await userService.uploadBanner(imageUri);
  setBannerUrl(toAbsoluteUrl(response.url));

      // Mettre à jour le user dans le contexte
      if (user) {
  setUser({ ...user, bannerImageUrl: toAbsoluteUrl(response.url) || undefined });
      }

          toast.success('Bannière mise à jour avec succès !');
    } catch (error: any) {
      console.error('Erreur upload bannière:', error);
          toast.error('Impossible de télécharger la bannière. Veuillez réessayer.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteBanner = () => {
    Alert.alert(
      'Supprimer la bannière',
      'Êtes-vous sûr de vouloir supprimer votre bannière ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await userService.deleteBanner();
              setBannerUrl(null);

              // Mettre à jour le user dans le contexte
              if (user) {
                setUser({ ...user, bannerImageUrl: undefined });
              }

                  toast.success('Bannière supprimée avec succès !');
            } catch (error) {
              console.error('Erreur suppression bannière:', error);
                  toast.error('Impossible de supprimer la bannière.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading && !bannerUrl) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E64A19" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Ionicons name="image-outline" size={48} color="#E64A19" />
        <Text style={styles.title}>Photo de Bannière</Text>
        <Text style={styles.subtitle}>
          Choisissez une image qui représente votre activité professionnelle.
          Format recommandé : 16:9 (paysage)
        </Text>
      </View>

      <View style={styles.previewContainer}>
        {bannerUrl ? (
          <Image source={{ uri: bannerUrl }} style={styles.bannerPreview} resizeMode="cover" />
        ) : (
          <View style={styles.placeholderBanner}>
            <Ionicons name="image-outline" size={64} color="#ccc" />
            <Text style={styles.placeholderText}>Aucune bannière</Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.buttonPrimary, uploading && styles.buttonDisabled]}
          onPress={handlePickImage}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
              <Text style={styles.buttonText}>
                {bannerUrl ? 'Changer la bannière' : 'Ajouter une bannière'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {bannerUrl && (
          <TouchableOpacity
            style={[styles.button, styles.buttonDanger]}
            onPress={handleDeleteBanner}
            disabled={loading}
          >
            <Ionicons name="trash-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Supprimer la bannière</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={20} color="#666" />
        <Text style={styles.infoText}>
          Votre bannière sera affichée en haut de votre profil public. Choisissez une image
          professionnelle et de bonne qualité pour attirer plus de clients.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdf8f5',
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fdf8f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E64A19',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  previewContainer: {
    marginBottom: 30,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    backgroundColor: '#fff',
  },
  bannerPreview: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  placeholderBanner: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  actions: {
    marginBottom: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  buttonPrimary: {
    backgroundColor: '#E64A19',
  },
  buttonDanger: {
    backgroundColor: '#E53935',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    marginLeft: 12,
    lineHeight: 18,
  },
});
