// config/api.config.ts

/**
 * Configuration centralisée de l'API
 * Modifiez l'URL selon votre environnement
 */

// Pour développement local avec Expo sur device physique
export const API_URL = 'http://192.168.1.7:3001';

// Autres options possibles :
// - Simulateur iOS : 'http://localhost:3001'
// - Émulateur Android : 'http://10.0.2.2:3001'
// - Production : 'https://api.esthetikapp.com'

export const API_TIMEOUT = 10000; // 10 secondes

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
  },

  // Services
  SERVICES: {
    LIST: '/services', // GET /services retourne les services du pro connecté (filtré par JWT)
    CREATE: '/services',
    GET_BY_ID: (id: string) => `/services/${id}`,
    UPDATE: (id: string) => `/services/${id}`,
    DELETE: (id: string) => `/services/${id}`,
  },

  // Appointments (RDV)
  APPOINTMENTS: {
    MY_APPOINTMENTS: '/appointments/my-appointments',
    CREATE: '/appointments',
    GET_BY_ID: (id: number) => `/appointments/${id}`,
    UPDATE: (id: number) => `/appointments/${id}`,
    DELETE: (id: number) => `/appointments/${id}`,
    CONFIRM: (id: number) => `/appointments/${id}/confirm`,
    CANCEL: (id: number) => `/appointments/${id}/cancel`,
  },

  // Reviews (Avis)
  REVIEWS: {
    MY_REVIEWS: '/reviews/my-reviews',
    CREATE: '/reviews',
    GET_BY_ID: (id: number) => `/reviews/${id}`,
  },

  // Portfolio
  PORTFOLIO: {
    LIST: '/portfolio',
    MY_PORTFOLIO: '/portfolio', // alias: backend accepte aussi /portfolio/my-portfolio
    CREATE: '/portfolio',
    GET_BY_ID: (id: string) => `/portfolio/${id}`,
    UPDATE: (id: string) => `/portfolio/${id}`,
    DELETE: (id: string) => `/portfolio/${id}`,
    UPLOAD: '/portfolio/upload',
  },

  // Expenses (Dépenses)
  EXPENSES: {
    MY_EXPENSES: '/expenses/my-expenses',
    CREATE: '/expenses',
    GET_BY_ID: (id: number) => `/expenses/${id}`,
    UPDATE: (id: number) => `/expenses/${id}`,
    DELETE: (id: number) => `/expenses/${id}`,
    STATS: '/expenses/stats',
  },

  // Profile
  PROFILE: {
    ME: '/users/me',
    UPDATE: '/users/me',
    UPDATE_AVATAR: '/users/me/avatar',
    UPDATE_BANNER: '/users/me/banner',
    GET_BANNER: '/users/me/banner',
    DELETE_BANNER: '/users/me/banner',
  },
};
