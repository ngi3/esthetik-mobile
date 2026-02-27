// services/portfolio.service.ts
import { CreatePortfolioDto, PortfolioItem, PortfolioUploadResponse, UpdatePortfolioDto } from '../types/portfolio.types';
import api from './api';

class PortfolioService {
  /**
   * Récupérer tous les items du portfolio du professionnel connecté
   */
  async getMyPortfolio(): Promise<PortfolioItem[]> {
    try {
      const response = await api.get('/portfolio');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching portfolio:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Récupérer un item par ID
   */
  async getPortfolioItemById(id: string): Promise<PortfolioItem> {
    try {
      const response = await api.get(`/portfolio/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching portfolio item:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Créer un nouvel item de portfolio
   */
  async createPortfolioItem(data: CreatePortfolioDto): Promise<PortfolioItem> {
    try {
      const response = await api.post('/portfolio', data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating portfolio item:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Mettre à jour un item
   */
  async updatePortfolioItem(id: string, data: UpdatePortfolioDto): Promise<PortfolioItem> {
    try {
      const response = await api.put(`/portfolio/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating portfolio item:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Supprimer un item
   */
  async deletePortfolioItem(id: string): Promise<void> {
    try {
      await api.delete(`/portfolio/${id}`);
    } catch (error: any) {
      console.error('Error deleting portfolio item:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Upload une image pour le portfolio
   * Note: Cette méthode nécessite FormData pour l'upload de fichier
   */
  async uploadImage(imageUri: string, professionalId: string): Promise<PortfolioUploadResponse> {
    try {
      const formData = new FormData();

      // Extraire le nom et le type de fichier depuis l'URI
      const filename = imageUri.split('/').pop() || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('file', {
        uri: imageUri,
        name: filename,
        type,
      } as any);

      formData.append('professionalId', professionalId);

      const response = await api.post('/portfolio/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Error uploading image:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Récupérer le portfolio d'un professionnel par son ID (profil public)
   */
  async getPortfolioByProfessionalId(professionalId: string): Promise<PortfolioItem[]> {
    try {
      const response = await api.get(`/portfolio/professional/${professionalId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching portfolio by professional:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Liker une photo de portfolio
   */
  async likePortfolioItem(id: string): Promise<PortfolioItem> {
    try {
      const response = await api.post(`/portfolio/${id}/like`);
      return response.data;
    } catch (error: any) {
      console.error('Error liking portfolio item:', error.response?.data || error.message);
      throw error;
    }
  }
}

export default new PortfolioService();
