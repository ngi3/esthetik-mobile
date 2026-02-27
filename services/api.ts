// services/api.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_TIMEOUT, API_URL } from '../config/api.config';
import statusBus from './status-bus';

// Instance axios avec configuration
const api = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT à chaque requête
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs d'authentification
api.interceptors.response.use(
  (response) => {
    // Any successful response signals server reachable
    statusBus.setBackendUp();
    return response;
  },
  async (error) => {
    // Mark backend up on any successful response handled above
    // If we get here, an error occurred
    const status = error?.response?.status as number | undefined;
    const code = error?.code as string | undefined;

    if (error.response?.status === 401) {
      // Token expiré ou invalide - nettoyer les données d'auth
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('auth_user');
      // L'application devrait rediriger vers le login
    }

    // Network/timeout or 5xx => signal backend down so UI can react
    const isNetworkError = !error.response;
    const isTimeout = code === 'ECONNABORTED';
    const isServerError = typeof status === 'number' && status >= 500;
    if (isNetworkError || isTimeout || isServerError) {
      const reason = isNetworkError
        ? 'Réseau indisponible ou serveur injoignable.'
        : isTimeout
        ? 'Délai d’attente dépassé.'
        : `Erreur serveur (${status}).`;
      statusBus.setBackendDown(reason);
    } else {
      // For other statuses, consider server reachable
      statusBus.setBackendUp();
    }
    return Promise.reject(error);
  }
);

export default api;
