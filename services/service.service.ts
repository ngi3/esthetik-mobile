// services/service.service.ts
import { CreateServiceDto, Service, UpdateServiceDto } from '../types/service.types';
import api from './api';

class ServiceService {
  /**
   * Récupérer tous les services du professionnel connecté
   */
  async getMyServices(): Promise<Service[]> {
    try {
      const response = await api.get('/services');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching services:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Récupérer un service par ID
   */
  async getServiceById(id: string): Promise<Service> {
    try {
      const response = await api.get(`/services/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching service:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Créer un nouveau service
   */
  async createService(data: Omit<CreateServiceDto, 'professionalId'> & { professionalId: string }): Promise<Service> {
    try {
      const response = await api.post('/services', data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating service:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Mettre à jour un service
   */
  async updateService(id: string, data: UpdateServiceDto): Promise<Service> {
    try {
      const response = await api.put(`/services/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating service:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Supprimer un service
   */
  async deleteService(id: string): Promise<void> {
    try {
      await api.delete(`/services/${id}`);
    } catch (error: any) {
      console.error('Error deleting service:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Activer/Désactiver un service
   */
  async toggleServiceStatus(id: string, isActive: boolean): Promise<Service> {
    try {
      const response = await api.put(`/services/${id}`, { isActive });
      return response.data;
    } catch (error: any) {
      console.error('Error toggling service status:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Récupérer les services d'un professionnel par son ID (profil public)
   */
  async getServicesByProfessionalId(professionalId: string): Promise<Service[]> {
    try {
      const response = await api.get(`/services/professional/${professionalId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching services by professional:', error.response?.data || error.message);
      throw error;
    }
  }
}

export default new ServiceService();
