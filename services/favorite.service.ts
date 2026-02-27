// services/favorite.service.ts
import * as SecureStore from 'expo-secure-store';
import api from './api';

export interface FavoriteProfessional {
  id: string;
  name: string;
  profession?: string;
  rating?: number;
  salon?: string;
  location?: string;
  imageUrl?: string | null;
}

const FAVORITES_KEY = 'favorites_local_ids';

async function loadFavoriteIds(): Promise<string[]> {
  try {
    const json = await SecureStore.getItemAsync(FAVORITES_KEY);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

async function saveFavoriteIds(ids: string[]): Promise<void> {
  try {
    await SecureStore.setItemAsync(FAVORITES_KEY, JSON.stringify(ids));
  } catch {
    // noop
  }
}

class FavoriteService {
  async getMyFavorites(): Promise<FavoriteProfessional[]> {
    try {
      const response = await api.get('/favorites');
      return response.data;
    } catch (e: any) {
      // Fallback local si l'endpoint n'existe pas (404)
      if (e?.response?.status === 404) {
        const ids = await loadFavoriteIds();
        const users = await Promise.all(
          ids.map(async (id) => {
            try {
              const { userService } = await import('./user.service');
              const u = await userService.getUserById(id);
              return {
                id: u.id,
                name: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
                profession: u.salon || undefined,
                rating: u.rating || undefined,
                salon: u.salon || undefined,
                location: u.location || undefined,
                imageUrl: u.bannerImageUrl || null,
              } as FavoriteProfessional;
            } catch {
              return null;
            }
          })
        );
        return users.filter(Boolean) as FavoriteProfessional[];
      }
      throw e;
    }
  }

  async addFavorite(professionalId: string): Promise<{ message: string }>{
    try {
      const response = await api.post(`/favorites/${professionalId}`);
      return response.data;
    } catch (e: any) {
      if (e?.response?.status === 404) {
        // Fallback local: enregistrer l'ID en local
        const ids = await loadFavoriteIds();
        if (!ids.includes(professionalId)) {
          ids.push(professionalId);
          await saveFavoriteIds(ids);
        }
        return { message: 'Saved locally' };
      }
      throw e;
    }
  }

  async removeFavorite(professionalId: string): Promise<{ message: string }>{
    try {
      const response = await api.delete(`/favorites/${professionalId}`);
      return response.data;
    } catch (e: any) {
      if (e?.response?.status === 404) {
        // Fallback local: retirer l'ID en local
        const ids = await loadFavoriteIds();
        const next = ids.filter((id) => id !== professionalId);
        await saveFavoriteIds(next);
        return { message: 'Removed locally' };
      }
      throw e;
    }
  }
}

export default new FavoriteService();
