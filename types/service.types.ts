// types/service.types.ts

export interface Service {
  id: string; // UUID
  name: string;
  description: string;
  price: number; // En XOF
  duration: string; // Format: "60 min", "1h30", etc.
  professionalId: string; // UUID
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateServiceDto {
  name: string;
  description: string;
  price: number;
  duration: string; // Format: "60 min", "1h30", etc.
  professionalId: string; // UUID - sera ajouté automatiquement depuis le user connecté
}

export interface UpdateServiceDto {
  name?: string;
  description?: string;
  price?: number;
  duration?: string;
  isActive?: boolean;
}

export interface ServiceResponse {
  success: boolean;
  data?: Service | Service[];
  message?: string;
  error?: string;
}
