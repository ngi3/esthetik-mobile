// services/user.service.ts
import { User } from '../hooks/auth-context';
import api from './api';
import bookingService from './booking.service';

export const userService = {
  // Récupérer tous les professionnels
  async getAllProfessionals(): Promise<User[]> {
    const response = await api.get('/users/professionals');
    return response.data;
  },
  // Récupérer le profil de l'utilisateur connecté
  async getMe(): Promise<User> {
    const response = await api.get('/users/me');
    return response.data;
  },

  // Mettre à jour le profil de l'utilisateur connecté
  async updateMe(data: Partial<User>): Promise<User> {
    const response = await api.put('/users/me', data);
    return response.data;
  },

  // Upload bannière
  async uploadBanner(imageUri: string): Promise<{ url: string }> {
    const formData = new FormData();

    // Extraire le nom du fichier et l'extension
    const filename = imageUri.split('/').pop() || 'banner.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    // @ts-ignore - FormData en React Native supporte cette syntaxe
    formData.append('file', {
      uri: imageUri,
      name: filename,
      type,
    });

    const response = await api.post('/users/me/banner', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  // Récupérer l'URL de la bannière
  async getBanner(): Promise<{ url: string | null }> {
    const response = await api.get('/users/me/banner');
    return response.data;
  },

  // Supprimer la bannière
  async deleteBanner(): Promise<{ message: string }> {
    const response = await api.delete('/users/me/banner');
    return response.data;
  },

  // Récupérer un utilisateur par ID
  async getUserById(id: string): Promise<User> {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Récupérer les statistiques du client (réservations actives, en attente, favoris)
  async getStats(): Promise<{ activeBookings: number; pendingBookings: number; favoritesCount: number }> {
    try {
      const response = await api.get('/users/me/stats');
      return response.data;
    } catch {
      // Fallback client-side computation if backend is temporarily failing
      try {
        const [bookings, favorites] = await Promise.all([
          bookingService.getMyBookings(),
          (await import('./favorite.service')).default.getMyFavorites(),
        ]);
        const norm = (s?: string) => (s || '').toLowerCase();
        const isActive = (s?: string) => ['confirmed', 'confirmé', 'approved', 'accepted'].includes(norm(s));
        const isPending = (s?: string) => ['pending', 'en attente', 'awaiting', 'waiting'].includes(norm(s));
        const activeBookings = bookings.filter((b) => isActive(b.status as string)).length;
        const pendingBookings = bookings.filter((b) => isPending(b.status as string)).length;
        const favoritesCount = favorites.length;
        return { activeBookings, pendingBookings, favoritesCount };
      } catch {
        // Last resort: return zeros to avoid breaking UI
        return { activeBookings: 0, pendingBookings: 0, favoritesCount: 0 };
      }
    }
  },

  // Récupérer les statistiques du professionnel (vues, réservations, notes, revenus)
  async getProStats(): Promise<{
    profileViews: number;
    totalBookings: number;
    bookingsThisMonth: number;
    averageRating: string;
    totalRevenue: number;
  }> {
    const response = await api.get('/users/me/pro-stats');
    return response.data;
  },
};
