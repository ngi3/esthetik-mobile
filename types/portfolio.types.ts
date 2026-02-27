// types/portfolio.types.ts

export interface PortfolioItem {
  id: string; // UUID
  title?: string;
  description?: string;
  imageUrl: string;
  professionalId: string; // UUID
  likes?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePortfolioDto {
  title?: string;
  description?: string;
  imageUrl: string; // URL de l'image uploadée
  professionalId: string; // UUID
}

export interface UpdatePortfolioDto {
  title?: string;
  description?: string;
  imageUrl?: string;
}

export interface PortfolioUploadResponse {
  url: string;
  publicId?: string;
}
