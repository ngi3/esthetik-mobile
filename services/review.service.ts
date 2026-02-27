// services/review.service.ts
import api from './api';

export interface Review {
  id: string;
  clientId: string;
  professionalId: string;
  rating: number;
  comment: string;
  createdAt: string;
  client?: {
    firstName: string;
    lastName: string;
  };
  booking?: {
    id: string;
    service?: {
      id: string;
      name: string;
      price: number;
    };
    services?: {
      id: string;
      name: string;
      price: number;
    }[];
  };
}

export interface CreateReviewDto {
  professionalId: string;
  rating: number;
  comment: string;
  // Ajout pour lier l'avis à une réservation précise
  bookingId?: string;
  // Auteur de l'avis (utilisateur connecté)
  authorId: string;
}

class ReviewService {
  /**
   * Récupérer les avis d'un professionnel par son ID
   */
  async getReviewsByProfessionalId(professionalId: string): Promise<Review[]> {
    try {
      const response = await api.get(`/reviews/professional/${professionalId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching reviews:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Récupérer mes avis (auteur connecté)
   */
  async getMyReviews(): Promise<Review[]> {
    try {
      const response = await api.get('/reviews/me');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching my reviews:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Créer un nouvel avis
   */
  async createReview(data: CreateReviewDto): Promise<Review> {
    try {
      const response = await api.post('/reviews', data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating review:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Récupérer tous les avis
   */
  async getAllReviews(): Promise<Review[]> {
    try {
      const response = await api.get('/reviews');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching all reviews:', error.response?.data || error.message);
      throw error;
    }
  }
}

export default new ReviewService();
