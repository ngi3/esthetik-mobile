// services/booking.service.ts
import api from './api';

export interface CreateBookingDto {
  clientId: string;
  professionalId: string;
  // Pour compatibilité descendante (ancienne réservation mono-service)
  serviceId?: string;
  // Nouveau: réservation multi-services
  serviceIds?: string[];
  totalPrice?: number;
  appointmentDate: string; // ISO string
  comment?: string;
}

export interface BookingItem {
  id: string;
  professionalId: string;
  professionalName?: string;
  serviceId: string;
  serviceName?: string;
  dateTime: string;
  location?: string;
  price?: number;
  status: 'pending' | 'confirmed' | 'approved' | 'accepted' | 'cancelled' | 'canceled' | string;
  createdAt?: string;
}

class BookingService {
  async createBooking(data: CreateBookingDto): Promise<BookingItem> {
    const response = await api.post('/bookings', data);
    return response.data;
  }

  async getMyBookings(): Promise<BookingItem[]> {
    const response = await api.get('/bookings');
    return response.data;
  }

  async getBookingsByProfessional(professionalId: string): Promise<BookingItem[]> {
    const response = await api.get(`/bookings/professional/${professionalId}`);
    return response.data;
  }

  async updateBookingStatus(id: string, status: string): Promise<BookingItem> {
    const response = await api.put(`/bookings/${id}`, { status });
    return response.data;
  }

  async cancelBooking(id: string): Promise<{ message: string }>{
    const response = await api.delete(`/bookings/${id}`);
    return response.data;
  }
}

export default new BookingService();
